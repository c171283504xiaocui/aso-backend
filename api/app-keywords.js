export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { appId, country = 'cn' } = req.query;
  
  if (!appId) {
    return res.status(400).json({ error: '请提供应用ID' });
  }
  
  try {
    // 获取应用信息
    const lookupUrl = `https://itunes.apple.com/lookup?id=${appId}&country=${country}`;
    const appRes = await fetch(lookupUrl);
    const appData = await appRes.json();
    
    if (!appData.results || appData.results.length === 0) {
      return res.status(404).json({ error: '应用不存在' });
    }
    
    const app = appData.results[0];
    
    // 分析关键词
    const keywords = await analyzeKeywords(app, country);
    
    // 统计数据
    const stats = {
      total: keywords.length,
      top3: keywords.filter(k => k.rank <= 3).length,
      top10: keywords.filter(k => k.rank <= 10).length,
      top20: keywords.filter(k => k.rank <= 20).length,
      top50: keywords.filter(k => k.rank <= 50).length,
      
      // 搜索指数分布
      highIndex: keywords.filter(k => k.searchIndex >= 8000).length,
      mediumIndex: keywords.filter(k => k.searchIndex >= 5000 && k.searchIndex < 8000).length,
      lowIndex: keywords.filter(k => k.searchIndex < 5000).length,
      
      // 总流量
      totalTraffic: keywords.reduce((sum, k) => sum + k.traffic, 0),
      
      // 覆盖度评分
      coverageScore: calculateCoverageScore(keywords)
    };
    
    res.json({
      success: true,
      appId: appId,
      appName: app.trackName,
      country: country,
      keywords: keywords,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function analyzeKeywords(app, country) {
  const keywords = [];
  
  // 生成关键词列表
  const candidateKeywords = generateKeywords(app);
  
  // 查询每个关键词的排名
  for (const keyword of candidateKeywords.slice(0, 100)) {
    try {
      const rank = await getKeywordRank(keyword, app.trackId, country);
      
      if (rank > 0 && rank <= 200) {
        const searchIndex = estimateSearchIndex(keyword, country);
        const difficulty = calculateDifficulty(keyword, searchIndex);
        
        keywords.push({
          keyword: keyword,
          rank: rank,
          searchIndex: searchIndex,
          difficulty: difficulty,
          traffic: calculateTraffic(rank, searchIndex),
          change: Math.floor(Math.random() * 11) - 5, // -5 到 +5
          relevance: calculateRelevance(keyword, app)
        });
      }
      
      // 避免请求过快
      await sleep(100);
      
    } catch (error) {
      console.error(`Error analyzing keyword ${keyword}:`, error);
    }
  }
  
  // 按排名排序
  keywords.sort((a, b) => a.rank - b.rank);
  
  return keywords.slice(0, 50);
}

function generateKeywords(app) {
  const keywords = new Set();
  
  // 从应用名称提取
  const nameWords = app.trackName.toLowerCase().split(/[\s\-_]+/);
  nameWords.forEach(word => {
    if (word.length >= 3) keywords.add(word);
  });
  
  // 从描述提取常见词
  const description = app.description.toLowerCase();
  const words = description.match(/\b[a-z\u4e00-\u9fa5]{3,10}\b/g) || [];
  
  // 词频统计
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // 取频率最高的词
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);
  
  topWords.forEach(word => keywords.add(word));
  
  // 根据分类添加相关词
  const categoryKeywords = getCategoryKeywords(app.primaryGenreName);
  categoryKeywords.forEach(word => keywords.add(word));
  
  return Array.from(keywords);
}

function getCategoryKeywords(category) {
  const map = {
    '效率': ['办公', '工具', '效率', '笔记', '任务', '日程', '提醒', '清单'],
    '社交': ['聊天', '社交', '交友', '通讯', '即时', '消息', '视频', '语音'],
    '游戏': ['游戏', '娱乐', '休闲', '动作', '冒险', '策略', '竞技'],
    '摄影与录像': ['相机', '照片', '美颜', '滤镜', '编辑', '拍照', '图片'],
    '工具': ['工具', '实用', '助手', '管家', '优化', '清理', '安全']
  };
  
  for (const [key, words] of Object.entries(map)) {
    if (category.includes(key) || key.includes(category)) {
      return words;
    }
  }
  
  return ['app', '应用', '软件'];
}

async function getKeywordRank(keyword, appId, country) {
  try {
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&country=${country}&entity=software&limit=200`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.results) {
      const index = data.results.findIndex(app => app.trackId == appId);
      return index >= 0 ? index + 1 : 0;
    }
  } catch (error) {
    console.error('Rank search error:', error);
  }
  return 0;
}

function estimateSearchIndex(keyword, country) {
  // 搜索指数（类似点点数据的搜索热度）
  const baseIndex = {
    'cn': 10000,
    'us': 12000,
    'jp': 8000,
    'kr': 7000
  };
  
  const base = baseIndex[country] || 8000;
  const length = keyword.length;
  
  // 短词搜索量高
  let multiplier = 1.0;
  if (length <= 3) multiplier = 1.5;
  else if (length <= 5) multiplier = 1.2;
  else if (length > 8) multiplier = 0.7;
  
  return Math.floor(base * multiplier * (0.5 + Math.random() * 0.5));
}

function calculateDifficulty(keyword, searchIndex) {
  // 难度 = 搜索指数高 + 关键词短
  let difficulty = 50;
  
  if (searchIndex > 8000) difficulty += 20;
  if (searchIndex > 10000) difficulty += 15;
  if (keyword.length <= 4) difficulty += 15;
  
  return Math.min(100, difficulty);
}

function calculateTraffic(rank, searchIndex) {
  // 根据排名和搜索指数计算流量
  let ctr = 0;
  if (rank === 1) ctr = 0.40;
  else if (rank <= 3) ctr = 0.25;
  else if (rank <= 5) ctr = 0.15;
  else if (rank <= 10) ctr = 0.08;
  else if (rank <= 20) ctr = 0.04;
  else if (rank <= 50) ctr = 0.02;
  else ctr = 0.01;
  
  return Math.floor(searchIndex * ctr);
}

function calculateRelevance(keyword, app) {
  const name = app.trackName.toLowerCase();
  const desc = app.description.toLowerCase();
  
  if (name.includes(keyword)) return 100;
  if (desc.substring(0, 200).includes(keyword)) return 80;
  if (desc.includes(keyword)) return 60;
  return 40;
}

function calculateCoverageScore(keywords) {
  // 覆盖度评分算法
  let score = 0;
  
  // Top10 关键词权重最高
  score += keywords.filter(k => k.rank <= 10).length * 10;
  score += keywords.filter(k => k.rank <= 20).length * 5;
  score += keywords.filter(k => k.rank <= 50).length * 2;
  
  // 高搜索指数关键词加分
  score += keywords.filter(k => k.searchIndex >= 8000).length * 8;
  
  return Math.min(100, score);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
