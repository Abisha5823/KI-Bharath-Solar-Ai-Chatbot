import { OpenAI } from 'openai';
import { processPDF, searchContext } from '../services/ragService.js';
import { calculateSolarSystem } from '../services/calculationService.js';
import { saveLead } from '../services/leadService.js';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load and process PDF on startup
let companyContext = null;

async function initializeRAG() {
  if (!companyContext) {
    const pdfPath = path.join(process.cwd(), 'data', 'company-data.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    companyContext = await processPDF(pdfBuffer);
  }
  return companyContext;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, conversationHistory = [], language = 'auto' } = req.body;

  try {
    await initializeRAG();

    // Detect language
    let detectedLanguage = language;
    if (language === 'auto') {
      const hasTamil = /[\u0B80-\u0BFF]/.test(message);
      detectedLanguage = hasTamil ? 'ta' : 'en';
    }

    // Check if user wants to calculate something
    const calculationResult = calculateSolarSystem(message);
    let calculationContext = '';
    if (calculationResult) {
      calculationContext = `\n\n[SYSTEM CALCULATION RESULT]: ${JSON.stringify(calculationResult, null, 2)}\nPlease explain this result to the user in a friendly way.`;
    }

    // Search RAG context
    const relevantContext = await searchContext(companyContext, message);

    // Check for lead information extraction
    const leadInfo = extractLeadInfo(message);
    if (leadInfo.name && leadInfo.phone) {
      await saveLead(leadInfo);
    }

    const systemPrompt = detectedLanguage === 'ta' 
      ? `நீங்கள் KI BHARATH SOLAR ENERGIES இன் AI உதவியாளர். 
         பின்வரும் தகவல்களைப் பயன்படுத்தி தமிழில் பதிலளிக்கவும்:
         
         ${relevantContext}
         ${calculationContext}
         
         விதிகள்:
         1. நட்பு மற்றும் உதவும் வகையில் பதிலளிக்கவும்
         2. சந்தேகம் இருந்தால், மேலும் தகவல் கேட்கவும்
         3. வாடிக்கையாளர் விவரங்கள் (பெயர், போன், இடம், EB பில்) கிடைத்தால், "உங்கள் விவரங்கள் பதிவு செய்யப்பட்டுள்ளன" என்று உறுதிப்படுத்தவும்
         4. EMI, மானியம், விலை போன்ற விவரங்களை துல்லியமாக கூறவும்`
      : `You are an AI assistant for KI BHARATH SOLAR ENERGIES. 
         Use the following context to answer questions:
         
         ${relevantContext}
         ${calculationContext}
         
         Rules:
         1. Respond in a friendly, helpful manner
         2. If unsure, ask for clarification
         3. When customer provides details (name, phone, location, EB bill), confirm with "Your details have been recorded"
         4. Provide accurate pricing, subsidy, and technical information`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = completion.choices[0].message.content;

    res.status(200).json({
      reply,
      language: detectedLanguage,
      leadCollected: leadInfo.name && leadInfo.phone ? true : false,
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function extractLeadInfo(message) {
  const lead = {};
  
  // Extract phone number (Indian format)
  const phoneMatch = message.match(/(?:[+91]{2,3}?)?[6-9]\d{9}/);
  if (phoneMatch) lead.phone = phoneMatch[0];
  
  // Extract name (after "name is" or similar patterns)
  const nameMatch = message.match(/(?:name is|my name|i am)\s+([A-Za-z\s]+?)(?:\.|,|$)/i);
  if (nameMatch) lead.name = nameMatch[0].trim();
  
  // Extract location (city names from service areas)
  const cities = ['Thoothukudi', 'Tirunelveli', 'Madurai', 'Virudhunagar', 'Ramanathapuram', 'Kanyakumari'];
  for (const city of cities) {
    if (message.includes(city)) {
      lead.location = city;
      break;
    }
  }
  
  // Extract EB bill amount
  const ebMatch = message.match(/(?:EB bill|electricity bill|monthly bill)\s*(?:is|of|rs|₹)?\s*(\d+)/i);
  if (ebMatch) lead.ebBillAmount = parseInt(ebMatch[1]);
  
  return lead;
}