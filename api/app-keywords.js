export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { appId, country = 'cn', limit = 100 } = req.query;
  
  if (!appId) {
    return res.status(400).json({ 
      success: false,
      error: '请提供应用ID' 
    });
  }
  
  try {
    console.log('开始分析关键词:', { appId, country });
    
    // 获取应用信息
    let lookupUrl;
    if (/^\d+$/.test(appId)) {
      lookupUrl = `https://itunes.apple.com/lookup?id=${appId}&country=${country}`;
    } else {
      lookupUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(appId)}&country=${country}&entity=software&limit=1`;
    }
    
    const appRes = await fetch(lookupUrl);
    const appData = await appRes.json();
    
    if (!appData.results || appData.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: '应用不存在'
      });
    }
    
    const app = appData.results[0];
    console.log('应用信息获取成功:', app.trackName);
    
    // 生成关键词数据
    const keywords = await generateEnhancedKeywords(app, country, parseInt(limit));
    
    console.log(`生成了 ${keywords.length} 个关键词`);
    
    // 统计
    const stats = calculateStatistics(keywords);
    
    res.status(200).json({
      success: true,
      appId: app.trackId,
      appName: app.trackName,
      country: country,
      keywords: keywords,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Keywords API Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

// 增强的关键词生成算法
async function generateEnhancedKeywords(app, country, limit) {
  const keywords = [];
  const processedKeywords = new Set();
  
  // 1. 从应用名称提取关键词
  const nameKeywords = extractFromName(app.trackName);
  
  // 2. 从描述提取高频词
  const descKeywords = extractFromDescription(app.description);
  
  // 3. 根据分类生成相关词
  const categoryKeywords = getCategoryKeywords(app.primaryGenreName, country);
  
  // 4. 生成组合关键词
  const combinedKeywords = generateCombinations(nameKeywords, categoryKeywords);
  
  // 合并所有关键词
  const allCandidates = [
    ...nameKeywords,
    ...descKeywords,
    ...categoryKeywords,
    ...combinedKeywords
  ];
  
  console.log(`候选关键词总数: ${allCandidates.length}`);
  
  // 为每个关键词生成数据
  let processed = 0;
  for (const keyword of allCandidates) {
    if (processedKeywords.has(keyword)) continue;
    if (keywords.length >= limit) break;
    
    processedKeywords.add(keyword);
    
    // 搜索排名（限制请求频率）
    let rank = 0;
    if (processed < 50) { // 只查询前50个关键词的真实排名
      rank = await searchKeywordRank(keyword, app.trackId, country);
      await sleep(150); // 延迟避免请求过快
    } else {
      // 其余关键词使用估算排名
      rank = estimateRank(keyword, app);
    }
    
    if (rank > 0 && rank <= 200) {
      const searchIndex = estimateSearchIndex(keyword, country);
      const difficulty = calculateDifficulty(keyword, searchIndex);
      
      keywords.push({
        keyword: keyword,
        rank: rank,
        searchIndex: searchIndex,
        difficulty: difficulty,
        traffic: calculateTraffic(rank, searchIndex),
        change: Math.floor(Math.random() * 11) - 5,
        relevance: calculateRelevance(keyword, app)
      });
    }
    
    processed++;
  }
  
  // 按排名排序
  keywords.sort((a, b) => a.rank - b.rank);
  
  console.log(`最终关键词数: ${keywords.length}`);
  return keywords;
}

// 从应用名称提取关键词
function extractFromName(name) {
  const keywords = [];
  const cleanName = name.toLowerCase();
  
  // 分词
  const words = cleanName.split(/[\s\-_\|–—、·]+/);
  
  words.forEach(word => {
    const cleaned = word.trim();
    if (cleaned.length >= 2 && cleaned.length <= 20) {
      keywords.push(cleaned);
      
      // 提取中文字符
      const chineseChars = cleaned.match(/[\u4e00-\u9fa5]+/g);
      if (chineseChars) {
        chineseChars.forEach(chars => {
          if (chars.length >= 2) keywords.push(chars);
        });
      }
      
      // 提取英文单词
      const englishWords = cleaned.match(/[a-z]+/g);
      if (englishWords) {
        englishWords.forEach(word => {
          if (word.length >= 3) keywords.push(word);
        });
      }
    }
  });
  
  return [...new Set(keywords)];
}

// 从描述提取高频词
function extractFromDescription(description) {
  const keywords = [];
  const text = description.toLowerCase();
  
  // 提取中文词（2-6字）
  const chineseWords = text.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  
  // 提取英文词（3-12字母）
  const englishWords = text.match(/\b[a-z]{3,12}\b/g) || [];
  
  // 词频统计
  const wordFreq = {};
  [...chineseWords, ...englishWords].forEach(word => {
    if (word.length >= 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // 取频率最高的50个词
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);
  
  return topWords;
}

// 获取分类相关关键词
function getCategoryKeywords(category, country) {
  const categoryMap = {
    '效率': ['办公', '工作', '效率', '笔记', '任务', '待办', '清单', '日程', '提醒', '日历', '计划', '整理', '管理', '协作', '团队'],
    '社交': ['聊天', '社交', '交友', '通讯', '即时通讯', '消息', '视频聊天', '语音', '朋友', '社区', '分享', '动态'],
    '娱乐': ['视频', '音乐', '直播', '短视频', '影视', '电影', '电视剧', '综艺', '动漫', '娱乐', '观看'],
    '游戏': ['游戏', '手游', '电竞', '竞技', '休闲', '益智', '冒险', '动作', '策略', '角色扮演', '模拟'],
    '摄影与录像': ['相机', '拍照', '摄影', '美颜', '滤镜', '修图', '编辑', '照片', '图片', '视频编辑'],
    '工具': ['工具', '实用工具', '助手', '管家', '优化', '清理', '安全', '加速', '省电', '文件管理'],
    '教育': ['学习', '教育', '课程', '培训', '知识', '阅读', '词典', '翻译', '背单词', '题库'],
    '健康健美': ['健康', '健身', '运动', '锻炼', '减肥', '瑜伽', '跑步', '计步', '睡眠', '饮食'],
    '财务': ['理财', '记账', '预算', '账单', '支付', '转账', '投资', '股票', '基金', '银行'],
    '购物': ['购物', '商城', '电商', '优惠', '打折', '特价', '海淘', '比价', '下单']
  };
  
  // 英文分类映射
  const englishCategoryMap = {
    'Productivity': ['productivity', 'work', 'office', 'note', 'task', 'todo', 'calendar', 'planner', 'organizer', 'team'],
    'Social Networking': ['social', 'chat', 'messenger', 'friends', 'community', 'connect', 'message', 'video call'],
    'Entertainment': ['video', 'music', 'stream', 'watch', 'player', 'movie', 'tv', 'show'],
    'Games': ['game', 'play', 'gaming', 'multiplayer', 'casual', 'puzzle', 'action', 'strategy'],
    'Photo & Video': ['photo', 'camera', 'video', 'edit', 'filter', 'beauty', 'collage', 'gallery'],
    'Utilities': ['tool', 'utility', 'helper', 'manager', 'cleaner', 'optimizer', 'security'],
    'Education': ['learn', 'education', 'study', 'course', 'language', 'dictionary', 'quiz'],
    'Health & Fitness': ['health', 'fitness', 'workout', 'exercise', 'diet', 'tracker', 'meditation'],
    'Finance': ['finance', 'money', 'budget', 'expense', 'payment', 'banking', 'investment'],
    'Shopping': ['shopping', 'shop', 'buy', 'store', 'deal', 'discount', 'ecommerce']
  };
  
  let keywords = [];
  
  // 匹配中文分类
  for (const [key, words] of Object.entries(categoryMap)) {
    if (category.includes(key) || key.includes(category)) {
      keywords = [...keywords, ...words];
      break;
    }
  }
  
  // 匹配英文分类
  for (const [key, words] of Object.entries(englishCategoryMap)) {
    if (category.includes(key) || key.includes(category)) {
      keywords = [...keywords, ...words];
      break;
    }
  }
  
  // 通用关键词
  if (keywords.length === 0) {
    keywords = country === 'cn' 
      ? ['应用', '软件', 'app', '手机', '免费', '最新']
      : ['app', 'free', 'mobile', 'phone', 'new', 'best'];
  }
  
  return [...new Set(keywords)];
}

// 生成组合关键词
function generateCombinations(nameWords, categoryWords) {
  const combinations = [];
  
  // 名称词 + 分类词
  nameWords.slice(0, 5).forEach(name => {
    categoryWords.slice(0, 5).forEach(cat => {
      if (name !== cat) {
        combinations.push(`${name} ${cat}`);
        combinations.push(`${cat} ${name}`);
        combinations.push(`${name}${cat}`);
      }
    });
  });
  
  return combinations.slice(0, 30);
}

// 搜索关键词排名
async function searchKeywordRank(keyword, appId, country) {
  try {
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&country=${country}&entity=software&limit=100`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.results) {
      const index = data.results.findIndex(app => app.trackId == appId);
      return index >= 0 ? index + 1 : 0;
    }
  } catch (error) {
    console.error('Search rank error:', error);
  }
  return 0;
}

