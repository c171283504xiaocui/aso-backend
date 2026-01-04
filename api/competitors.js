export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { appId, country = 'us', limit = 5 } = req.query;
  
  // 生成竞品数据
  const competitors = [];
  for (let i = 0; i < parseInt(limit); i++) {
    competitors.push({
      id: `competitor_${i + 1}`,
      name: `竞品应用 ${i + 1}`,
      developer: `开发者 ${i + 1}`,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      rank: Math.floor(Math.random() * 50) + 1,
      totalKeywords: Math.floor(Math.random() * 100) + 50,
      commonKeywords: Math.floor(Math.random() * 30) + 20,
      uniqueKeywords: Math.floor(Math.random() * 40) + 10,
      overlap: Math.floor(Math.random() * 40) + 40
    });
  }
  
  // 关键词重叠分析
  const keywordOverlap = [
    { keyword: 'productivity', yourRank: 5, competitorRank: 3, gap: 2 },
    { keyword: 'task manager', yourRank: 12, competitorRank: 8, gap: 4 },
    { keyword: 'to do list', yourRank: 8, competitorRank: 15, gap: -7 },
    { keyword: 'calendar app', yourRank: 25, competitorRank: 10, gap: 15 },
    { keyword: 'planner', yourRank: 18, competitorRank: 22, gap: -4 }
  ];
  
  // 竞品独有关键词
  const competitorUniqueKeywords = [
    { keyword: 'project tracker', rank: 6, volume: 65000, opportunity: 'high' },
    { keyword: 'workflow automation', rank: 12, volume: 48000, opportunity: 'medium' },
    { keyword: 'business planner', rank: 8, volume: 52000, opportunity: 'high' }
  ];
  
  res.status(200).json({
    success: true,
    appId: appId,
    country: country,
    competitors: competitors,
    keywordOverlap: keywordOverlap,
    competitorUniqueKeywords: competitorUniqueKeywords,
    analysis: {
      totalCompetitors: competitors.length,
      averageOverlap: Math.floor(competitors.reduce((sum, c) => sum + c.overlap, 0) / competitors.length),
      opportunities: competitorUniqueKeywords.filter(k => k.opportunity === 'high').length
    }
  });
}
