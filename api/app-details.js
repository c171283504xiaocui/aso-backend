// 获取应用详细信息
const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { appId, store = 'appstore', country = 'us' } = req.query;
  
  if (!appId) {
    return res.status(400).json({ error: '请提供应用ID' });
  }

  try {
    if (store === 'appstore') {
      const response = await axios.get(
        `https://itunes.apple.com/lookup`,
        {
          params: {
            id: appId,
            country: country,
            entity: 'software'
          }
        }
      );
      
      if (response.data.results.length === 0) {
        return res.status(404).json({ error: '应用未找到' });
      }
      
      const app = response.data.results[0];
      
      res.json({
        success: true,
        data: {
          id: app.trackId,
          bundleId: app.bundleId,
          name: app.trackName,
          developer: app.artistName,
          icon: app.artworkUrl512,
          rating: app.averageUserRating || 0,
          ratingCount: app.userRatingCount || 0,
          price: app.price,
          category: app.primaryGenreName,
          description: app.description,
          screenshots: app.screenshotUrls,
          releaseDate: app.releaseDate,
          version: app.version,
          size: app.fileSizeBytes,
          languages: app.languageCodesISO2A,
          contentRating: app.contentAdvisoryRating,
          sellerName: app.sellerName,
          releaseNotes: app.releaseNotes,
          currentVersionReleaseDate: app.currentVersionReleaseDate
        }
      });
    }
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
