export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { appId, category = 'productivity', country = 'us' } = req.query;
  
  // 推荐关键词
  const suggestions = [
    {
      keyword: 'task management app',
      reason: '高搜索量，低竞争度',
      volume: 85000,
      difficulty: 42,
      currentRank: null,
      potentialRank: 15,
      opportunity: 'high'
    },
    {
      keyword: 'productivity tools',
      reason: '相关度高，流量潜力大',
      volume: 120000,
      difficulty: 58,
      currentRank: null,
      potentialRank: 25,
      opportunity: 'medium'
    },
    {
      keyword: 'team collaboration',
      reason: '增长趋势明显',
      volume: 95000,
      difficulty: 52,
      currentRank: 89,
      potentialRank: 35,
      opportunity: 'medium'
    },
    {
      keyword: 'daily planner free',
      reason: '长尾关键词，易上排名',
      volume: 45000,
      difficulty: 35,
      currentRank: null,
      potentialRank: 8,
      opportunity: 'high'
    },
    {
      keyword: 'work organizer',
      reason: '竞品覆盖少',
      volume: 52000,
      difficulty: 38,
      currentRank: null,
      potentialRank: 12,
      opportunity: 'high'
    }
  ];
  
  // 优化建议
  const optimizations = [
    {
      type: 'title',
      priority: 'high',
      suggestion: '在标题中添加"task manager"关键词',
      impact: '预计提升20-30个关键词排名'
    },
    {
      type: 'description',
      priority: 'medium',
      suggestion: '在描述前100字符中增加核心关键词密度',
      impact: '提升关键词相关性得分'
    },
    {
      type: 'keywords',
      priority: 'high',
      suggestion: '移除低效关键词，添加建议的5个高潜力关键词',
      impact: '预计新增3000+日均流量'
    }
  ];
  
  res.status(200).json({
    success: true,
    appId: appId,
    category: category,
    country: country,
    suggestions: suggestions,
    optimizations: optimizations,
    estimatedImpact: {
      newKeywords: 15,
      trafficIncrease: '25%',
      rankImprovement: 'Top 10关键词增加8个'
    }
  });
}
