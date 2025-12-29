// 获取应用排名历史
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { appId, days = 30 } = req.query;
  
  if (!appId) {
    return res.status(400).json({ error: '请提供应用ID' });
  }
  
  // 生成模拟历史数据
  const history = [];
  const baseRank = 50 + Math.floor(Math.random() * 100);
  
  for (let i = parseInt(days); i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 添加一些随机波动
    const variation = Math.floor(Math.random() * 20) - 10;
    const rank = Math.max(1, Math.min(200, baseRank + variation));
    
    history.push({
      date: date.toISOString().split('T')[0],
      rank: rank,
      change: i > 0 ? (history[history.length - 1]?.rank || rank) - rank : 0
    });
  }
  
  res.json({
    success: true,
    appId: appId,
    period: `${days} days`,
    currentRank: history[history.length - 1].rank,
    highestRank: Math.min(...history.map(h => h.rank)),
    lowestRank: Math.max(...history.map(h => h.rank)),
    history: history
  });
};
