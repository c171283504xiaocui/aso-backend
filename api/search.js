export default function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { query = '', store = 'appstore', country = 'us' } = req.query;
  
  if (!query) {
    return res.status(400).json({ 
      success: false,
      error: '请提供搜索关键词' 
    });
  }
  
  // 模拟搜索结果
  const results = [
    {
      id: Math.floor(Math.random() * 1000000) + 100000,
      name: query,
      developer: 'Developer Inc.',
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      category: 'Apps',
      rank: Math.floor(Math.random() * 100) + 1,
      store: store,
      country: country
    }
  ];
  
  res.status(200).json({
    success: true,
    query: query,
    store: store,
    country: country,
    count: results.length,
    results: results
  });
}
