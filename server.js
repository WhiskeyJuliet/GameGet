require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const http = require('http'); // Or https if needed
const fs = require('fs').promises; // Use promises API
const cheerio = require('cheerio'); // For parsing HTML on backend

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

      
      
// --- API Endpoint for Searching (returns list with year) ---
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

     
// --- API Endpoint for getting details of a specific game ID ---
app.get('/details/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (!gameId || isNaN(parseInt(gameId))) { return res.status(400).json({ error: 'Valid game ID parameter is required.' }); }
    const parsedGameId = parseInt(gameId);

    try {
        const accessToken = await getTwitchAccessToken();
        const igdbUrl = 'https://api.igdb.com/v4/games';

        // --- SIMPLIFIED Query: Fields needed for display + metadata ---
        const requestBody = `
            fields
                name,
                first_release_date,
                cover.url,
                platforms.name,
                involved_companies.company.name, involved_companies.developer,
                websites.url, websites.category;
            where id = ${parsedGameId};
            limit 1;
        `;
        // --- End Query ---

        console.log(`Querying IGDB for details (ID: ${parsedGameId})...`);
        const igdbResponse = await axios.post(igdbUrl, requestBody, {
             headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
             timeout: 10000
        });

        if (igdbResponse.data && igdbResponse.data.length > 0) {
            const game = igdbResponse.data[0];
            console.log("IGDB Raw Details Data:", game);

            // Map IGDB data needed for Frontend Display & Metadata
            const gameData = {
                id: game.id, // Keep ID for metadata
                name: game.name || 'N/A',
                thumbnailUrl: null,
                releaseTimestamp: game.first_release_date || null, // For metadata sorting
                releaseDate: 'N/A', // Formatted string for display & metadata
                developer: 'N/A',
                platforms: [], // Array of names for display & metadata
                igdbStoreLinks: [] // Array of {name, url} for display & metadata
            };

            // Map Cover URL
            if (game.cover && game.cover.url) {
                gameData.thumbnailUrl = game.cover.url.replace('t_thumb', 't_cover_big');
                if (gameData.thumbnailUrl.startsWith('//')) { gameData.thumbnailUrl = 'https:' + gameData.thumbnailUrl; }
            }

            // Map Release Date (Formatted String)
            if (game.first_release_date) {
                gameData.releaseDate = new Date(game.first_release_date * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            }

            // Map Developer
            if (game.involved_companies && Array.isArray(game.involved_companies)) {
                const devCompany = game.involved_companies.find(ic => ic.developer === true && ic.company?.name);
                if (devCompany) gameData.developer = devCompany.company.name;
            }

            // Map Platforms (Names)
            if (game.platforms && Array.isArray(game.platforms)) {
                gameData.platforms = game.platforms.map(p => p.name).filter(Boolean);
            }

            // Map Store Links (Steam, Epic, GOG from IGDB)
            if (game.websites && Array.isArray(game.websites)) {
                game.websites.forEach(site => {
                    let storeName = null;
                    switch (site.category) { case 13: storeName = 'Steam'; break; case 16: storeName = 'Epic Games'; break; case 17: storeName = 'GOG'; break; }
                    if (storeName && site.url) {
                         const urlLower = site.url.toLowerCase(); let isValid = false;
                         if (storeName === 'Steam' && urlLower.includes('store.steampowered.com/app/')) isValid = true;
                         else if (storeName === 'Epic Games' && (urlLower.includes('store.epicgames.com/') || urlLower.includes('www.epicgames.com/store/'))) isValid = true;
                         else if (storeName === 'GOG' && urlLower.includes('gog.com/')) isValid = true;
                         if (isValid) gameData.igdbStoreLinks.push({ name: storeName, url: site.url });
                    }
                });
            }

            console.log("Mapped Game Details for Frontend:", gameData);
            res.json(gameData);

        } else {
            console.log(`Game ID ${parsedGameId} not found on IGDB.`);
            res.status(404).json({ error: `Game with ID ${parsedGameId} not found.` });
        }

    } catch (error) {
        console.error(`Error getting IGDB details for ID ${parsedGameId}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        // ... specific error handling (auth, timeout) ...
        res.status(500).json({ error: 'Failed to get game details from IGDB API.' });
    }
});

// --- NEW: API Endpoint to Scan Collection Folder --- // <<<--- ADDED START
app.get('/api/getCollection', async (req, res) => {
    const collectionPath = path.join(__dirname, 'public', 'results'); // Path to check
    console.log(`API: Scanning collection folder: ${collectionPath}`);

    try {
        // Check if directory exists first
        try {
            await fs.access(collectionPath); // Check access/existence
        } catch (dirError) {
            if (dirError.code === 'ENOENT') {
                console.warn(`Collection directory '${collectionPath}' not found. Creating it.`);
                await fs.mkdir(collectionPath, { recursive: true }); // Create if missing
                return res.json([]); // Return empty array if just created
            } else {
                throw dirError; // Re-throw other access errors
            }
        }

        const files = await fs.readdir(collectionPath);
        const htmlFiles = files.filter(file => file.toLowerCase().endsWith('.html'));
        console.log(`API: Found ${htmlFiles.length} HTML files.`);

        const collectionData = [];

        // Process each HTML file
        for (const filename of htmlFiles) { // Use for...of for simpler async loop
            try {
                const filePath = path.join(collectionPath, filename);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const $ = cheerio.load(fileContent); // Load HTML into cheerio

                const metadata = {};
                // Extract metadata using cheerio selectors
                $('head meta[name^="gameget:"]').each((i, elem) => {
                    const nameAttr = $(elem).attr('name');
                    const content = $(elem).attr('content');

                    if (nameAttr && content !== undefined) {
                         const name = nameAttr.substring(8); // Remove "gameget:" prefix

                         // Type conversion based on expected name
                         if (content === '') { // Treat empty content as null for consistency
                             metadata[name] = null;
                         } else if (name === 'id' || name === 'releaseTimestamp' || name === 'igdbRating' || name === 'userRatingValue') {
                             metadata[name] = parseFloat(content);
                             if (isNaN(metadata[name])) metadata[name] = null; // Set to null if parsing failed
                         } else if (name === 'platforms' || name === 'genres') {
                             metadata[name] = content ? content.split(',').map(s => s.trim()).filter(Boolean) : []; // Split, trim, filter empty
                         } else if (name === 'storeLinks') {
                             try { metadata[name] = JSON.parse(content || '[]'); if (!Array.isArray(metadata[name])) metadata[name] = []; }
                             catch { metadata[name] = [];}
                         } else {
                             metadata[name] = content; // Keep as string (name, dev, date string, coverUrl, userRatingStyle, userPlatform)
                         }
                    }
                });

                // Add if valid
                if (metadata.name && metadata.id) {
                     metadata.sourceFile = filename; // Add filename for reference
                     collectionData.push(metadata);
                } else {
                     console.warn(`API: Skipping file ${filename}: Missing essential metadata (name or id). Content:`, content.substring(0, 200));
                }

            } catch (fileError) {
                console.error(`API: Error processing file ${filename}:`, fileError.message);
            }
        } // End for...of loop

        console.log(`API: Successfully parsed metadata for ${collectionData.length} files.`);
        res.json(collectionData); // Send array of metadata objects

    } catch (error) {
        console.error("API: Error reading collection directory:", error);
        res.status(500).json({ error: 'Failed to read collection data.' });
    }
});


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