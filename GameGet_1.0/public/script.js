      
document.addEventListener('DOMContentLoaded', () => { // Ensure DOM is loaded

    // --- DOM Element References ---
    const gameInput = document.getElementById('gameInput');
    const searchButton = document.getElementById('searchButton'); // Make sure this finds the button
    const resultsDiv = document.getElementById('results');

    // Settings Elements
    const settingsCog = document.getElementById('settings-cog');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsClose = document.getElementById('settings-close');
    const themeRadioGroup = document.getElementById('theme-radio-group'); // Get the group
    const fontSelector = document.getElementById('font-selector');
    const customColorEditor = document.getElementById('custom-color-editor');
    const customColorInputs = customColorEditor.querySelectorAll('input[type="color"]');
    const customHexInputs = customColorEditor.querySelectorAll('input.hex-input');
    const resetCustomColorsButton = document.getElementById('reset-custom-colors');

    const API_BASE_URL = 'http://localhost:3000';
    const LOCAL_STORAGE_THEME_KEY = 'selectedTheme';
    const LOCAL_STORAGE_FONT_KEY = 'selectedFont';
    const LOCAL_STORAGE_CUSTOM_COLORS_KEY = 'customThemeColors';


    // --- Verify crucial elements exist ---
    if (!searchButton) {
        console.error("CRITICAL ERROR: Search button (#searchButton) not found in DOM!");
        alert("Initialization Error: Search button missing. App may not function."); // User feedback
        return; // Stop script execution if button is missing
    }
    if (!gameInput) {
         console.error("CRITICAL ERROR: Game input (#gameInput) not found in DOM!");
         alert("Initialization Error: Game input missing. App may not function.");
         return;
    }
    if (!resultsDiv) {
         console.error("CRITICAL ERROR: Results container (#results) not found in DOM!");
         alert("Initialization Error: Results area missing. App may not function.");
         return;
    }
    // Add similar checks for settings elements if needed


    // --- Event Listeners ---
    searchButton.addEventListener('click', searchGamesList);
    console.log("Search button click listener attached."); // <<<--- DEBUG LOG

    gameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            console.log("Enter key pressed in input, calling searchGamesList..."); // <<<--- DEBUG LOG
            searchGamesList();
        }
    });

    // Settings Panel Listeners
    settingsCog.addEventListener('click', () => settingsPanel.classList.add('visible'));
    settingsClose.addEventListener('click', () => settingsPanel.classList.remove('visible'));
    document.addEventListener('click', (event) => { // Close on outside click
        if (!settingsPanel.contains(event.target) && !settingsCog.contains(event.target) && settingsPanel.classList.contains('visible')) {
           settingsPanel.classList.remove('visible');
        }
    });

    // Theme Change Listener
    themeRadioGroup.addEventListener('change', (event) => {
        if (event.target.type === 'radio') applyTheme(event.target.value);
    });

    // Font Change Listener
    fontSelector.addEventListener('change', (event) => applyFont(event.target.value));

    // Custom Color Input Listeners
    customColorInputs.forEach(picker => {
        picker.addEventListener('input', handleColorInputChange);
        picker.addEventListener('change', handleColorInputChange);
    });
    customHexInputs.forEach(hexInput => {
        hexInput.addEventListener('change', handleHexInputChange);
    });
    resetCustomColorsButton.addEventListener('click', resetCustomColorsToThemeDefaults);


    // --- Helper: Sync Color Picker and Hex Input ---
    function syncColorInputs(variableName, newValue) {
        try { // Add try-catch for robustness
            const picker = customColorEditor.querySelector(`input[type="color"][data-varname="${variableName}"]`);
            const hexInput = customColorEditor.querySelector(`input.hex-input[data-varname="${variableName}"]`);
            // Convert to lowercase for consistency if needed, ensure it starts with #
            let processedValue = newValue.toLowerCase();
            if (!processedValue.startsWith('#')) {
                processedValue = '#' + processedValue; // Assume it's missing #
            }
            if (/^#[0-9a-f]{6}$/.test(processedValue)) { // Basic validation before setting
                if (picker) picker.value = processedValue;
                if (hexInput) hexInput.value = processedValue.toUpperCase();
            } else {
                 console.warn(`syncColorInputs: Invalid color value "${newValue}" for ${variableName}`);
            }

        } catch (e) {
            console.error(`Error in syncColorInputs for ${variableName}:`, e);
        }
    }

    // --- Event Handlers for Custom Colors ---
    function handleColorInputChange(event) {
        const variableName = event.target.dataset.varname;
        const newValue = event.target.value;
        syncColorInputs(variableName, newValue);
        updateCustomColor(variableName, newValue);
        saveCustomColors();
    }

    function handleHexInputChange(event) {
        const variableName = event.target.dataset.varname;
        let newValue = event.target.value.trim().toUpperCase();
        // Ensure starts with #
        if (!newValue.startsWith('#')) {
            newValue = '#' + newValue;
        }

        if (/^#[0-9A-F]{6}$/i.test(newValue)) {
            syncColorInputs(variableName, newValue);
            updateCustomColor(variableName, newValue);
            saveCustomColors();
        } else {
             const currentComputedColor = getComputedStyle(document.body).getPropertyValue(variableName).trim();
             event.target.value = currentComputedColor.toUpperCase(); // Revert input
             console.warn("Invalid hex code entered:", event.target.value, "Reverting.");
             alert(`Invalid Hex Code: ${event.target.value}\nPlease use format #RRGGBB`); // User feedback
        }
    }

    // --- Settings Management Functions ---
    function updateCustomColor(variableName, value) {
        try {
            console.log(`Setting custom var ${variableName} to ${value}`);
            document.body.style.setProperty(variableName, value);
        } catch (e) {
            console.error(`Error setting CSS variable ${variableName}:`, e);
        }
    }

    function saveCustomColors() {
        try {
            const customColors = {};
            customColorInputs.forEach(picker => {
                if(picker.dataset.varname) { // Ensure varname exists
                   customColors[picker.dataset.varname] = picker.value;
                }
            });
            localStorage.setItem(LOCAL_STORAGE_CUSTOM_COLORS_KEY, JSON.stringify(customColors));
            console.log("Saved custom colors:", customColors);
        } catch (e) {
            console.error("Error saving custom colors to localStorage:", e);
        }
    }

    function loadCustomColors() {
        const savedColors = localStorage.getItem(LOCAL_STORAGE_CUSTOM_COLORS_KEY);
        if (savedColors) {
            try {
                const customColors = JSON.parse(savedColors);
                console.log("Loading custom colors:", customColors);
                Object.entries(customColors).forEach(([varName, value]) => {
                    updateCustomColor(varName, value); // Apply directly
                    syncColorInputs(varName, value); // Update inputs
                });
                return true; // Indicate custom colors were loaded
            } catch (e) {
                console.error("Error parsing/applying saved custom colors:", e);
                localStorage.removeItem(LOCAL_STORAGE_CUSTOM_COLORS_KEY);
                return false;
            }
        }
        return false;
    }

    function populateCustomColorInputsFromComputed() {
        try {
            const computedStyle = getComputedStyle(document.body);
            customColorInputs.forEach(picker => {
                const varName = picker.dataset.varname;
                if (varName) {
                    const computedValue = computedStyle.getPropertyValue(varName).trim();
                    syncColorInputs(varName, computedValue);
					// Apply this computed value directly to the body's style attribute.
                    // This ensures that when resetting, the visually applied style matches the input.
                    updateCustomColor(varName, computedValue);
                }
            });
            console.log("Populated custom color inputs AND applied computed styles to body."); // Updated log
        } catch(e) {
            console.error("Error populating custom inputs from computed styles:", e);
        }
    }

 function resetCustomColorsToThemeDefaults() {
         try {
            const selectedPresetRadio = themeRadioGroup.querySelector('input[name="theme"]:checked:not([value="custom"])') || themeRadioGroup.querySelector('input[name="theme"][value="light"]');
            const baseThemeName = selectedPresetRadio.value;
            console.log("Resetting custom colors based on theme:", baseThemeName);

            // --- Step 1: Store current inline style (optional, maybe not needed) ---
            // const originalInlineStyle = document.body.getAttribute('style');

            // --- Step 2: Clear existing custom inline styles ---
            console.log("Clearing existing inline styles for custom vars...");
            customColorInputs.forEach(picker => {
                if (picker.dataset.varname) {
                    document.body.style.removeProperty(picker.dataset.varname);
                }
            });
            // Also remove the font if it was set inline (it usually is)
            document.body.style.removeProperty('--body-font');


            // --- Step 3: Apply the base theme via attribute ---
            document.body.dataset.theme = baseThemeName;

            // --- Step 4: Wait for styles to apply and compute ---
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    console.log("Executing reset logic after animation frame(s)...");

                    // --- Step 5: Populate inputs and RE-APPLY inline styles ---
                    // populateCustomColorInputsFromComputed now reads the PRESET theme's
                    // values (because inline styles were cleared) and applies them inline.
                    populateCustomColorInputsFromComputed();

                    // --- Step 6: Set theme attribute back to custom ---
                    // The inline styles applied in step 5 will now take effect visually.
                    document.body.dataset.theme = 'custom';

                    // --- Step 7: Re-apply font (important!) ---
                    // We cleared it earlier, need to re-apply the selected font
                    const selectedFont = fontSelector.value;
                    applyFont(selectedFont); // applyFont sets the inline style AND saves

                    // --- Step 8: Save the newly populated custom colors ---
                    saveCustomColors();
                });
            });

         } catch (e) {
              console.error("Error resetting custom colors:", e);
              // Consider restoring original style if needed:
              // if (originalInlineStyle) document.body.setAttribute('style', originalInlineStyle);
         }
    }

    // Ensure populateCustomColorInputsFromComputed is still correct
    function populateCustomColorInputsFromComputed() {
        try {
            const computedStyle = getComputedStyle(document.body);
            customColorInputs.forEach(picker => {
                const varName = picker.dataset.varname;
                if (varName) {
                    const computedValue = computedStyle.getPropertyValue(varName).trim();
                    syncColorInputs(varName, computedValue);
                    // Apply this computed (preset theme) value as the new inline style
                    updateCustomColor(varName, computedValue);
                }
            });
            console.log("Populated custom color inputs AND applied computed styles to body.");
        } catch(e) {
            console.error("Error populating/applying custom inputs from computed styles:", e);
        }
    }

    // Ensure applyFont sets the inline style correctly
    function applyFont(fontName) {
        try {
            console.log("Applying font:", fontName);
            document.body.style.setProperty('--body-font', fontName); // Sets inline style
            localStorage.setItem(LOCAL_STORAGE_FONT_KEY, fontName);
        } catch (e) {
            console.error(`Error applying font ${fontName}:`, e);
        }
    }


    function applyTheme(themeName) {
        console.log("Applying theme:", themeName);
        try {
            document.body.dataset.theme = themeName;
            localStorage.setItem(LOCAL_STORAGE_THEME_KEY, themeName);

            if (themeName === 'custom') {
                if (!loadCustomColors()) { // Try loading saved custom colors
                    populateCustomColorInputsFromComputed(); // If none, populate from current style
                    saveCustomColors(); // And save these as the initial custom set
                }
                customColorEditor.style.display = 'block';
            } else {
                customColorEditor.style.display = 'none';
                // Clear direct styles when switching away from custom
                customColorInputs.forEach(picker => {
                     if(picker.dataset.varname) {
                         document.body.style.removeProperty(picker.dataset.varname);
                     }
                });
            }
        } catch (e) {
             console.error(`Error applying theme ${themeName}:`, e);
        }
    }

    function applyFont(fontName) {
        try {
            console.log("Applying font:", fontName);
            document.body.style.setProperty('--body-font', fontName);
            localStorage.setItem(LOCAL_STORAGE_FONT_KEY, fontName);
        } catch (e) {
            console.error(`Error applying font ${fontName}:`, e);
        }
    }

    function loadSettings() {
        try { // Wrap entire function for safety
            const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
            const savedFont = localStorage.getItem(LOCAL_STORAGE_FONT_KEY);
            const defaultTheme = 'light';

            let themeToApply = savedTheme || defaultTheme;

            // Validate theme
            const validThemes = Array.from(themeRadioGroup.querySelectorAll('input[name="theme"]')).map(radio => radio.value);
            if (!validThemes.includes(themeToApply)) {
                console.warn(`Saved theme "${themeToApply}" is invalid. Resetting to default.`);
                themeToApply = defaultTheme;
                localStorage.removeItem(LOCAL_STORAGE_THEME_KEY);
            }

            // Apply theme FIRST
            applyTheme(themeToApply);

            // Check radio state AFTER applying theme
            const currentThemeRadio = themeRadioGroup.querySelector(`input[name="theme"][value="${themeToApply}"]`);
            if (currentThemeRadio) {
                currentThemeRadio.checked = true;
            } else {
                 console.error(`Could not find theme radio for value: ${themeToApply}. Defaulting check state.`);
                 const defaultThemeRadio = themeRadioGroup.querySelector(`input[name="theme"][value="${defaultTheme}"]`);
                 if (defaultThemeRadio) defaultThemeRadio.checked = true;
            }

            // Apply saved font
            if (savedFont) {
                // Validate font
                 const validFonts = Array.from(fontSelector.options).map(option => option.value);
                 if (validFonts.includes(savedFont)) {
                    applyFont(savedFont);
                    fontSelector.value = savedFont;
                 } else {
                     console.warn(`Saved font "${savedFont}" is invalid. Using default.`);
                     localStorage.removeItem(LOCAL_STORAGE_FONT_KEY);
                 }
            }

            console.log(`Loaded settings: Theme='${themeToApply}', Font='${savedFont || 'Default'}'`);
        } catch (e) {
            console.error("Critical error during loadSettings:", e);
             alert("Error loading settings. Defaults may be applied.");
             // Attempt to apply default theme as a fallback
             try { applyTheme('light'); } catch {}
        }
    } // End loadSettings


    // --- Platform Logo Mapping Helper Function ---
    function getLogoPathForPlatform(platformName) {
        const nameLower = platformName.toLowerCase();
        const basePath = 'images/platforms/';
        // Add more specific cases first
    if (nameLower.includes('windows') || nameLower.includes('mswin')) {
            return basePath + 'windows.png';
		} else if (nameLower.includes('ms-dos') || nameLower.includes('dos')) {
            return basePath + 'dos.png';
		} else if (nameLower.includes('pc-98') || nameLower.includes('NEC PC-9800')) {
            return basePath + 'pc98.png';
		} else if (nameLower.includes('pc')) { // General fallback for generic pc
            return basePath + 'pc.gif';
        } else if (nameLower.includes('playstation 5') || nameLower.includes('ps5')) {
            return basePath + 'ps5.png';
        } else if (nameLower.includes('playstation 4') || nameLower.includes('ps4')) {
            return basePath + 'ps4.png';
        } else if (nameLower.includes('playstation 3') || nameLower.includes('ps3')) {
            return basePath + 'ps3.png'; 
        } else if (nameLower.includes('playstation 2') || nameLower.includes('ps2')) {
            return basePath + 'ps2.png'; 
        } else if (nameLower.includes('playstation vita')) {
            return basePath + 'psvita.png';
        } else if (nameLower.includes('psp') || nameLower.includes('playstation portable')) {
            return basePath + 'psp.png';
        } else if (nameLower.includes('playstation') || nameLower.includes('psx') || nameLower.includes('ps1')) {
            return basePath + 'playstation.png';
        } else if (nameLower.includes('xbox series')) { // Catches X and S
            return basePath + 'xboxseriesx.png';
        } else if (nameLower.includes('xbox one')) {
            return basePath + 'xboxone.png';
        } else if (nameLower.includes('xbox 360')) {
            return basePath + 'xbox360.png'; 
        } else if (nameLower.includes('xbox')) { // General fallback for Xbox
            return basePath + 'xbox.png';
        } else if (nameLower.includes('switch')) {
            return basePath + 'switch.png';
        } else if (nameLower.includes('wii u')) {
            return basePath + 'wiiu.png';
        } else if (nameLower.includes('wii')) {
            return basePath + 'wii.png'; 
        } else if (nameLower.includes('nintendo 3ds')) {
            return basePath + '3ds.png'; 
        } else if (nameLower.includes('nintendo ds')) {
            return basePath + 'nds.png'; 
        } else if (nameLower.includes('gamecube') || nameLower.includes('ngc')) {
            return basePath + 'gamecube.png'; 
        } else if (nameLower.includes('nintendo 64') || nameLower.includes('n64')) {
            return basePath + 'n64.png'; 
		} else if (nameLower.includes('64DD') || nameLower.includes('Nintendo 64DD')) {
            return basePath + '64dd.png'; 
        } else if (nameLower.includes('snes') || nameLower.includes('super nintendo')) {
            return basePath + 'snes.png';
		} else if (nameLower.includes('super famicom') || nameLower.includes('SFC')) {
            return basePath + 'snes.png';
		} else if (nameLower.includes('sega mega drive') || nameLower.includes('sega genesis')) { 
            return basePath + 'md.png';			
        } else if (nameLower.includes('nintendo entertainment system') || nameLower.includes('nes')) {
            return basePath + 'nintendo.png'; 
        } else if (nameLower.includes('linux')) {
            return basePath + 'linux.png';
        } else if (nameLower.includes('mac') || nameLower.includes('macos')) {
            return basePath + 'mac.png';
        } else if (nameLower.includes('android')) {
            return basePath + 'android.png';
        } else if (nameLower.includes('ios')) {
            return basePath + 'ios.png';
        } else if (nameLower.includes('stadia')) {
            return basePath + 'stadia.png';
		} else if (nameLower.includes('tapwave') || nameLower.includes('tapwave zodiac')) {
            return basePath + 'tapwave.png';
		} else if (nameLower.includes('atari 2600') || nameLower.includes('Atari VCS')) {
            return basePath + 'atari2600.png';
		} else if (nameLower.includes('atari 5200') || nameLower.includes('Atari 5200 SuperSystem')) {
            return basePath + 'atari5200.png';
		} else if (nameLower.includes('atari')) { // General fallback for atari
            return basePath + 'atari.png';
		} else if (nameLower.includes('amiga') || nameLower.includes('Commodore Amiga')) { // General fallback for amiga
            return basePath + 'amiga.png';
		} else if (nameLower.includes('amiga cd32')) { 
            return basePath + 'cd32.png';
		} else if (nameLower.includes('sega dreamcast') || nameLower.includes('dreamcast')) { 
            return basePath + 'dreamcast.png';
		} else if (nameLower.includes('master system') || nameLower.includes('sega master system')) { 
            return basePath + 'mastersystem.png';
		} else if (nameLower.includes('saturn') || nameLower.includes('sega saturn')) { 
            return basePath + 'saturn.png';
        }
		// Add more mappings here for other consoles/platforms as needed...

        // Default fallback icon if no specific match is found
        console.warn(`No specific logo for platform: "${platformName}", using default.`);
        return basePath + 'default.png';
    }

    // --- Core Search and Display Functions ---

    async function searchGamesList() {
        console.log("--- searchGamesList function CALLED ---"); // <<<--- DEBUG LOG

        const gameName = gameInput.value.trim();
        if (!gameName) {
            console.log("searchGamesList: Game name is empty.");
            resultsDiv.innerHTML = '<p class="error-message">Please enter a game name.</p>';
            return;
        }
        console.log(`searchGamesList: Searching for "${gameName}"`);

        resultsDiv.innerHTML = '<p class="info-message loading">Searching IGDB...</p>';
        searchButton.disabled = true;

        try {
            console.log("searchGamesList: Fetching from backend...");
            const response = await fetch(`${API_BASE_URL}/search?gameName=${encodeURIComponent(gameName)}`);
            console.log(`searchGamesList: Backend response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server returned status ${response.status}` }));
                console.error("searchGamesList: Backend returned error:", response.status, errorData);
                throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const searchResults = await response.json();
            console.log("searchGamesList: Received results:", searchResults.length);

            if (searchResults && searchResults.length > 0) {
                displaySearchResultsList(searchResults);
            } else {
                 resultsDiv.innerHTML = `<p class="info-message">No games found matching "${gameName}".</p>`;
            }
        } catch (error) {
            console.error('Search List Fetch Error:', error);
            resultsDiv.innerHTML = `<p class="error-message">Error: ${error.message}. Could not fetch game list.</p>`;
        } finally {
             console.log("searchGamesList: Re-enabling search button.");
             searchButton.disabled = false;
        }
    } // End searchGamesList

    function displaySearchResultsList(results) {
        resultsDiv.innerHTML = '';
        const instruction = document.createElement('p');
        instruction.classList.add('info-message');
        instruction.textContent = 'Select a game to view details:';
        resultsDiv.appendChild(instruction);
        const list = document.createElement('ul');
        list.classList.add('search-results-list');
        results.forEach(game => {
            const item = document.createElement('li');
            item.classList.add('search-result-item');
            item.dataset.gameId = game.id;
            const nameSpan = document.createElement('span');
            nameSpan.textContent = game.name;
            nameSpan.classList.add('game-title');
            const dateSpan = document.createElement('span');
            dateSpan.textContent = `(${game.year || 'N/A'})`;
            dateSpan.classList.add('game-shortdate');
            item.appendChild(nameSpan);
            item.appendChild(dateSpan);
            item.addEventListener('click', () => {
                fetchGameDetails(game.id);
            });
            list.appendChild(item);
        });
        resultsDiv.appendChild(list);
    } // End displaySearchResultsList

    async function fetchGameDetails(gameId) {
        resultsDiv.innerHTML = '<p class="info-message loading">Loading details...</p>';
        searchButton.disabled = true;
        try {
            const response = await fetch(`${API_BASE_URL}/details/${gameId}`);
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: `Server returned status ${response.status}` }));
                 throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
            }
            const gameDetails = await response.json();
            displayGameDetails(gameDetails);
        } catch (error) {
            console.error('Fetch Details Error:', error);
            resultsDiv.innerHTML = `<p class="error-message">Error loading details: ${error.message}.</p>`;
        } finally {
            searchButton.disabled = false;
        }
    } // End fetchGameDetails

