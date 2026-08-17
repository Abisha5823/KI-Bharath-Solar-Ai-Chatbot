import { saveLead, getLeads, updateLeadStatus } from '../services/leadService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'POST':
        // Save new lead
        const leadData = req.body;
        if (!leadData.phone && !leadData.email) {
          return res.status(400).json({ error: 'Phone or email is required' });
        }
        const savedLead = await saveLead(leadData);
        res.status(201).json({ 
          success: true, 
          message: 'Lead saved successfully',
          lead: savedLead 
        });
        break;

      case 'GET':
        // Get all leads (with optional limit)
        const limit = parseInt(req.query.limit) || 50;
        const leads = await getLeads(limit);
        res.status(200).json({ success: true, leads });
        break;

      case 'PUT':
        // Update lead status
        const { leadId, status } = req.body;
        if (!leadId || !status) {
          return res.status(400).json({ error: 'Lead ID and status are required' });
        }
        const updatedLead = await updateLeadStatus(leadId, status);
        res.status(200).json({ success: true, lead: updatedLead });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Lead API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}