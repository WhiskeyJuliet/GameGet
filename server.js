require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

// Assuming you are NOT using HTTPS locally based on previous decision
// const https = require('https');
// const fs = require('fs');
const stringSimilarity = require('string-similarity'); // For matching titles


const app = express();
const port = 3000;

// --- Twitch/IGDB Credentials ---
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.error("FATAL ERROR: TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET not found in .env file.");
    process.exit(1);
}
// ... (Credentials check) ...
let twitchAccessToken = null;
let tokenExpiryTime = 0;

async function getTwitchAccessToken() {
    const now = Date.now();
    if (twitchAccessToken && now < tokenExpiryTime - 60000) {
        return twitchAccessToken;
    }
    console.log("Fetching new Twitch Access Token...");
    const tokenUrl = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams();
    params.append('client_id', TWITCH_CLIENT_ID);
    params.append('client_secret', TWITCH_CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');
    try {
        const response = await axios.post(tokenUrl, params);
        twitchAccessToken = response.data.access_token;
        tokenExpiryTime = now + (response.data.expires_in * 1000);
        console.log("New Twitch token obtained.");
        return twitchAccessToken;
    } catch (error) {
        console.error("Error fetching Twitch Access Token:", error.response ? error.response.data : error.message);
        twitchAccessToken = null;
        tokenExpiryTime = 0;
        throw new Error('Could not authenticate with Twitch/IGDB.');
    }
}

// --- Middleware ---
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

      
      
// --- NEW: API Endpoint for Searching (returns list with year) ---
app.get('/search', async (req, res) => {
    const gameQuery = req.query.gameName;
    if (!gameQuery) {
        return res.status(400).json({ error: 'Game name query parameter is required' });
    }

    try {
        const accessToken = await getTwitchAccessToken();
        const igdbUrl = 'https://api.igdb.com/v4/games';

        // Query: Search, get ID, Name, and First Release Date, limit to 35 results
		// category for game-type 0:main_game, 1:dlc_addon, 2:expansion, 3:bundle, 4:standalone_expansion, 5:mod, 6:episode, 7:season, 8:remake, 9:remaster, 10:expanded_game, 11:port, 12:fork
        const requestBody = `
            search "${gameQuery.replace(/"/g, '\\"')}";
            fields
                id,
                name,
                first_release_date,
                category,
                version_parent,
                platforms.name;
            limit 35;
            where category != 1 & category != 2 & category != 6 & category != 7;
        `;
           

        // Update console log message
        console.log(`Querying IGDB for top 35 list matching "${gameQuery}"...`);
        const igdbResponse = await axios.post(igdbUrl, requestBody, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            },
            timeout: 15000
        });

        if (igdbResponse.data && igdbResponse.data.length > 0) {
            // Map results to include the release year (logic remains the same)
            const resultsWithYear = igdbResponse.data.map(game => {
                let releaseYear = 'N/A';
                if (game.first_release_date) {
                    releaseYear = new Date(game.first_release_date * 1000).getFullYear().toString();
                }
                // Determine Game Type String
                let gameType = 'Game'; // Default
                switch (game.category) {
                    case 0: gameType = 'Main Game'; break;
                    // case 1: gameType = 'DLC/Addon'; break; // Excluded by 'where' clause, but keep for reference
                    // case 2: gameType = 'Expansion'; break;
                    case 3: gameType = 'Bundle'; break;
                    case 4: gameType = 'Standalone Expansion'; break;
                    case 5: gameType = 'Mod'; break;
                    // case 6: gameType = 'Episode'; break;
                    // case 7: gameType = 'Season'; break;
                    case 8: gameType = 'Remake'; break;
                    case 9: gameType = 'Remaster'; break;
                    case 10: gameType = 'Expanded Game'; break;
                    case 11: gameType = 'Port'; break;
                    case 12: gameType = 'Fork'; break;
                    default: // If unknown category or null
                        if (game.version_parent) { // Check if it's a version of something else
                            gameType = 'Version/Port'; // Generic label if parent exists but category unknown/main
                        } else {
                            gameType = 'Game'; // Default fallback
                        }
                        break;
                }
                // Refine type if it's main game but has parent (might be a specific version)
                if (game.category === 0 && game.version_parent) {
                     gameType = 'Version/Port';
                }

				// Extract Platform Names
				let platformNames = [];
                if (game.platforms && Array.isArray(game.platforms)) {
                    platformNames = game.platforms.map(p => p.name).filter(Boolean); // Get names
                }

                return {
                    id: game.id,
                    name: game.name || 'Unnamed Game',
                    year: releaseYear,
                    type: gameType, // Add the type string
                    platforms: platformNames // <--- Send array of names
                };
            });
            // --- End of mapping ---

            console.log(`Found ${resultsWithYear.length} potential matches (sending top 35).`);
            res.json(resultsWithYear);
        } else {
            console.log(`No results found on IGDB for "${gameQuery}".`);
            res.status(404).json({ error: `No games found matching "${gameQuery}" on IGDB.` });
        }

    } catch (error) {
        // ... (error handling remains the same)
        console.error(`Error searching IGDB list for "${gameQuery}":`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        if (error.message === 'Could not authenticate with Twitch/IGDB.' || (error.response && (error.response.status === 401 || error.response.status === 403))) {
             twitchAccessToken = null;
             tokenExpiryTime = 0;
             console.warn("IGDB Auth failed during search, clearing token.");
             return res.status(error.response?.status || 503).json({ error: `IGDB Authentication error (${error.response?.status || 'Auth func failed'}). Please try again.` });
         } else if (error.code === 'ECONNABORTED') {
             console.error('IGDB search request timed out.');
             return res.status(504).json({ error: 'IGDB API took too long to respond.' });
        }
        res.status(500).json({ error: 'Failed to search IGDB API.' });
    }
});

