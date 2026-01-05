export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { query, country = 'us', limit = 20 } = req.query;
  
  if (!query) {
    return res.status(400).json({ 
      success: false,
      error: '请提供搜索关键词' 
    });
  }
  
  try {
    // 使用iTunes Search API
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=${country}&entity=software&limit=${limit}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (!data.results) {
      return res.json({
        success: true,
        query: query,
        count: 0,
        results: []
      });
    }
    
    // 格式化结果
    const results = data.results.map(app => ({
      id: app.trackId,
      bundleId: app.bundleId,
      name: app.trackName,
      developer: app.artistName,
      icon: app.artworkUrl100,
      rating: app.averageUserRating || 0,
      ratingCount: app.userRatingCount || 0,
      price: app.price || 0,
      category: app.primaryGenreName,
      description: app.description?.substring(0, 200) + '...',
      storeUrl: app.trackViewUrl
    }));
    
    res.status(200).json({
      success: true,
      query: query,
      country: country,
      count: results.length,
      results: results
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
