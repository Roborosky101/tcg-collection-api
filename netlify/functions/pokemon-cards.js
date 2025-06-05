// netlify/functions/pokemon-cards.js
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
    const { setId, page = 1, pageSize = 250, orderBy = 'number' } = event.queryStringParameters || {};
    
    if (!setId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'setId parameter is required'
        })
      };
    }
    
    // Build API URL
    let url = `${baseUrl}?q=set.id:${setId}&page=${page}&pageSize=${pageSize}&orderBy=${orderBy}`;
    
    console.log('🃏 Fetching Pokemon cards for set:', setId);
    
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
    
    // Transform cards data
    const transformedCards = data.data.map(card => ({
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      set: {
        id: card.set.id,
        name: card.set.name,
        series: card.set.series,
        total: card.set.total
      },
      images: {
        small: card.images.small,
        large: card.images.large
      },
      types: card.types || [],
      supertype: card.supertype,
      subtypes: card.subtypes || [],
      tcgplayer: card.tcgplayer || null,
      cardmarket: card.cardmarket || null,
      artist: card.artist,
      flavorText: card.flavorText
    }));
    
    const result = {
      success: true,
      data: transformedCards,
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
      count: data.count,
      setInfo: transformedCards[0]?.set || null
    };
    
    console.log(`✅ Returned ${transformedCards.length} cards for set ${setId}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('❌ Pokemon Cards API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Errore nel caricamento carte Pokemon'
      })
    };
  }
};
