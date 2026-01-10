export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { appId, country = 'cn' } = req.query;
  
  if (!appId) {
    return res.status(400).json({ 
      success: false,
      error: '请提供应用ID或名称' 
    });
  }
  
  try {
    // 搜索应用
    let lookupUrl;
    
    // 如果是纯数字，当作ID查询
    if (/^\d+$/.test(appId)) {
      lookupUrl = `https://itunes.apple.com/lookup?id=${appId}&country=${country}`;
    } else {
      // 按名称搜索
      lookupUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(appId)}&country=${country}&entity=software&limit=1`;
    }
    
    const response = await fetch(lookupUrl);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: '未找到该应用'
      });
    }
    
    const app = data.results[0];
    
    // 返回格式化数据
    res.status(200).json({
      success: true,
      data: {
        appId: app.trackId,
        bundleId: app.bundleId,
        appName: app.trackName,
        developer: app.artistName,
        developerId: app.artistId,
        icon: app.artworkUrl512 || app.artworkUrl100,
        rating: app.averageUserRating || 0,
        ratingCount: app.userRatingCount || 0,
        price: app.price || 0,
        category: app.primaryGenreName,
        description: app.description,
        version: app.version,
        releaseDate: app.releaseDate,
        size: app.fileSizeBytes,
        storeUrl: app.trackViewUrl,
        country: country
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
