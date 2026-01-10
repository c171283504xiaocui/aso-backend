export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  res.status(200).json({
    success: true,
    message: 'API工作正常！',
    timestamp: new Date().toISOString(),
    query: req.query
  });
}
