export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { appId, country = 'cn', page = 1, sortBy = 'recent' } = req.query;
  
  if (!appId) {
    return res.status(400).json({ error: '请提供应用ID' });
  }
  
  try {
    // 获取iTunes评论
    const reviewsUrl = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=${sortBy}/page=${page}/json`;
    const response = await fetch(reviewsUrl);
    const data = await response.json();
    
    const reviews = data.feed?.entry?.map(entry => ({
      id: entry.id?.label,
      author: entry.author?.name?.label || '匿名',
      rating: parseInt(entry['im:rating']?.label || 0),
      title: entry.title?.label || '',
      content: entry.content?.label || '',
      version: entry['im:version']?.label || '',
      date: entry.updated?.label || '',
      voteCount: parseInt(entry['im:voteCount']?.label || 0)
    })) || [];
    
    // 情感分析统计
    const sentiment = analyzeSentiment(reviews);
    
    res.json({
      success: true,
      appId: appId,
      country: country,
      page: parseInt(page),
      reviews: reviews,
      sentiment: sentiment,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function analyzeSentiment(reviews) {
  const ratingCounts = [0, 0, 0, 0, 0];
  
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
  });
  
  const total = reviews.length;
  const positive = ratingCounts[3] + ratingCounts[4];
  const negative = ratingCounts[0] + ratingCounts[1];
  
  return {
    total: total,
    positive: positive,
    negative: negative,
    neutral: total - positive - negative,
    positiveRate: total > 0 ? (positive / total * 100).toFixed(1) : 0,
    ratingDistribution: ratingCounts
  };
}
