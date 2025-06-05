// netlify/functions/pokemon-sets.js
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Pokemon TCG API endpoint
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    const baseUrl = 'https://api.pokemontcg.io/v2/sets';
    
    // Parse query parameters
    const { page = 1, pageSize = 20, search = '' } = event.queryStringParameters || {};
    
    // Build API URL
    let url = `${baseUrl}?page=${page}&pageSize=${pageSize}`;
    if (search) {
      url += `&q=name:"${search}"`;
    }
    
    console.log('🔍 Fetching Pokemon sets:', url);
    
    // Fetch from Pokemon TCG API
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Pokemon API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform data for our app
    const transformedSets = data.data.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      total: set.total,
      releaseDate: set.releaseDate,
      images: set.images,
      legalities: set.legalities
    }));
    
    const result = {
      success: true,
      data: transformedSets,
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
      count: data.count
    };
    
    console.log(`✅ Returned ${transformedSets.length} sets`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('❌ Pokemon Sets API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Errore nel caricamento set Pokemon'
      })
    };
  }
};
