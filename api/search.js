// App Store 和 Google Play 搜索API
const axios = require('axios');

module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  const { query, store = 'appstore', country = 'us' } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: '请提供搜索关键词' });
  }

  try {
    let results = [];
    
    if (store === 'appstore') {
      // App Store 搜索
      const response = await axios.get(
        `https://itunes.apple.com/search`,
        {
          params: {
            term: query,
            country: country,
            entity: 'software',
            limit: 50
          }
        }
      );
      
      results = response.data.results.map(app => ({
        id: app.trackId,
        bundleId: app.bundleId,
        name: app.trackName,
        developer: app.artistName,
        icon: app.artworkUrl512,
        rating: app.averageUserRating || 0,
        ratingCount: app.userRatingCount || 0,
        price: app.price,
        category: app.primaryGenreName,
        description: app.description,
        screenshots: app.screenshotUrls,
        releaseDate: app.releaseDate,
        version: app.version,
        size: app.fileSizeBytes,
        contentRating: app.contentAdvisoryRating,
        store: 'appstore'
      }));
    } 
    else if (store === 'googleplay') {
      // Google Play 搜索（使用第三方API）
      const response = await axios.get(
        `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps&hl=en&gl=${country}`
      );
      
      // 简化版：返回示例数据
      results = [{
        id: 'com.example.app',
        name: query,
        developer: '示例开发者',
        icon: '📱',
        rating: 4.5,
        store: 'googleplay'
      }];
    }

    res.json({
      success: true,
      count: results.length,
      store: store,
      country: country,
      results: results
    });

  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
