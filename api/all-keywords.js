export default function handler(req, res) {
  // 设置CORS允许跨域
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { category = 'all', limit = 100, sort = 'volume' } = req.query;
  
  // 完整关键词数据库
  let allKeywords = [
    // 生产力工具
    { keyword: 'productivity', volume: 125000, difficulty: 65, category: 'productivity', trend: 'up', apps: 1250 },
    { keyword: 'task manager', volume: 85000, difficulty: 52, category: 'productivity', trend: 'stable', apps: 850 },
    { keyword: 'to do list', volume: 95000, difficulty: 58, category: 'productivity', trend: 'up', apps: 920 },
    { keyword: 'note taking', volume: 72000, difficulty: 48, category: 'productivity', trend: 'down', apps: 680 },
    { keyword: 'calendar', volume: 110000, difficulty: 72, category: 'productivity', trend: 'up', apps: 1100 },
    { keyword: 'planner', volume: 68000, difficulty: 55, category: 'productivity', trend: 'stable', apps: 640 },
    { keyword: 'reminder', volume: 92000, difficulty: 61, category: 'productivity', trend: 'up', apps: 880 },
    { keyword: 'organizer', volume: 54000, difficulty: 45, category: 'productivity', trend: 'stable', apps: 520 },
    
    // 社交媒体
    { keyword: 'social media', volume: 245000, difficulty: 85, category: 'social', trend: 'up', apps: 2450 },
    { keyword: 'messenger', volume: 198000, difficulty: 78, category: 'social', trend: 'stable', apps: 1980 },
    { keyword: 'chat app', volume: 165000, difficulty: 72, category: 'social', trend: 'up', apps: 1650 },
    { keyword: 'video call', volume: 142000, difficulty: 68, category: 'social', trend: 'up', apps: 1420 },
    { keyword: 'dating app', volume: 128000, difficulty: 82, category: 'social', trend: 'stable', apps: 1280 },
    
    // 游戏
    { keyword: 'puzzle game', volume: 215000, difficulty: 88, category: 'games', trend: 'up', apps: 3200 },
    { keyword: 'action game', volume: 198000, difficulty: 90, category: 'games', trend: 'stable', apps: 2980 },
    { keyword: 'arcade game', volume: 175000, difficulty: 85, category: 'games', trend: 'down', apps: 2750 },
    { keyword: 'strategy game', volume: 156000, difficulty: 82, category: 'games', trend: 'up', apps: 2340 },
    { keyword: 'racing game', volume: 142000, difficulty: 80, category: 'games', trend: 'stable', apps: 2130 },
    
    // 健康健身
    { keyword: 'fitness tracker', volume: 135000, difficulty: 75, category: 'health', trend: 'up', apps: 1350 },
    { keyword: 'workout app', volume: 118000, difficulty: 68, category: 'health', trend: 'up', apps: 1180 },
    { keyword: 'meditation', volume: 102000, difficulty: 65, category: 'health', trend: 'up', apps: 1020 },
    { keyword: 'sleep tracker', volume: 95000, difficulty: 62, category: 'health', trend: 'stable', apps: 950 },
    { keyword: 'calorie counter', volume: 88000, difficulty: 58, category: 'health', trend: 'up', apps: 880 }
  ];
  
  // 过滤分类
  if (category !== 'all') {
    allKeywords = allKeywords.filter(k => k.category === category);
  }
  
  // 排序
  if (sort === 'volume') {
    allKeywords.sort((a, b) => b.volume - a.volume);
  } else if (sort === 'difficulty') {
    allKeywords.sort((a, b) => a.difficulty - b.difficulty);
  }
  
  // 限制数量
  const limitedKeywords = allKeywords.slice(0, parseInt(limit));
  
  res.status(200).json({
    success: true,
    total: allKeywords.length,
    returned: limitedKeywords.length,
    category: category,
    sort: sort,
    keywords: limitedKeywords
  });
}