// The /details/:gameId endpoint remains unchanged as it already fetches the full date.

    


      
// --- API Endpoint for getting details of a specific game ID ---
app.get('/details/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (!gameId || isNaN(parseInt(gameId))) {
        return res.status(400).json({ error: 'Valid game ID parameter is required.' });
    }

    try {
        const accessToken = await getTwitchAccessToken();
        const igdbUrl = 'https://api.igdb.com/v4/games';

        // Query: Get specific game by ID, fetch detailed fields including platform logos and developer
		const parsedGameId = parseInt(gameId);
		const requestBody = `
        fields
            name,
            first_release_date,
            cover.url,
            platforms.id, platforms.name,
            involved_companies.id, involved_companies.company.name, involved_companies.developer;
        where id = ${parsedGameId};
        limit 1;
    `;

        console.log(`Querying IGDB for details (incl. platform logos) of game ID ${parsedGameId}...`);
        // ... rest of the endpoint
        const igdbResponse = await axios.post(igdbUrl, requestBody, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        if (igdbResponse.data && igdbResponse.data.length > 0) {
            const game = igdbResponse.data[0];
            console.log("IGDB Raw Details Data:", game);

            // Map IGDB data
            const gameData = {
                name: game.name || 'N/A',
                thumbnailUrl: null,
                releaseDate: 'N/A',
				developer: 'N/A', 
                platforms: [] // Initialize as an empty array
            };

            // --- Cover URL Mapping (remains the same) ---
            if (game.cover && game.cover.url) {
                gameData.thumbnailUrl = game.cover.url.replace('t_thumb', 't_cover_big');
                if (gameData.thumbnailUrl.startsWith('//')) {
                    gameData.thumbnailUrl = 'https:' + gameData.thumbnailUrl;
                }
            }

            // --- Release Date Mapping (remains the same) ---
            if (game.first_release_date) {
                const releaseTimestamp = game.first_release_date * 1000;
                gameData.releaseDate = new Date(releaseTimestamp).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            }

			// --- Map Developer ---
            if (game.involved_companies && Array.isArray(game.involved_companies)) {
                // Find the first company marked as the developer
                const devCompany = game.involved_companies.find(ic => ic.developer === true && ic.company && ic.company.name);
                if (devCompany) {
                    gameData.developer = devCompany.company.name;
                    console.log(`Found Developer: ${gameData.developer}`);
                } else {
                     console.log("No company marked as developer found.");
                     // Optional: Could look for publisher or first company as fallback? For now, N/A is fine.
                }
            }

            // --- Platform Mapping (Updated) ---
            if (game.platforms && Array.isArray(game.platforms)) {
                gameData.platforms = game.platforms
					.map(p => (p && typeof p.name === 'string') ? p.name : null) // Get name only if p and p.name exist and are string
					.filter(Boolean); // Filter out nulls
            }
            // --- End of Platform Mapping ---

            console.log("Mapped Game Details:", gameData);
            res.json(gameData); // Send data structure: { ..., platforms: [{name: '...', logoUrl: '...'}, ...]}

        } else {
            console.log(`Game ID ${gameId} not found on IGDB.`);
            res.status(404).json({ error: `Game with ID ${gameId} not found on IGDB.` });
        }

    } catch (error) {
        // ... (error handling remains the same)
        console.error(`Error getting IGDB details for ID ${gameId}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        if (error.message === 'Could not authenticate with Twitch/IGDB.' || (error.response && (error.response.status === 401 || error.response.status === 403))) {
             twitchAccessToken = null;
             tokenExpiryTime = 0;
             console.warn("IGDB Auth failed during detail fetch, clearing token.");
             return res.status(error.response?.status || 503).json({ error: `IGDB Authentication error (${error.response?.status || 'Auth func failed'}). Please try again.` });
         } else if (error.code === 'ECONNABORTED') {
             console.error('IGDB details request timed out.');
             return res.status(504).json({ error: 'IGDB API took too long to respond.' });
        }
        res.status(500).json({ error: 'Failed to get game details from IGDB API.' });
    }
});

// --- NEW: Endpoint to check GOG ---
app.get('/checkGog', async (req, res) => {
    const gameName = req.query.gameName;
    if (!gameName) {
        return res.status(400).json({ error: 'Game name query parameter is required' });
    }

    // GOG Search API endpoint (embed version is usually stable)
    const gogSearchUrl = `https://embed.gog.com/games/ajax/filtered?mediaType=game&search=${encodeURIComponent(gameName)}`;

    console.log(`Checking GOG for "${gameName}": ${gogSearchUrl}`);
    try {
        const response = await axios.get(gogSearchUrl, {
            headers: { // Basic headers usually work
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Node.js App) GameGet/1.0' // Custom user agent
            },
            timeout: 7000 // 7 second timeout
        });

        // Check if the response structure is as expected
        if (response.data && response.data.products && response.data.products.length > 0) {
            // Take the first product as the most likely match
            const firstProduct = response.data.products[0];
            console.log(`GOG - First result: "${firstProduct.title}"`);

            // Construct the full URL (GOG API often gives relative /game/ url)
            // Check for 'url' property first, then fall back to others if needed
            let productUrl = null;
            if (firstProduct.url) {
                 productUrl = `https://www.gog.com${firstProduct.url}`;
            } else if (firstProduct.purchaseLink) {
                 productUrl = firstProduct.purchaseLink; // Sometimes contains full URL
            }

            // Use string similarity to compare the found title with the search query
            const similarity = stringSimilarity.compareTwoStrings(gameName.toLowerCase(), firstProduct.title.toLowerCase());
            const similarityThreshold = 0.6; // Adjust this threshold (0 to 1) if needed
            console.log(`GOG - Title similarity: ${similarity.toFixed(2)}`);

            // Check if similarity is good and we have a URL
            if (productUrl && similarity >= similarityThreshold) {
                 console.log(`GOG - Match found! URL: ${productUrl}`);
                 return res.json({ found: true, url: productUrl }); // Send success response
            } else {
                 console.log(`GOG - First result title (similarity ${similarity.toFixed(2)}) doesn't match well enough or URL missing.`);
            }
        } else {
            console.log(`GOG - No products found in API response for "${gameName}".`);
        }

        // If no match found or no products returned
        res.json({ found: false });

    } catch (error) {
        console.error(`Error checking GOG for "${gameName}":`, error.message);
         if (error.response) {
            console.error("GOG Response Status:", error.response.status);
            // console.error("GOG Response Data:", error.response.data); // Be cautious logging full data
         }
        // Send found: false on error, don't expose internal error details ideally
        res.status(500).json({ found: false, error: 'Failed to check GOG store.' });
    }
});
// --- End /checkGog endpoint ---



// Other endpoints (/search, catch-all, etc.) remain unchanged.

   
/*
// --- Catch-all route ---
app.get('*', (req, res) => {
  console.log(`Catch-all route hit for: ${req.originalUrl}. Serving index.html.`);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
*/

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.info("INFO: This version uses the IGDB API and allows selection from search results.");
});

// Optional error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});