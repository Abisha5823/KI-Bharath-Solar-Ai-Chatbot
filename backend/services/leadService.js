import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

let mongoClient = null;

async function getMongoClient() {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient;
}

export async function saveLead(leadData) {
  const lead = {
    ...leadData,
    timestamp: new Date(),
    source: 'chatbot',
    status: 'new'
  };
  
  // Save to MongoDB
  try {
    const client = await getMongoClient();
    const db = client.db('solar_leads');
    const collection = db.collection('leads');
    await collection.insertOne(lead);
  } catch (error) {
    console.error('MongoDB save error:', error);
  }
  
  // Save to Google Sheets
  await saveToGoogleSheets(lead);
  
  // Send email notification
  await sendEmailNotification(lead);
  
  // Send WhatsApp (using wa.me link)
  await sendWhatsAppNotification(lead);
  
  return lead;
}

async function saveToGoogleSheets(lead) {
  // Using googleapis for Sheets
  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  const values = [[
    lead.timestamp.toISOString(),
    lead.name || '',
    lead.phone || '',
    lead.location || '',
    lead.ebBillAmount || '',
    lead.status
  ]];
  
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Leads!A:F',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
  } catch (error) {
    console.error('Google Sheets error:', error);
  }
}

async function sendEmailNotification(lead) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'owner@kibharathsolar.com', // Owner's email
    subject: 'New Lead from Solar Chatbot',
    html: `
      <h2>New Lead Received</h2>
      <p><strong>Name:</strong> ${lead.name || 'Not provided'}</p>
      <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
      <p><strong>Location:</strong> ${lead.location || 'Not provided'}</p>
      <p><strong>EB Bill Amount:</strong> ${lead.ebBillAmount || 'Not provided'}</p>
      <p><strong>Time:</strong> ${lead.timestamp.toLocaleString()}</p>
      <a href="https://wa.me/${lead.phone}">Chat on WhatsApp</a>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email error:', error);
  }
}

function sendWhatsAppNotification(lead) {
  // Generate WhatsApp click-to-chat link
  const message = `New Lead!%0AName: ${lead.name || 'Not provided'}%0APhone: ${lead.phone}%0ALocation: ${lead.location || 'Not provided'}%0AEB Bill: ${lead.ebBillAmount || 'Not provided'}`;
  const whatsappLink = `https://wa.me/${process.env.WHATSAPP_PHONE}?text=${message}`;
  
  // Log the link (in production, you could use WhatsApp Business API)
  console.log('WhatsApp notification link:', whatsappLink);
  
  return whatsappLink;
}