// 估算排名（用于减少API请求）
function estimateRank(keyword, app) {
  const name = app.trackName.toLowerCase();
  const desc = app.description.toLowerCase();
  
  // 关键词在标题中
  if (name.includes(keyword)) {
    return Math.floor(Math.random() * 20) + 5;
  }
  
  // 关键词在描述前200字
  if (desc.substring(0, 200).includes(keyword)) {
    return Math.floor(Math.random() * 30) + 20;
  }
  
  // 关键词在描述中
  if (desc.includes(keyword)) {
    return Math.floor(Math.random() * 50) + 50;
  }
  
  // 其他
  return Math.floor(Math.random() * 100) + 100;
}

// 估算搜索指数
function estimateSearchIndex(keyword, country) {
  const baseIndex = {
    'cn': 10000,
    'us': 12000,
    'jp': 8000,
    'kr': 7000,
    'hk': 6000,
    'tw': 5000
  };
  
  const base = baseIndex[country] || 8000;
  const length = keyword.length;
  
  let multiplier = 1.0;
  
  // 长度影响
  if (length <= 2) multiplier = 1.8;
  else if (length <= 4) multiplier = 1.4;
  else if (length <= 6) multiplier = 1.1;
  else if (length <= 10) multiplier = 0.9;
  else multiplier = 0.6;
  
  // 添加随机波动
  const randomFactor = 0.7 + Math.random() * 0.6;
  
  return Math.floor(base * multiplier * randomFactor);
}

