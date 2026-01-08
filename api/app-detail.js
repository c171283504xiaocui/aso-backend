export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { appId, country = 'cn' } = req.query;
  
  if (!appId) {
    return res.status(400).json({ error: '请提供应用ID' });
  }
  
  try {
    // 获取应用详情
    const lookupUrl = `https://itunes.apple.com/lookup?id=${appId}&country=${country}`;
    const response = await fetch(lookupUrl);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: '应用不存在' });
    }
    
    const app = data.results[0];
    
    // 格式化返回数据
    res.json({
      success: true,
      data: {
        // 基本信息
        appId: app.trackId,
        bundleId: app.bundleId,
        appName: app.trackName,
        developer: app.artistName,
        developerId: app.artistId,
        icon: app.artworkUrl512,
        
        // 评分信息
        rating: app.averageUserRating || 0,
        ratingCount: app.userRatingCount || 0,
        currentVersionRating: app.averageUserRatingForCurrentVersion || 0,
        currentVersionRatingCount: app.userRatingCountForCurrentVersion || 0,
        
        // 分类信息
        category: app.primaryGenreName,
        categoryId: app.primaryGenreId,
        categories: app.genres,
        
        // 版本信息
        version: app.version,
        releaseDate: app.releaseDate,
        currentVersionReleaseDate: app.currentVersionReleaseDate,
        releaseNotes: app.releaseNotes,
        
        // 其他信息
        price: app.price,
        formattedPrice: app.formattedPrice,
        description: app.description,
        screenshots: app.screenshotUrls,
        ipadScreenshots: app.ipadScreenshotUrls,
        size: app.fileSizeBytes,
        languages: app.languageCodesISO2A,
        minimumOsVersion: app.minimumOsVersion,
        contentRating: app.contentAdvisoryRating,
        storeUrl: app.trackViewUrl,
        
        // 估算数据
        estimatedDownloads: estimateDownloads(app),
        estimatedRevenue: estimateRevenue(app),
        
        country: country,
        lastUpdate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function estimateDownloads(app) {
  // 基于评分数量估算下载量
  const ratingCount = app.userRatingCount || 0;
  const multiplier = 50; // 平均每50个下载1个评分
  const downloads = ratingCount * multiplier;
  
  return {
    total: Math.floor(downloads),
    daily: Math.floor(downloads / 365),
    monthly: Math.floor(downloads / 12)
  };
}

function estimateRevenue(app) {
  const price = app.price || 0;
  const downloads = estimateDownloads(app);
  
  return {
    total: Math.floor(price * downloads.total * 0.7), // 70% 分成
    daily: Math.floor(price * downloads.daily * 0.7),
    monthly: Math.floor(price * downloads.monthly * 0.7)
  };
}
