export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { appId, keyword, days = 30 } = req.query;
  
  if (!appId || !keyword) {
    return res.status(400).json({ 
      success: false,
      error: '请提供应用ID和关键词' 
    });
  }
  
  // 生成历史数据
  const history = [];
  const baseRank = Math.floor(Math.random() * 50) + 20;
  
  for (let i = parseInt(days); i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const variation = Math.floor(Math.random() * 20) - 10;
    const rank = Math.max(1, Math.min(150, baseRank + variation));
    
    history.push({
      date: date.toISOString().split('T')[0],
      rank: rank,
      change: i === parseInt(days) ? 0 : rank - (history.length > 0 ? history[history.length - 1].rank : rank)
    });
  }
  
  // 计算统计数据
  const ranks = history.map(h => h.rank);
  const currentRank = ranks[ranks.length - 1];
  const highestRank = Math.min(...ranks);
  const lowestRank = Math.max(...ranks);
  const averageRank = Math.floor(ranks.reduce((sum, r) => sum + r, 0) / ranks.length);
  
  res.status(200).json({
    success: true,
    appId: appId,
    keyword: keyword,
    period: `${days} days`,
    currentRank: currentRank,
    highestRank: highestRank,
    lowestRank: lowestRank,
    averageRank: averageRank,
    trend: currentRank < averageRank ? 'improving' : currentRank > averageRank ? 'declining' : 'stable',
    history: history
  });
}