// 计算难度
function calculateDifficulty(keyword, searchIndex) {
  let difficulty = 40;
  
  // 搜索指数影响
  if (searchIndex > 10000) difficulty += 25;
  else if (searchIndex > 8000) difficulty += 18;
  else if (searchIndex > 5000) difficulty += 12;
  
  // 长度影响
  if (keyword.length <= 3) difficulty += 15;
  else if (keyword.length <= 5) difficulty += 8;
  
  return Math.min(100, difficulty);
}

// 计算流量
function calculateTraffic(rank, searchIndex) {
  let ctr = 0;
  
  if (rank === 1) ctr = 0.40;
  else if (rank <= 3) ctr = 0.28;
  else if (rank <= 5) ctr = 0.18;
  else if (rank <= 10) ctr = 0.12;
  else if (rank <= 20) ctr = 0.06;
  else if (rank <= 50) ctr = 0.025;
  else if (rank <= 100) ctr = 0.01;
  else ctr = 0.005;
  
  return Math.floor(searchIndex * ctr);
}

// 计算相关度
function calculateRelevance(keyword, app) {
  const name = app.trackName.toLowerCase();
  const desc = app.description.toLowerCase();
  
  if (name.includes(keyword)) return 95;
  if (desc.substring(0, 200).includes(keyword)) return 75;
  if (desc.includes(keyword)) return 50;
  return 30;
}

// 计算统计数据
function calculateStatistics(keywords) {
  return {
    total: keywords.length,
    top3: keywords.filter(k => k.rank <= 3).length,
    top10: keywords.filter(k => k.rank <= 10).length,
    top20: keywords.filter(k => k.rank <= 20).length,
    top50: keywords.filter(k => k.rank <= 50).length,
    totalTraffic: keywords.reduce((sum, k) => sum + k.traffic, 0),
    avgRank: keywords.length > 0 
      ? Math.floor(keywords.reduce((sum, k) => sum + k.rank, 0) / keywords.length)
      : 0,
    coverageScore: Math.min(100, 
      keywords.filter(k => k.rank <= 10).length * 8 +
      keywords.filter(k => k.rank <= 20).length * 3 +
      keywords.filter(k => k.rank <= 50).length * 1
    )
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
