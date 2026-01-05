
async function quickSearch() {
    const query = document.getElementById('appInput').value.trim();
    if (!query || query.length < 2) return;
    
    try {
        const response = await fetch(
            `${window.location.origin}/api/search?query=${encodeURIComponent(query)}&limit=10`
        );
        const data = await response.json();
        
        if (data.success && data.results.length > 0) {
            displaySearchResults(data.results);
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results) {
    const container = document.getElementById('searchList');
    container.innerHTML = '';
    
    results.forEach(app => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;';
        div.onmouseover = () => div.style.borderColor = '#667eea';
        div.onmouseout = () => div.style.borderColor = '#e5e7eb';
        div.onclick = () => selectApp(app.id);
        
        div.innerHTML = `
            <img src="${app.icon}" style="width: 60px; height: 60px; border-radius: 12px; margin-right: 15px;">
            <div style="flex: 1;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${app.name}</div>
                <div style="color: #6b7280; font-size: 13px;">${app.developer}</div>
                <div style="margin-top: 4px;">
                    <span style="color: #f59e0b;">⭐ ${app.rating.toFixed(1)}</span>
                    <span style="margin-left: 15px; color: #6b7280;">${app.category}</span>
                </div>
            </div>
        `;
        
        container.appendChild(div);
    });
    
    document.getElementById('searchResults').style.display = 'block';
}

function selectApp(appId) {
    document.getElementById('appInput').value = appId;
    document.getElementById('searchResults').style.display = 'none';
    searchApp();
}

// 添加输入监听
document.getElementById('appInput').addEventListener('input', function() {
    if (this.value.length >= 2) {
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(quickSearch, 500);
    }
});



export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { query, country = 'us', limit = 20 } = req.query;
  
  if (!query) {
    return res.status(400).json({ 
      success: false,
      error: '请提供搜索关键词' 
    });
  }
  
  try {
    // 使用iTunes Search API
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=${country}&entity=software&limit=${limit}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (!data.results) {
      return res.json({
        success: true,
        query: query,
        count: 0,
        results: []
      });
    }
    
    // 格式化结果
    const results = data.results.map(app => ({
      id: app.trackId,
      bundleId: app.bundleId,
      name: app.trackName,
      developer: app.artistName,
      icon: app.artworkUrl100,
      rating: app.averageUserRating || 0,
      ratingCount: app.userRatingCount || 0,
      price: app.price || 0,
      category: app.primaryGenreName,
      description: app.description?.substring(0, 200) + '...',
      storeUrl: app.trackViewUrl
    }));
    
    res.status(200).json({
      success: true,
      query: query,
      country: country,
      count: results.length,
      results: results
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
