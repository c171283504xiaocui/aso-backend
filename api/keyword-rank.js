export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { keyword, appId, countries = 'us,cn,jp,kr,gb,de,fr' } = req.query;
  
  if (!keyword) {
    return res.status(400).json({ 
      success: false,
      error: '请提供关键词' 
    });
  }
  
  const countryList = countries.split(',');
  const rankData = countryList.map(country => {
    const rank = Math.floor(Math.random() * 150) + 1;
    const volume = Math.floor(Math.random() * 200000) + 20000;
    const trend = Math.floor(Math.random() * 21) - 10;
    
    return {
      country: country,
      countryName: getCountryName(country),
      rank: rank,
      volume: volume,
      trend: trend,
      difficulty: Math.floor(Math.random() * 40) + 40,
      topApps: generateTopApps(keyword, country)
    };
  });
  
  res.status(200).json({
    success: true,
    keyword: keyword,
    appId: appId,
    countries: rankData,
    timestamp: new Date().toISOString()
  });
}

function getCountryName(code) {
  const names = {
    'us': '🇺🇸 美国',
    'cn': '🇨🇳 中国',
    'jp': '🇯🇵 日本',
    'kr': '🇰🇷 韩国',
    'gb': '🇬🇧 英国',
    'de': '🇩🇪 德国',
    'fr': '🇫🇷 法国'
  };
  return names[code] || code;
}

function generateTopApps(keyword, country) {
  const apps = [];
  for (let i = 0; i < 10; i++) {
    apps.push({
      rank: i + 1,
      name: `App ${i + 1}`,
      developer: `Developer ${i + 1}`,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1)
    });
  }
  return apps;
}