/**
     * Displays the full details of a selected game AND triggers store check.
     * @param {object} data - The game data object {name, thumbnailUrl, releaseDate, platforms: [name1, ...]}.
     */
    function displayGameDetails(data) {
        if (!data || !data.name) {
             resultsDiv.innerHTML = '<p class="info-message">Could not extract valid game details.</p>';
             return;
        }
        resultsDiv.innerHTML = ''; // Clear previous results

        const gameInfoDiv = document.createElement('div');
        gameInfoDiv.classList.add('game-info');

        const imgElement = document.createElement('img'); // Thumbnail
        imgElement.src = data.thumbnailUrl || 'https://via.placeholder.com/120x160?text=No+Art';
        imgElement.alt = `${data.name} Box Art`;
        imgElement.onerror = () => { /* ... error handling ... */ };

        const detailsDiv = document.createElement('div'); // Container for text details
        detailsDiv.classList.add('game-details');

        const nameElement = document.createElement('h2'); // Name
        nameElement.textContent = data.name;
        detailsDiv.appendChild(nameElement);

        const releaseElement = document.createElement('p'); // Release Date
        releaseElement.innerHTML = `<strong>Release Date:</strong> ${data.releaseDate || 'N/A'}`;
        detailsDiv.appendChild(releaseElement);

        const platformsElement = document.createElement('p'); // Platforms Header
        platformsElement.innerHTML = '<strong>Platforms:</strong>';
        detailsDiv.appendChild(platformsElement);

        // Platform List Creation (with local logos)
        if (data.platforms && data.platforms.length > 0) {
            const platformList = document.createElement('ul');
            data.platforms.forEach(platformName => {
                const li = document.createElement('li');
                li.classList.add('platform-item');
                const logoPath = getLogoPathForPlatform(platformName);
                const logoImg = document.createElement('img');
                logoImg.src = logoPath;
                logoImg.alt = `${platformName} logo`;
                logoImg.classList.add('platform-logo');
                logoImg.width = 16; logoImg.height = 16;
                logoImg.onerror = () => { logoImg.src = 'images/platforms/default.png'; logoImg.onerror = () => { logoImg.remove(); }; };
                li.appendChild(logoImg);
                const platformNameSpan = document.createElement('span');
                platformNameSpan.textContent = platformName;
                li.appendChild(platformNameSpan);
                platformList.appendChild(li);
            });
            detailsDiv.appendChild(platformList);
        } else {
            const noPlatforms = document.createElement('span'); noPlatforms.textContent = ' N/A';
            platformsElement.appendChild(noPlatforms);
        }

        // --- Create placeholder for Store Links ---
        const storeLinksContainer = document.createElement('div');
        storeLinksContainer.classList.add('store-links-container');
        detailsDiv.appendChild(storeLinksContainer); // Append AFTER platforms


        // Assemble the main info display FIRST
        gameInfoDiv.appendChild(imgElement);
        gameInfoDiv.appendChild(detailsDiv);
        resultsDiv.appendChild(gameInfoDiv); // Add main info to the page

        // --- Asynchronously check GOG store AFTER displaying base info ---
        checkGogStore(data.name, storeLinksContainer); // Pass name and container

    } // End displayGameDetails


    /**
     * NEW Function: Checks GOG store and adds button if found.
     * @param {string} gameName - The name of the game to check.
     * @param {HTMLElement} container - The container element to add the button to.
     */
    async function checkGogStore(gameName, container) {
        console.log(`Checking GOG store for "${gameName}"...`);
        container.innerHTML = `<p class="info-message store-loading">Checking GOG.com...</p>`; // Loading indicator

        const gogCheckUrl = `${API_BASE_URL}/checkGog?gameName=${encodeURIComponent(gameName)}`;

        try {
            const response = await fetch(gogCheckUrl);
            const result = await response.json(); // Expecting { found: boolean, url?: string, error?: string }

            // Clear loading indicator
            const loadingIndicator = container.querySelector('.store-loading');
            if (loadingIndicator) loadingIndicator.remove();

            if (response.ok && result.found && result.url) {
                addStoreButton(container, 'GOG', result.url, 'images/gog_logo.png'); // Add button on success
            } else {
                console.log(`GOG check for "${gameName}" returned found: false or encountered an error.`);
                // Optionally display "Not found on GOG" message or just leave container empty
                 if (!response.ok) {
                     console.error(`GOG check failed with status ${response.status}`, result.error || '');
                 }
            }

        } catch (error) { // Catch fetch errors
            console.error("Error during GOG store check fetch:", error);
            const loadingIndicator = container.querySelector('.store-loading');
            if (loadingIndicator) loadingIndicator.remove();
            container.innerHTML = `<p class="error-message store-error">Could not check GOG.com.</p>`; // Error message
        }
    } // End checkGogStore


    /**
     * NEW Helper: Creates and adds a store button/link.
     * @param {HTMLElement} container - The parent element.
     * @param {string} storeName - e.g., "GOG".
     * @param {string} url - The URL to the store page.
     * @param {string} logoSrc - Path to the local store logo image.
     */
     function addStoreButton(container, storeName, url, logoSrc) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank'; // Open in new tab
        link.rel = 'noopener noreferrer'; // Security best practice
        link.classList.add('store-button', `${storeName.toLowerCase()}-button`);
        link.title = `Buy on ${storeName}`;

        // Add logo
        const logo = document.createElement('img');
        logo.src = logoSrc;
        logo.alt = `${storeName} logo`;
        logo.classList.add('store-logo');
        logo.width = 16; logo.height = 16;
        logo.onerror = () => { // Handle missing logo file
            console.warn(`Failed to load store logo: ${logoSrc}`);
            logo.remove();
        };

        // Add text
        const text = document.createElement('span');
        text.textContent = `Buy on ${storeName}`;

        link.appendChild(logo);
        link.appendChild(text);
        container.appendChild(link); // Add the complete link to the container
    } // End addStoreButton

    // --- Initial Setup ---
    loadSettings(); // Load saved settings on page load

}); // End DOMContentLoaded wrapper
    