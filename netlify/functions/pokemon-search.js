// netlify/functions/pokemon-search.js
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    const baseUrl = 'https://api.pokemontcg.io/v2/cards';
    
    // Parse query parameters
    const { 
      q = '', 
      name = '', 
      set = '', 
      rarity = '',
      types = '',
      page = 1, 
      pageSize = 20 
    } = event.queryStringParameters || {};
    
    // Build search query
    let searchQuery = [];
    
    if (q) {
      searchQuery.push(`name:"*${q}*"`);
    }
    
    if (name) {
      searchQuery.push(`name:"${name}"`);
    }
    
    if (set) {
      searchQuery.push(`set.name:"${set}"`);
    }
    
    if (rarity) {
      searchQuery.push(`rarity:"${rarity}"`);
    }
    
    if (types) {
      searchQuery.push(`types:"${types}"`);
    }
    
    // Default search if no parameters
    if (searchQuery.length === 0) {
      searchQuery.push('supertype:pokemon');
    }
    
    const queryString = searchQuery.join(' AND ');
    let url = `${baseUrl}?q=${encodeURIComponent(queryString)}&page=${page}&pageSize=${pageSize}&orderBy=set.releaseDate`;
    
    console.log('🔍 Searching Pokemon cards:', queryString);
    
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
    
    // Transform search results
    const transformedCards = data.data.map(card => ({
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      set: {
        id: card.set.id,
        name: card.set.name,
        series: card.set.series
      },
      images: {
        small: card.images.small,
        large: card.images.large
      },
      types: card.types || [],
      supertype: card.supertype,
      tcgplayer: card.tcgplayer || null,
      artist: card.artist
    }));
    
    const result = {
      success: true,
      data: transformedCards,
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
      count: data.count,
      query: queryString
    };
    
    console.log(`✅ Found ${transformedCards.length} cards matching: ${queryString}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('❌ Pokemon Search API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Errore nella ricerca carte Pokemon'
      })
    };
  }
};
