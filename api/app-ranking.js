export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { appId, country = 'cn', days = 30 } = req.query;
  
  if (!appId) {
    return res.status(400).json({ error: '请提供应用ID' });
  }
  
  try {
    // 生成历史排名数据
    const history = generateRankingHistory(appId, parseInt(days));
    
    // 当前排名
    const current = history[history.length - 1];
    
    // 统计数据
    const ranks = history.map(h => h.overallRank);
    const stats = {
      current: current.overallRank,
      highest: Math.min(...ranks),
      lowest: Math.max(...ranks),
      average: Math.floor(ranks.reduce((a, b) => a + b, 0) / ranks.length),
      
      // 趋势
      trend: current.overallRank < stats.average ? 'up' : 'down',
      change7days: current.overallRank - history[Math.max(0, history.length - 8)].overallRank,
      change30days: history.length >= 30 ? current.overallRank - history[0].overallRank : 0
    };
    
    res.json({
      success: true,
      appId: appId,
      country: country,
      current: current,
      history: history,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function generateRankingHistory(appId, days) {
  const history = [];
  const baseOverallRank = Math.floor(Math.random() * 300) + 50;
  const baseCategoryRank = Math.floor(Math.random() * 50) + 5;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const overallVariation = Math.floor(Math.random() * 40) - 20;
    const categoryVariation = Math.floor(Math.random() * 10) - 5;
    
    history.push({
      date: date.toISOString().split('T')[0],
      overallRank: Math.max(1, baseOverallRank + overallVariation),
      categoryRank: Math.max(1, baseCategoryRank + categoryVariation),
      freeRank: Math.max(1, baseOverallRank + overallVariation - 10),
      grossingRank: Math.floor(Math.random() * 500) + 100
    });
  }
  
  return history;
}
