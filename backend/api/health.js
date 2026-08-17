export default async function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'KI BHARATH Solar Chatbot API',
    version: '1.0.0'
  });
}