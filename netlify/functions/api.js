// Netlify Function Proxy for BreachVIP API
// This acts as a CORS proxy to avoid browser restrictions

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        // Parse the request body
        const requestBody = JSON.parse(event.body);
        
        // Forward the request to BreachVIP API
        const response = await fetch('https://breachvip.com/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'IdlebX-Search/1.0'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // Return the response with CORS headers
        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};
