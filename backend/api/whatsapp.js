import twilio from 'twilio';
import { OpenAI } from 'openai';
import { processPDF, searchContext } from '../services/ragService.js';
import { calculateSolarSystem } from '../services/calculationService.js';
import { saveLead } from '../services/leadService.js';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ─────────────────────────────────────────────
// Reuse the same RAG init from chat.js
// ─────────────────────────────────────────────
let companyContext = null;

async function initializeRAG() {
  if (!companyContext) {
    const pdfPath = path.join(process.cwd(), 'data', 'company-data.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    companyContext = await processPDF(pdfBuffer);
  }
  return companyContext;
}

// ─────────────────────────────────────────────
// Reuse the same lead extractor from chat.js
// ─────────────────────────────────────────────
function extractLeadInfo(message) {
  const lead = {};

  const phoneMatch = message.match(/(?:[+91]{2,3}?)?[6-9]\d{9}/);
  if (phoneMatch) lead.phone = phoneMatch[0];

  const nameMatch = message.match(
    /(?:name is|my name|i am)\s+([A-Za-z\s]+?)(?:\.|,|$)/i
  );
  if (nameMatch) lead.name = nameMatch[1].trim();

  const cities = [
    'Thoothukudi','Tirunelveli','Madurai',
    'Virudhunagar','Ramanathapuram','Kanyakumari','Chennai',
  ];
  for (const city of cities) {
    if (message.includes(city)) { lead.location = city; break; }
  }

  const ebMatch = message.match(
    /(?:EB bill|electricity bill|monthly bill)\s*(?:is|of|rs|₹)?\s*(\d+)/i
  );
  if (ebMatch) lead.ebBillAmount = parseInt(ebMatch[1]);

  return lead;
}

// ─────────────────────────────────────────────
// Per-user conversation history (in-memory)
// Resets on server restart — good enough for MVP
// ─────────────────────────────────────────────
const sessionHistory = {};

function getHistory(phone) {
  if (!sessionHistory[phone]) sessionHistory[phone] = [];
  return sessionHistory[phone];
}

function addToHistory(phone, role, content) {
  const history = getHistory(phone);
  history.push({ role, content });
  // Keep only last 10 messages — same as chat.js uses .slice(-10)
  if (history.length > 10) history.splice(0, history.length - 10);
}

// ─────────────────────────────────────────────
// Main webhook handler
// ─────────────────────────────────────────────
export default async function handler(req, res) {

  // CRITICAL: Twilio needs 200 OK fast or it retries and sends double messages
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  // Extract message and sender from Twilio's POST body
  const userMessage = req.body.Body?.trim();
  const fromNumber  = req.body.From; // format: "whatsapp:+919840012345"
  const customerPhone = fromNumber?.replace('whatsapp:', '');

  // Ignore empty messages
  if (!userMessage || !fromNumber) {
    return res.status(200).send('OK');
  }

  try {
    // Step 1: Init RAG — same as chat.js
    await initializeRAG();

    // Step 2: Detect Tamil vs English — same logic as chat.js
    const hasTamil = /[\u0B80-\u0BFF]/.test(userMessage);
    const detectedLanguage = hasTamil ? 'ta' : 'en';

    // Step 3: Solar calculation — same as chat.js
    const calculationResult = calculateSolarSystem(userMessage);
    let calculationContext = '';
    if (calculationResult) {
      calculationContext = `\n\n[SYSTEM CALCULATION RESULT]: ${JSON.stringify(calculationResult, null, 2)}\nPlease explain this result to the user in a friendly way.`;
    }

    // Step 4: RAG search — same as chat.js
    const relevantContext = await searchContext(companyContext, userMessage);

    // Step 5: Lead extraction — same as chat.js
    const leadInfo = extractLeadInfo(userMessage);
    if (leadInfo.name && leadInfo.phone) {
      await saveLead({
        ...leadInfo,
        source: 'whatsapp',           // Extra: track where lead came from
        whatsappNumber: customerPhone, // Extra: save their WA number too
      });
    }

    // Step 6: Build system prompt — identical to chat.js
    const systemPrompt = detectedLanguage === 'ta'
      ? `நீங்கள் KI BHARATH SOLAR ENERGIES இன் AI உதவியாளர். 
         பின்வரும் தகவல்களைப் பயன்படுத்தி தமிழில் பதிலளிக்கவும்:
         
         ${relevantContext}
         ${calculationContext}
         
         விதிகள்:
         1. நட்பு மற்றும் உதவும் வகையில் பதிலளிக்கவும்
         2. சந்தேகம் இருந்தால், மேலும் தகவல் கேட்கவும்
         3. வாடிக்கையாளர் விவரங்கள் (பெயர், போன், இடம், EB பில்) கிடைத்தால், "உங்கள் விவரங்கள் பதிவு செய்யப்பட்டுள்ளன" என்று உறுதிப்படுத்தவும்
         4. EMI, மானியம், விலை போன்ற விவரங்களை துல்லியமாக கூறவும்
         5. WhatsApp வழியாக பேசுவதால் பதில்களை சுருக்கமாக வைக்கவும் (3-4 வரிகள் மட்டும்)`
      : `You are an AI assistant for KI BHARATH SOLAR ENERGIES.
         Use the following context to answer questions:
         
         ${relevantContext}
         ${calculationContext}
         
         Rules:
         1. Respond in a friendly, helpful manner
         2. If unsure, ask for clarification
         3. When customer provides details (name, phone, location, EB bill), confirm with "Your details have been recorded"
         4. Provide accurate pricing, subsidy, and technical information
         5. Keep replies SHORT — max 3-4 lines. This is WhatsApp, not a website.`;

    // Step 7: Get conversation history for this WhatsApp number
    const history = getHistory(customerPhone);

    // Step 8: Call OpenAI — same model and pattern as chat.js
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',        // Cheaper than gpt-4-turbo, fine for WhatsApp
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,                 // Last 10 messages for memory
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 300,              // Keep WhatsApp replies short
    });

    const aiReply = completion.choices[0].message.content;

    // Step 9: Save to conversation history
    addToHistory(customerPhone, 'user', userMessage);
    addToHistory(customerPhone, 'assistant', aiReply);

    // Step 10: Send reply back via Twilio
    await twilioClient.messages.create({
      body: aiReply,
      from: process.env.TWILIO_WHATSAPP_FROM, // whatsapp:+14155238886
      to: fromNumber,
    });

    // Step 11: Log for your monitoring
    console.log(`[WhatsApp] ${customerPhone}: "${userMessage}" → "${aiReply}"`);

    return res.status(200).send('OK');

  } catch (error) {
    console.error('[WhatsApp] Error:', error);
    
    // Even on error — return 200 to Twilio
    // If you return 500, Twilio retries and customer gets duplicate messages
    try {
      await twilioClient.messages.create({
        body: detectedLanguage === 'ta'
          ? 'மன்னிக்கவும், சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
          : 'Sorry, please try again in a moment.',
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: fromNumber,
      });
    } catch (e) {
      console.error('[WhatsApp] Could not send error message:', e);
    }

    return res.status(200).send('OK');
  }
}