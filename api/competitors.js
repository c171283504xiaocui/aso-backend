export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { appId, country = 'cn', limit = 10 } = req.query;
  
  if (!appId) {
    return res.status(400).json({ error: '请提供应用ID' });
  }
  
  try {
    // 获取主应用信息
    const mainApp = await getAppInfo(appId, country);
    
    // 获取同类竞品
    const competitors = await findCompetitors(mainApp, country, parseInt(limit));
    
    // 关键词对比分析
    const keywordComparison = await compareKeywords(appId, competitors, country);
    
    res.json({
      success: true,
      mainApp: {
        appId: mainApp.trackId,
        name: mainApp.trackName,
        rating: mainApp.averageUserRating,
        category: mainApp.primaryGenreName
      },
      competitors: competitors,
      keywordComparison: keywordComparison,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAppInfo(appId, country) {
  const url = `https://itunes.apple.com/lookup?id=${appId}&country=${country}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results[0];
}

async function findCompetitors(mainApp, country, limit) {
  // 搜索同类应用
  const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(mainApp.primaryGenreName)}&country=${country}&entity=software&limit=${limit + 10}`;
  const response = await fetch(searchUrl);
  const data = await response.json();
  
  return data.results
    .filter(app => app.trackId != mainApp.trackId)
    .slice(0, limit)
    .map(app => ({
      appId: app.trackId,
      name: app.trackName,
      developer: app.artistName,
      icon: app.artworkUrl100,
      rating: app.averageUserRating || 0,
      ratingCount: app.userRatingCount || 0,
      category: app.primaryGenreName,
      price: app.price,
      
      // 估算数据
      estimatedRank: Math.floor(Math.random() * 200) + 10,
      estimatedKeywords: Math.floor(Math.random() * 50) + 30,
      overlap: Math.floor(Math.random() * 40) + 30
    }));
}

async function compareKeywords(mainAppId, competitors, country) {
  // 模拟关键词对比数据
  const comparison = {
    uniqueToMain: [
      { keyword: '独有词1', rank: 5, searchIndex: 8500 },
      { keyword: '独有词2', rank: 8, searchIndex: 7200 }
    ],
    commonKeywords: [
      { 
        keyword: '共同词1',
        mainRank: 10,
        competitors: competitors.slice(0, 3).map(c => ({
          appId: c.appId,
          name: c.name,
          rank: Math.floor(Math.random() * 20) + 5
        }))
      }
    ],
    opportunityKeywords: [
      { 
        keyword: '机会词1',
        searchIndex: 9500,
        competitorAvgRank: 15,
        difficulty: 65,
        reason: '高搜索量，竞品排名一般'
      }
    ]
  };
  
  return comparison;
}
