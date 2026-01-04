export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { appId, store = 'appstore', country = 'us' } = req.query;
  
  if (!appId) {
    return res.status(400).json({ 
      success: false,
      error: '请提供应用ID或名称' 
    });
  }
  
  // 模拟应用数据
  const appData = {
    id: appId,
    name: appId.includes('.') ? appId.split('.').pop() : appId,
    developer: 'Developer Inc.',
    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
    rank: Math.floor(Math.random() * 200) + 1,
    store: store,
    country: country
  };
  
  // 生成关键词数据
  const keywords = generateKeywords(appData, country);
  
  // 计算覆盖度
  const top10Count = keywords.filter(k => k.rank <= 10).length;
  const coverage = Math.floor((top10Count / keywords.length) * 100);
  
  res.status(200).json({
    success: true,
    app: appData,
    country: country,
    store: store,
    keywords: keywords,
    totalKeywords: keywords.length,
    top10Keywords: top10Count,
    coverage: coverage,
    timestamp: new Date().toISOString()
  });
}

// 生成关键词数据
function generateKeywords(app, country) {
  const baseKeywords = [
    'productivity', 'task manager', 'to do list', 'calendar', 'planner',
    'notes', 'reminder', 'organizer', 'schedule', 'project management',
    'time management', 'team collaboration', 'daily planner', 'habit tracker',
    'goal setting', 'time tracker', 'focus timer', 'pomodoro', 'checklist',
    'agenda', 'notepad', 'memo', 'journal', 'diary', 'work planner',
    'productivity tools', 'task organizer', 'schedule planner', 'todo app',
    'business planner'
  ];
  
  // 根据国家调整搜索量
  const countryMultiplier = {
    'us': 1.0,
    'cn': 0.8,
    'jp': 0.6,
    'kr': 0.5,
    'gb': 0.7,
    'de': 0.6,
    'fr': 0.6
  };
  
  const multiplier = countryMultiplier[country] || 0.5;
  
  return baseKeywords.map((keyword, index) => {
    const baseVolume = Math.floor(Math.random() * 150000) + 30000;
    const rank = Math.floor(Math.random() * 100) + 1;
    const difficulty = Math.floor(Math.random() * 60) + 40;
    const trend = Math.floor(Math.random() * 21) - 10; // -10 到 +10
    
    return {
      keyword: keyword,
      rank: rank,
      volume: Math.floor(baseVolume * multiplier),
      difficulty: difficulty,
      trend: trend,
      traffic: Math.floor((baseVolume * multiplier) * (101 - rank) / 2000)
    };
  });
}
