      
document.addEventListener('DOMContentLoaded', () => { // Ensure DOM is loaded

    // --- DOM Element References ---
    const gameInput = document.getElementById('gameInput');
    const searchButton = document.getElementById('searchButton'); // Make sure this finds the button
    const resultsDiv = document.getElementById('results');
    const obsButtonContainer = document.getElementById('obs-button-container'); // Save for OBS button
	const ratingStyleGroup = document.getElementById('rating-style-group');
	
	// Collection Elements
	const tabsContainer = document.querySelector('.tabs-container');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
	const refreshCollectionButton = document.getElementById('refresh-collection-button');
    const collectionStatus = document.getElementById('collection-status');
    const collectionGrid = document.getElementById('collection-grid');
    const collectionFilterTitle = document.getElementById('collection-filter-title');
    const collectionSortSelect = document.getElementById('collection-sort-select');
	const collectionFilterDeveloper = document.getElementById('collection-filter-developer'); 
    const collectionFilterPlatform = document.getElementById('collection-filter-platform');
	
    // Settings Elements
    const settingsCog = document.getElementById('settings-cog');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsClose = document.getElementById('settings-close');
    const themeRadioGroup = document.getElementById('theme-radio-group'); // Get the group
    const fontSelector = document.getElementById('font-selector');
	const refreshFontsButton = document.getElementById('refresh-fonts-button');
    const customColorEditor = document.getElementById('custom-color-editor');
    const customColorInputs = customColorEditor.querySelectorAll('input[type="color"]');
    const customHexInputs = customColorEditor.querySelectorAll('input.hex-input');
    const resetCustomColorsButton = document.getElementById('reset-custom-colors');
	const storeLinksToggleGroup = document.getElementById('store-links-toggle-group');
	const exportButton = document.getElementById('export-colors-button'); // Import, Export and file dialogue
    const importButton = document.getElementById('import-colors-button');
    const importFileInput = document.getElementById('import-file-input');
	const platformLogoSizeInput = document.getElementById('platform-logo-size');
    const platformTextToggleGroup = document.getElementById('platform-text-toggle-group');
	 
	// Constants
    const API_BASE_URL = 'http://localhost:3000';
    const LOCAL_STORAGE_THEME_KEY = 'selectedTheme';
    const LOCAL_STORAGE_FONT_KEY = 'selectedFont';
	const LOCAL_STORAGE_THEME_FONTS_KEY = 'themeFontPreferences';
    const LOCAL_STORAGE_CUSTOM_COLORS_KEY = 'customThemeColors';
	const LOCAL_STORAGE_LOGO_SIZE_KEY = 'platformLogoSize';
    const LOCAL_STORAGE_PLATFORM_TEXT_KEY = 'platformTextVisible';
	const LOCAL_STORAGE_STORE_LINKS_KEY = 'storeLinksEnabled'; // Use generic key
	const DYNAMIC_FONT_STYLE_ID = 'dynamic-font-faces'; // ID for our style tag
	const LOCAL_STORAGE_RATING_STYLE_KEY = 'ratingDisplayStyle';
	
	// --- NEW: Default Theme Font Mapping ---
    const defaultThemeFonts = {
        'light': "'Monda', sans-serif",
        'dark': "'Monda', sans-serif",
        'purple': "'Monda', sans-serif",
        'hotdogstand': "'SystemTrue', sans-serif", // Use value from fonts.json
        'dannyvalz': "'Fredoka', sans-serif",      // Secret theme font
        'custom': "'pxSans', sans-serif" // Default for custom
    };
	
    const systemDefaultFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"; // Store separately
	
	 // --- Secret Theme Activation ---
    const secretSequence = ['d', 'a', 'n', 'n', 'y', 'r', 'u', 'l', 'e', 's'];
    let currentSequence = [];

	// --- Global State ---
    let currentGameRating = { gameId: null, value: null }; // Stores { gameId: 123, value: 4 } or { gameId: 456, value: 85 } etc.
	let currentPlatformsOrder = []; // Store current platform order
	let selectedPlatformName = null; // Global state for selected platform name
	let gameCardCollection = []; // Array holds metadata objects {id, name, developer, ...}
    // let userCardNumbering = {}; // Add later if implementing numbering


    // --- Verify crucial elements exist ---
    if (!searchButton || !gameInput || !resultsDiv || !storeLinksToggleGroup || !exportButton || !importButton || !importFileInput || !obsButtonContainer || !settingsCog || !settingsPanel || !settingsClose || !themeRadioGroup || !fontSelector || !refreshFontsButton || !customColorEditor || !resetCustomColorsButton
        || !platformLogoSizeInput || !ratingStyleGroup || !platformTextToggleGroup || !tabsContainer || !collectionFilterDeveloper || !collectionFilterPlatform) { 
        console.error("CRITICAL ERROR: One or more essential UI elements not found! Check IDs in index.html and script.js");
        alert("Initialization Error: UI elements missing. App may not function correctly.");
        return;
    }
    console.log("All essential elements verified.");
    // Add similar checks for settings elements if needed

    // --- Event Listeners ---
	searchButton.addEventListener('click', searchGamesList);
    console.log("Search button click listener attached.");
    gameInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') searchGamesList(); });
    console.log("Game input keypress listener attached.");
    settingsCog.addEventListener('click', () => settingsPanel.classList.add('visible'));
    console.log("Settings cog listener attached.");
    settingsClose.addEventListener('click', () => settingsPanel.classList.remove('visible'));
    console.log("Settings close listener attached.");
    document.addEventListener('click', (event) => { if (!settingsPanel.contains(event.target) && !settingsCog.contains(event.target) && settingsPanel.classList.contains('visible')) settingsPanel.classList.remove('visible'); });
    console.log("Document click listener attached.");
    themeRadioGroup.addEventListener('change', (event) => { if (event.target.type === 'radio') applyTheme(event.target.value); });
    console.log("Theme listener attached.");
    fontSelector.addEventListener('change', (event) => applyFont(event.target.value));
    console.log("Font listener attached.");
    storeLinksToggleGroup.addEventListener('change', (event) => { if (event.target.type === 'radio') { applyStoreLinksToggle(event.target.value === 'on'); } });
    console.log("Store Links Toggle Group listener attached.");
    customColorInputs.forEach(picker => { picker.addEventListener('input', handleColorInputChange); picker.addEventListener('change', handleColorInputChange); });
    console.log("Custom color picker listeners attached.");
    customHexInputs.forEach(hexInput => { hexInput.addEventListener('change', handleHexInputChange); });
    console.log("Custom hex input listeners attached.");
    resetCustomColorsButton.addEventListener('click', resetCustomColorsToThemeDefaults);
    console.log("Reset colors listener attached.");
	exportButton.addEventListener('click', exportCustomColors);
    console.log("Export listener attached.");
    importButton.addEventListener('click', () => importFileInput.click());
    console.log("Import listener attached.");
    importFileInput.addEventListener('change', importCustomColors);
    console.log("File input listener attached.");
	
	// PLATFORM DISPLAY LISTENERS
    platformLogoSizeInput.addEventListener('input', (event) => { applyLogoSize(event.target.value); });
    platformLogoSizeInput.addEventListener('change', (event) => { applyLogoSize(event.target.value, true); });
    console.log("Platform logo size listeners attached.");
    platformTextToggleGroup.addEventListener('change', (event) => { if (event.target.type === 'radio') { applyPlatformTextVisibility(event.target.value === 'show'); }});
    console.log("Platform text toggle listener attached.");
	
    // FONT REFRESH BUTTON listener
	refreshFontsButton.addEventListener('click', loadLocalFonts); // <-- Add Listener
    console.log("Refresh fonts listener attached.");
	
	// Rating Style Change Listener
    ratingStyleGroup.addEventListener('change', (event) => {
        if (event.target.type === 'radio') {
            applyRatingStyle(event.target.value);
        }
    });
    console.log("Rating style listener attached.");
	
	// Keydown listener for secret theme
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase(); // Get pressed key in lowercase
        // Ignore if modifier keys are pressed (Shift, Ctrl, Alt, Meta)
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        // Append key to current sequence
        currentSequence.push(key);

        // Keep only the last N keys (N = length of secret sequence)
        currentSequence = currentSequence.slice(-secretSequence.length);
        // console.log("Sequence:", currentSequence.join('')); // Debugging

        // Check if the current sequence matches the secret one
        if (currentSequence.join('') === secretSequence.join('')) {
            console.log("SECRET THEME ACTIVATED!");
            applyTheme('dannyvalz'); // Apply the hidden theme
            // Optionally: briefly show feedback, e.g., flash the background
            // document.body.style.transition = 'background-color 0.1s ease-in-out';
            // setTimeout(() => document.body.style.transition = '', 150);
            currentSequence = []; // Reset sequence
        }
    });
    console.log("Secret theme key listener attached.");
	
   // --- Tab Switching Listener ---
    tabsContainer.addEventListener('click', (e) => {
        // Use closest to handle clicks on icon/text inside button
        const button = e.target.closest('.tab-button');
        if (button) {
            const targetId = button.dataset.tabTarget; // Get the ID of the content to show (e.g., "search-screen" or "collection-screen")
            console.log(`Switching tab to: ${targetId}`);

            // 1. Deactivate all buttons and hide all content sections
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active')); // 'active' class likely controls display:block/none in CSS

            // 2. Activate the clicked button and show the target content section
            button.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if(targetContent) {
                targetContent.classList.add('active'); // Add 'active' class to show it
                console.log(`Activated content section: #${targetId}`);
            } else {
                console.error(`Target tab content #${targetId} not found!`);
            }

            // 3. Optionally load collection data if switching to that tab
            if (targetId === 'collection-screen' && gameCardCollection.length === 0) {
                 console.log("Collection tab activated, loading initial collection...");
                 loadCollection(); // Trigger load on first view
            }
        }
    });
    console.log("Tab listeners attached.");
    // --- End Tab Listener ---


    // --- Collection Control Listeners ---
    refreshCollectionButton.addEventListener('click', loadCollection);
    console.log("Collection control listeners attached.");

    // --- Filter/Sort Listeners ---
    collectionFilterTitle.addEventListener('input', () => renderCollectionGrid(gameCardCollection));
    collectionSortSelect.addEventListener('change', () => renderCollectionGrid(gameCardCollection));
	collectionFilterDeveloper.addEventListener('change', () => renderCollectionGrid(gameCardCollection));
    collectionFilterPlatform.addEventListener('change', () => renderCollectionGrid(gameCardCollection));

    console.log("Collection filter/sort listeners attached.");
	
	// End of Event Listeners
    console.log("Finished attaching event listeners.");

	// --- Settings Functions ---
	
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
                if(picker.dataset.varname) {
                   customColors[picker.dataset.varname] = picker.value;
                }
            });
            // <<< ADD LOG HERE >>>
            console.log("--- Saving Custom Colors ---");
            console.log("Values read from inputs:", JSON.stringify(customColors, null, 2));
            // <<< END ADD LOG >>>
            localStorage.setItem(LOCAL_STORAGE_CUSTOM_COLORS_KEY, JSON.stringify(customColors));
            // console.log("Saved custom colors:", customColors); // Original log
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

                    // --- Step 7: APPLY the BASE theme's DEFAULT font ---
                    const baseThemeDefaultFont = defaultThemeFonts[baseThemeName] || systemDefaultFont;
                    console.log(`Reset applying default font for base theme '${baseThemeName}': ${baseThemeDefaultFont}`);
                    // Apply AND SAVE this as the new preference for the 'custom' theme now
                    applyFont(baseThemeDefaultFont, true);
                    // --- End Apply Font ---

                    // --- Step 8: Save the newly populated custom colors ---
                    saveCustomColors();
					
					// --- Step 9: Ensure custom radio is checked
                    const customRadio = themeRadioGroup.querySelector('input[name="theme"][value="custom"]');
                    if (customRadio) customRadio.checked = true;
                });
            });

         } catch (e) {
              console.error("Error resetting custom colors:", e);
              // Consider restoring original style if needed:
              // if (originalInlineStyle) document.body.setAttribute('style', originalInlineStyle);
         }
    }
   
     function applyTheme(themeName) {
        console.log(`Applying theme: ${themeName}`);
        try {
            // Apply theme attribute FIRST - this is needed for computed style reading later
            document.body.dataset.theme = themeName;
            console.log(`Set data-theme to: ${themeName}`);

            // Save preference (unless secret theme, handle revert)
            if (themeName !== 'dannyvalz') {
                 localStorage.setItem(LOCAL_STORAGE_THEME_KEY, themeName);
                 console.log(`Saved theme preference: ${themeName}`);
            } else {
                 // Revert saved pref if activating secret theme
                 const previousTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY); // Read from storage
                 const validThemes = Array.from(themeRadioGroup.querySelectorAll('input[name="theme"]')).map(radio => radio.value);
                 if (previousTheme && previousTheme !== 'dannyvalz' && validThemes.includes(previousTheme)) {
                     localStorage.setItem(LOCAL_STORAGE_THEME_KEY, previousTheme); // Keep last valid
                     console.log(`Secret theme active. Kept saved theme pref: ${previousTheme}`);
                 } else {
                     localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'light'); // Default if needed
                     console.log("Secret theme active. Reverted saved theme preference to: light");
                 }
            }

			
			// --- Handle Styles/Editor/Font ---
            if (themeName === 'custom') {
                console.log("Theme is 'custom'. Loading colors, applying font, showing editor.");
                // 1. Load and apply custom colors (sets inline styles)
                if (!loadCustomColors()) { populateCustomColorInputsFromComputed(); saveCustomColors(); }
                // 2. Show editor
                customColorEditor.style.display = 'block';
                // 3. Apply the font specifically saved for the 'custom' theme
                const themePrefs = getThemeFontPrefs();
                // Use saved pref for 'custom', fallback to system default if none saved for custom
                const customFontToApply = themePrefs['custom'] || systemDefaultFont;
                console.log(`Custom theme: Applying font: ${customFontToApply}`);
                applyFont(customFontToApply, false); // Apply WITHOUT saving pref again

            } else { // Theme is NOT 'custom' (presets or dannyvalz)
                console.log(`Theme is '${themeName}'. Hiding editor.`);
                customColorEditor.style.display = 'none';
                // Inline styles should have been cleared above if needed

				// --- ALWAYS Clear Inline Styles when NOT 'custom' ---
                console.log(`Clearing potentially conflicting inline styles for theme '${themeName}'...`);
                customColorInputs.forEach(picker => {
                     if (picker.dataset.varname) {
                         document.body.style.removeProperty(picker.dataset.varname);
                     }
                });
                // Clear font only if the target theme isn't dannyvalz (which sets its own)
                // Although applyFont below will override anyway, this is slightly cleaner.
                if (themeName !== 'dannyvalz') {
                     document.body.style.removeProperty('--body-font');
                }
                console.log("Cleared potentially conflicting inline styles.");
                // --- END Clear ---	

                 // --- Apply Font for Presets/DannyValz ---
                let fontToApply = defaultThemeFonts[themeName] || systemDefaultFont; // Default for this theme
                // For presets only, check if user saved a preference
                if (themeName !== 'dannyvalz') {
                     const themePrefs = getThemeFontPrefs();
                     fontToApply = themePrefs[themeName] || fontToApply; // Use user pref if exists, else theme default
                }
                console.log(`Applying font for '${themeName}': ${fontToApply}`);
                applyFont(fontToApply, false); // Apply determined font (don't save pref here)
            }

            // --- Update Font Selector Dropdown AFTER applying font ---
            // This ensures the dropdown reflects the font actually applied by the logic above
             const finalAppliedFont = getComputedStyle(document.body).getPropertyValue('--body-font').trim();
             if (finalAppliedFont) {
                  const fontOption = fontSelector.querySelector(`option[value="${CSS.escape(finalAppliedFont)}"]`);
                  if (fontOption) fontSelector.value = finalAppliedFont;
                  else fontSelector.value = systemDefaultFont;
             }

        } catch (e) { console.error(`Error applying theme ${themeName}:`, e); }
        finally { console.log(`--- applyTheme END for: ${themeName} ---`); }
    } // End applyTheme

    // --- applyFont ---
     /**
     * Applies the selected font style AND saves preference for the CURRENT theme.
     * @param {string} fontName - The CSS font-family value (e.g., "'Roboto', sans-serif").
     * @param {boolean} savePref - Whether to save this as the user's preference for the current theme.
     */
    function applyFont(fontName, savePref = true) {
        try {
            // Basic validation: ensure fontName is a non-empty string
            if (!fontName || typeof fontName !== 'string' || fontName.trim() === '') {
                console.warn(`applyFont: Invalid fontName provided: "${fontName}". Using system default.`);
                fontName = systemDefaultFont; // Fallback
                savePref = false; // Don't save an invalid/fallback choice as preference
            }

            console.log(`Applying font: ${fontName}`);
            document.body.style.setProperty('--body-font', fontName);

            // Update dropdown selection visually if it exists
            const fontOption = fontSelector.querySelector(`option[value="${CSS.escape(fontName)}"]`);
             if(fontOption) {
                  fontSelector.value = fontName;
             } else {
                  console.warn(`Font "${fontName}" applied but not found in dropdown.`);
                  // Potentially select system default in dropdown as visual fallback
                  fontSelector.value = systemDefaultFont;
             }


            // Save preference for the *current* theme if requested
            const currentTheme = document.body.dataset.theme || 'light';
            if (savePref && currentTheme !== 'dannyvalz') { // Don't save preference for secret theme
                const themePrefs = getThemeFontPrefs();
                themePrefs[currentTheme] = fontName;
                localStorage.setItem(LOCAL_STORAGE_THEME_FONTS_KEY, JSON.stringify(themePrefs));
                console.log(`Saved font preference for theme '${currentTheme}': ${fontName}`);
            }
        } catch (e) {
            console.error(`Error applying font ${fontName}:`, e);
        }
    }

    // --- Handler for manual font selection ---
    function handleFontSelectionChange(event) {
        applyFont(event.target.value, true); // Apply and save preference for current theme
    }

    // --- Helper to get saved font preferences ---
    // (Keep this function as defined previously to manage theme-specific fonts)
    function getThemeFontPrefs() {
        const savedPrefs = localStorage.getItem(LOCAL_STORAGE_THEME_FONTS_KEY);
        try {
            const prefs = savedPrefs ? JSON.parse(savedPrefs) : {};
            // console.log("getThemeFontPrefs: Loaded prefs:", prefs); // Optional log
            return prefs;
        } catch (e) {
            console.error("Error parsing theme font preferences:", e);
            return {};
        }
    }

    function applyStoreLinksToggle(isEnabled) { 
        console.log("Setting Store Links visibility preference:", isEnabled);
         // 1. Add/Remove class on body for instant visual feedback
        document.body.classList.toggle('store-links-hidden', !isEnabled); // Add class if NOT enabled

        // 2. Save preference to localStorage
        localStorage.setItem(LOCAL_STORAGE_STORE_LINKS_KEY, isEnabled ? 'true' : 'false'); // Save preference
    }

    function applyLogoSize(size, savePreference = false) {
        const validSize = Math.max(16, Math.min(64, parseInt(size) || 16));
        console.log(`Applying platform logo size: ${validSize}px`);
        document.documentElement.style.setProperty('--platform-logo-size', `${validSize}px`);
        if (platformLogoSizeInput.value != validSize) {
             platformLogoSizeInput.value = validSize;
        }
        if (savePreference) {
            localStorage.setItem(LOCAL_STORAGE_LOGO_SIZE_KEY, validSize);
            console.log(`Saved logo size preference: ${validSize}`);
        }
    }

    function applyPlatformTextVisibility(isVisible) {
        console.log(`Setting platform text visibility: ${isVisible}`);
        document.body.classList.toggle('platform-text-hidden', !isVisible); // Add class if NOT visible
        localStorage.setItem(LOCAL_STORAGE_PLATFORM_TEXT_KEY, isVisible ? 'true' : 'false');
    }
    
    async function loadLocalFonts() {
        console.log("Loading local fonts from fonts.json...");
        // --- Step 0: Store current selection ---
        const previouslySelectedFontValue = fontSelector.value;
        console.log("Storing previously selected font value:", previouslySelectedFontValue);
        // --- End Step 0 ---

        try {
            console.log("Fetching fonts/fonts.json...");
            const response = await fetch('fonts/fonts.json');
            if (!response.ok) { throw new Error(`Fetch failed: ${response.status}`); }
            const localFonts = await response.json();
            if (!Array.isArray(localFonts)) { throw new Error("Invalid array format."); }
            console.log("Found local fonts data:", localFonts);
		
			// --- Create Style Tag for Dynamic Fonts ---
			let dynamicFontStyleSheet = document.getElementById(DYNAMIC_FONT_STYLE_ID);
			if (!dynamicFontStyleSheet) {
			dynamicFontStyleSheet = document.createElement('style');
			dynamicFontStyleSheet.id = DYNAMIC_FONT_STYLE_ID;
			document.head.appendChild(dynamicFontStyleSheet);
			console.log("Created style tag for dynamic fonts.");
			}

            // --- Step 1: Clear previous dynamic font options and styles ---
            const existingOptions = fontSelector.querySelectorAll('option[data-dynamic-font]');
            console.log(`Clearing ${existingOptions.length} existing dynamic options.`);
            existingOptions.forEach(option => option.remove());
            dynamicFontStyleSheet.innerHTML = ''; // Clear rules

            // --- Step 2: Generate @font-face rules and add options ---
            let fontFaceRules = "";
			let optionsAddedCount = 0;
            localFonts.forEach(font => {
                if (font.name && font.filename && font.cssValue) {
                    // Generate @font-face rule
                    // Assuming filename includes extension (.woff, .ttf, .otf)
                    // Determining format based on extension
                    let format = 'woff'; // Default
                    if (font.filename.endsWith('.woff2')) format = 'woff2';
                    else if (font.filename.endsWith('.ttf')) format = 'truetype';
                    else if (font.filename.endsWith('.otf')) format = 'opentype';
					
					// --- Check for and add ascent-override ---
                    let ascentOverrideRule = '';
                    if (font.ascentOverride && typeof font.ascentOverride === 'string' && font.ascentOverride.trim() !== '') {
                        // Basic validation: check if it looks like a percentage or number
                        if (font.ascentOverride.includes('%') || !isNaN(parseFloat(font.ascentOverride))) {
                             ascentOverrideRule = `\n    ascent-override: ${font.ascentOverride.trim()};`;
                             console.log(`Adding ascent-override: ${font.ascentOverride.trim()} for ${font.name}`);
                        } else {
                             console.warn(`Invalid ascentOverride format for ${font.name}: "${font.ascentOverride}". Skipping.`);
                        }
                    }
                    // --- End ascent-override check ---
					
					const rule = `
                    
@font-face {
    font-family: '${font.name}';
    src: url('/fonts/${font.filename}') format('${format}');${ascentOverrideRule} /* Add ascent override if defined */
    /* Add font-weight/style here if needed */
}
`;
					fontFaceRules += rule;
					console.log(`Generated rule for ${font.name}`);

                    // Add option to dropdown
                    const option = document.createElement('option');
                    option.value = font.cssValue; // e.g., "'pxSans', sans-serif"
                    option.textContent = font.name; // e.g., "pxSans"
                    option.dataset.dynamicFont = 'true'; // Mark as dynamic
                    // Insert before the first non-dynamic option (like Google Fonts)
                    const firstGoogleFont = fontSelector.querySelector("option:not([data-dynamic-font])");
                    if(firstGoogleFont){
                        fontSelector.insertBefore(option, firstGoogleFont);
                    } else {
                        fontSelector.appendChild(option); // Append if no static fonts left
                    }
					optionsAddedCount++;

                } else {
                    console.warn("Skipping invalid font entry in fonts.json:", font);
                }
            });

            // --- Step 3: Add all @font-face rules ---
            dynamicFontStyleSheet.innerHTML = fontFaceRules;
            console.log("Added @font-face rules and dropdown options.");
			
			// --- Step 4: Restore Dropdown Selection ---
            // Check if the previously selected value is still a valid option
            const validOptionsNow = Array.from(fontSelector.options).map(opt => opt.value);
            if (validOptionsNow.includes(previouslySelectedFontValue)) {
                console.log("Restoring previous font selection in dropdown:", previouslySelectedFontValue);
                fontSelector.value = previouslySelectedFontValue;
                 // Re-apply the font style itself to be absolutely sure, without saving pref again
                 applyFont(previouslySelectedFontValue, false);
            } else {
                 // If previous selection is gone (e.g., font removed from JSON), select the current computed font or default
                 console.warn(`Previously selected font "${previouslySelectedFontValue}" no longer exists. Selecting current computed font.`);
                 const currentComputedFont = getComputedStyle(document.body).getPropertyValue('--body-font').trim();
                 if (validOptionsNow.includes(currentComputedFont)) {
                     fontSelector.value = currentComputedFont;
                 } else {
                     fontSelector.value = systemDefaultFont; // Ultimate fallback
                 }
                 // Apply the font style that the dropdown now shows
                 applyFont(fontSelector.value, false);
            }
            // --- End Step 4 ---
			
        } catch (error) {
            console.error("Error loading or processing local fonts:", error);
            dynamicFontStyleSheet.innerHTML = '/* Error loading font definitions */'; // Clear on error
             // Optionally inform user: alert("Could not load local fonts from fonts.json.");
        }
		finally { console.log("--- loadLocalFonts END ---"); }
    }
	// --- END Load Local Fonts ---
	
	function applyRatingStyle(style, savePreference = true) {
        console.log(`Applying rating style: ${style}`);
        if (savePreference) {
            localStorage.setItem(LOCAL_STORAGE_RATING_STYLE_KEY, style);
            console.log(`Saved rating style preference: ${style}`);
        }
        // If game details are currently displayed, re-render the rating UI
        if (currentGameRating.gameId !== null) {
             const ratingContainer = resultsDiv.querySelector('#game-rating-container');
             if(ratingContainer) {
                 renderRatingUI(ratingContainer, style, currentGameRating.value);
             }
        }
    }
	
      
      
function loadSettings() {
        try { // Wrap entire function for safety
			console.log("--- loadSettings START ---");

            // --- 1. Load and Validate THEME ---
            const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
            const defaultTheme = 'light'; // Your chosen default theme
            let themeToApply = savedTheme || defaultTheme;

            // Validate theme against available radio buttons (allow 'dannyvalz')
            const validThemes = Array.from(themeRadioGroup.querySelectorAll('input[name="theme"]')).map(radio => radio.value);
            if (!validThemes.includes(themeToApply) && themeToApply !== 'dannyvalz') {
                console.warn(`Saved theme "${themeToApply}" is invalid or not found. Resetting to default "${defaultTheme}".`);
                themeToApply = defaultTheme;
                localStorage.removeItem(LOCAL_STORAGE_THEME_KEY); // Remove invalid value
            }

            // --- 2. Apply Theme (This will also handle applying the correct font) ---
            // applyTheme now checks themeFontMap, user prefs for the theme, or defaults
            applyTheme(themeToApply);
            // Note: applyTheme also handles showing/hiding the custom color editor

            // --- 3. Update Theme Radio Button Selection ---
            // Set the radio button visually AFTER applyTheme has run
            if (themeToApply !== 'dannyvalz') {
                const currentThemeRadio = themeRadioGroup.querySelector(`input[name="theme"][value="${themeToApply}"]`);
                if (currentThemeRadio) {
                    currentThemeRadio.checked = true;
                } else {
                     // Fallback if saved theme radio is missing
                     console.error(`Could not find theme radio for value: ${themeToApply}. Checking default.`);
                     const defaultThemeRadio = themeRadioGroup.querySelector(`input[name="theme"][value="${defaultTheme}"]`);
                     if (defaultThemeRadio) defaultThemeRadio.checked = true;
                }
            } else {
                // If secret theme active, visually check the default radio for user orientation
                 const lightRadio = themeRadioGroup.querySelector('input[name="theme"][value="light"]'); // Or your defaultTheme
                 if(lightRadio) lightRadio.checked = true;
                 console.log("Loaded hidden theme 'dannyvalz'. Defaulting visible radio selection.");
            }


            // --- 4. Update Font Selector Dropdown ---
            // Get the font that was ACTUALLY applied by applyTheme (reading computed style)
            const finalAppliedFont = getComputedStyle(document.body).getPropertyValue('--body-font').trim();
            if (finalAppliedFont) {
                 // Check if this font exists as an option value
                 const fontOption = fontSelector.querySelector(`option[value="${CSS.escape(finalAppliedFont)}"]`);
                 if (fontOption) {
                    fontSelector.value = finalAppliedFont; // Set dropdown to match applied font
                    console.log(`loadSettings: Set font selector to currently applied font: ${finalAppliedFont}`);
                 } else {
                     // If the applied font isn't in the list (e.g., loaded font failed, fallback applied), select system default visually
                     console.warn(`loadSettings: Applied font "${finalAppliedFont}" not found in selector. Selecting System Default visually.`);
                     fontSelector.value = systemDefaultFont; // Use the system default value
                 }
            } else {
                // Fallback if somehow --body-font wasn't set
                fontSelector.value = systemDefaultFont;
            }


            // --- 5. Load Store Links Toggle State ---
            const savedStoreLinksEnabled = localStorage.getItem(LOCAL_STORAGE_STORE_LINKS_KEY);
            const storeLinksAreEnabled = savedStoreLinksEnabled === null ? true : (savedStoreLinksEnabled === 'true');
			applyStoreLinksToggle(storeLinksAreEnabled); // Apply class
            const valueToSelectStore = storeLinksAreEnabled ? 'on' : 'off';
            const currentStoreRadio = storeLinksToggleGroup.querySelector(`input[name="storeLinksToggle"][value="${valueToSelectStore}"]`);
            if (currentStoreRadio) currentStoreRadio.checked = true; else { /* ... fallback check ... */ }

            // --- 6. Load Platform Display Settings: Logo Size ---
            const savedLogoSize = localStorage.getItem(LOCAL_STORAGE_LOGO_SIZE_KEY);
            const initialLogoSize = parseInt(savedLogoSize) || 16;
            applyLogoSize(initialLogoSize, false); // Apply style

            // --- 7. Load Platform Display Settings: Text Visibility ---
            const savedTextVisible = localStorage.getItem(LOCAL_STORAGE_PLATFORM_TEXT_KEY);
            const textIsVisible = savedTextVisible === null ? true : (savedTextVisible === 'true');
            applyPlatformTextVisibility(textIsVisible); // Apply class
            const textValueToSelect = textIsVisible ? 'show' : 'hide';
            const currentTextRadio = platformTextToggleGroup.querySelector(`input[name="platformTextToggle"][value="${textValueToSelect}"]`);
            if (currentTextRadio) currentTextRadio.checked = true; else { /* ... fallback check ... */ }

            // --- 8. Load Rating Display Style ---
            const savedRatingStyle = localStorage.getItem(LOCAL_STORAGE_RATING_STYLE_KEY);
            const defaultRatingStyle = 'off';
            let ratingStyleToApply = savedRatingStyle || defaultRatingStyle;
            const validRatingStyles = Array.from(ratingStyleGroup.querySelectorAll('input[name="ratingStyle"]')).map(radio => radio.value);
             if (!validRatingStyles.includes(ratingStyleToApply)) { /* ... handle invalid ... */ }
            applyRatingStyle(ratingStyleToApply, false); // Apply style setting
            const currentRatingRadio = ratingStyleGroup.querySelector(`input[name="ratingStyle"][value="${ratingStyleToApply}"]`);
            if (currentRatingRadio) currentRatingRadio.checked = true; else { /* ... fallback ... */ }


            // --- Final Log ---
            console.log(`Loaded settings: Theme='${themeToApply}', Font='${finalAppliedFont || 'Default'}', StoreLinks='${storeLinksAreEnabled}', LogoSize='${initialLogoSize}', PlatformText='${textIsVisible}', RatingStyle='${ratingStyleToApply}'`);

        } catch (e) {
            console.error("Critical error during loadSettings:", e);
             alert("Error loading settings. Defaults may be applied.");
             try { applyTheme('light'); } catch {} // Attempt basic fallback
        } finally {
             console.log("--- loadSettings END ---");
        }
    } // End loadSettings

    

	// --- Import/Export Functions ---

    function formatColorsForExport() {
        let outputText = "# GameGet Custom Theme Export\n";
        outputText += `# Theme saved: ${new Date().toISOString()}\n`;
        outputText += `# Note: Font preference is included if set for the 'custom' theme.\n\n`;

        // Export Colors
        customColorInputs.forEach(picker => {
            const varName = picker.dataset.varname;
            const value = picker.value; // Read current value from input
            if (varName) {
                outputText += `${varName} = ${value}\n`;
            }
        });

        // Font Export
        // Get the font specifically saved for the 'custom' theme
        const themePrefs = getThemeFontPrefs();
        const customThemeFont = themePrefs['custom']; // Get font saved for 'custom'

        if (customThemeFont) {
             console.log("Exporting custom theme font:", customThemeFont);
             outputText += `\n# Font Preference for Custom Theme\n`;
             outputText += `--body-font = ${customThemeFont}\n`; // Add the font variable line
        } else {
             console.log("No specific font preference saved for 'custom' theme to export.");
        }
        

        return outputText;
    }

    function exportCustomColors() {
        console.log("Exporting custom colors...");
        const formattedText = formatColorsForExport();
        const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'gameget-custom-theme.txt'; // Filename for download
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link); // Clean up
        URL.revokeObjectURL(url); // Release object URL
        console.log("Export triggered.");
    }

	function importCustomColors(event) {
        console.log("Import file selected...");
        const file = event.target.files[0];
        if (!file) { console.log("No file selected."); return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            console.log("--- Import File Read ---");
            try {
                // Step 1: Parse (gets { colors: {}, font: null|string })
                console.log("Parsing imported data...");
                const parsedData = parseImportedColors(content);
                console.log("Parsed data:", parsedData);

                if (Object.keys(parsedData.colors).length === 0 && !parsedData.font) {
                    throw new Error("No valid color or font variables found.");
                }

                // Step 2: Apply Colors
                if (Object.keys(parsedData.colors).length > 0) {
                    console.log("Applying parsed colors...");
                    Object.entries(parsedData.colors).forEach(([varName, value]) => {
                        updateCustomColor(varName, value);
                        syncColorInputs(varName, value);
                    });
                    console.log("Finished applying/syncing colors.");
                } else { console.log("No colors found in import file."); }

                // Step 3: Apply Font (if parsed and VALID)
                let fontApplied = false;
                if (parsedData.font) {
                     console.log(`Attempting to apply imported font: ${parsedData.font}`);
                     // Validate against current dropdown options
                     const validFonts = Array.from(fontSelector.options).map(option => option.value);
                     if (validFonts.includes(parsedData.font)) {
                         // Apply font AND SAVE it as the preference for the 'custom' theme
                         applyFont(parsedData.font, true); // savePref = true
                         fontApplied = true;
                         console.log("Successfully applied and saved imported font for custom theme.");
                     } else {
                          console.warn(`Imported font "${parsedData.font}" not found in available options. Font not changed.`);
                          alert(`Import Warning: Font "${parsedData.font}" not found. Colors applied, but font unchanged.`);
                     }
                } else {
                     console.log("No font preference found in import file.");
                     // Optional: Decide if you want to apply a default font here if none is imported
                     // e.g., applyFont(systemDefaultFont, true);
                }

                // Step 4: Activate Custom Theme
                console.log("Setting theme to 'custom' and ensuring editor is visible...");
                // We call applyTheme *after* potentially applying the font,
                // so applyTheme doesn't override the imported font for the custom theme.
                // However, applyTheme needs to run to set the data-attribute and show the editor.
                // We can temporarily prevent applyTheme from applying a font itself.
                const currentFontBeforeApplyTheme = getComputedStyle(document.body).getPropertyValue('--body-font').trim(); // Store font before applyTheme

                document.body.dataset.theme = 'custom';
                localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'custom');
                if (customColorEditor) customColorEditor.style.display = 'block';
                else console.error("Custom color editor element not found!");

                // If applyTheme changed the font back, reapply the intended one.
                 if(fontApplied){
                     const fontAfterApplyTheme = getComputedStyle(document.body).getPropertyValue('--body-font').trim();
                     if(fontAfterApplyTheme !== parsedData.font){
                        console.log("Re-applying imported font after applyTheme.");
                        applyFont(parsedData.font, true); // Ensure imported font persists
                     }
                 }


                // Step 5: Save the applied CUSTOM COLORS to storage
                console.log("Saving the applied custom colors...");
                saveCustomColors(); // Reads from input elements

                // Step 6: Check the 'custom' radio button
                console.log("Setting 'custom' theme radio button checked state...");
                const customRadio = themeRadioGroup.querySelector('input[name="theme"][value="custom"]');
                if (customRadio) customRadio.checked = true;
                else console.error("Cannot find custom theme radio button.");

                alert("Custom theme imported successfully!");
                console.log("--- Import Process Complete ---");

            } catch (error) {
                console.error("Error processing imported file:", error);
                alert(`Import failed: ${error.message}`);
            } finally {
                 // Reset file input value so the same file can be loaded again if needed
                 console.log("Resetting file input value.");
                 event.target.value = null;
            }
        };

        reader.onerror = (e) => {
             console.error("Error reading file:", e);
             alert("Error reading the selected file.");
             event.target.value = null; // Reset input
        };

        console.log("Reading file as text...");
        reader.readAsText(file); // Read the file as text
    } // End importCustomColors
	
    function parseImportedColors(textContent) {
        const result = {
             colors: {}, // Object to hold color variables
             font: null    // To hold the font value, null if not found
        };
        const lines = textContent.split('\n');
        const hexRegex = /^#[0-9A-F]{6}$/i; // Regex for #RRGGBB format

        console.log("Parsing imported file content...");
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('#') || line === '') return; // Ignore comments/blanks

            const parts = line.split('=');
            if (parts.length >= 2) { // Use >= 2 for robustness
                const varName = parts[0].trim();
                const value = parts.slice(1).join('=').trim(); // Join potential value parts

                // Check if it's a color variable
                if (varName.startsWith('--') && varName !== '--body-font' && hexRegex.test(value.toLowerCase())) {
                    if (customColorEditor.querySelector(`[data-varname="${varName}"]`)) {
                         result.colors[varName] = value.toLowerCase();
                         // console.log(` -> Parsed color: ${varName} = ${result.colors[varName]}`);
                    } else { console.warn(`Ignoring unknown color variable: ${varName}`); }
                }
                // Check if it's the font variable
                else if (varName === '--body-font') {
                     if (typeof value === 'string' && value.length > 0) {
                         result.font = value; // Store font value (keep original casing from file)
                         console.log(` -> Parsed font: ${varName} = ${result.font}`);
                     } else { console.warn(`Ignoring invalid font value: "${value}"`);}
                }
                 else {
                    console.warn(`Ignoring invalid/unrecognized line: "${line}"`);
                }
            }
        });
        console.log("Finished parsing import file.");
        return result; // Return object with colors and font
    } // End parseImportedColors

    // --- Platform Logo Mapping Helper Function ---
    function getLogoPathForPlatform(platformName) {
        const nameLower = platformName.toLowerCase();
        const basePath = 'images/platforms/';
        // Add more specific cases first
    if (nameLower.includes('windows') || nameLower.includes('mswin')) {
            return basePath + 'windows.png';
		} else if (nameLower.includes('ms-dos') || nameLower.includes('dos')) {
            return basePath + 'dos.png';
		} else if (nameLower.includes('pc-98') || nameLower.includes('nec pc-9800')) {
            return basePath + 'pc98.png';
		} else if (nameLower.includes('fmtowns') || nameLower.includes('fm towns')) {
            return basePath + 'fmtowns.png';
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
		} else if (nameLower.includes('super famicom') || nameLower.includes('sfc')) {
            return basePath + 'snes.png';	
        } else if (nameLower.includes('nintendo entertainment system')) {
            return basePath + 'nes.png';
		} else if (nameLower.includes('family computer disk system') || nameLower.includes('famicom disk system')) {
            return basePath + 'fcds.png'; 
		} else if (nameLower.includes('family computer') || nameLower.includes('famicom')) {
            return basePath + 'famicom.png'; 			
        } else if (nameLower.includes('linux')) {
            return basePath + 'linux.png';
        } else if (nameLower.includes('mac') || nameLower.includes('macos')) {
            return basePath + 'mac.png';
		} else if (nameLower.includes('apple II') || nameLower.includes('apple IIe')) {
            return basePath + 'appleII.png';
		} else if (nameLower.includes('apple IIGS') || nameLower.includes('apple II GS')) {
            return basePath + 'appleIIgs.png';
		} else if (nameLower.includes('apple')) {
            return basePath + 'apple.png';
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
		} else if (nameLower.includes('amiga cd32')) { 
            return basePath + 'cd32.png';
		} else if (nameLower.includes('amiga') || nameLower.includes('Commodore Amiga')) { // General fallback for amiga
            return basePath + 'amiga.png';
		} else if (nameLower.includes('sega dreamcast') || nameLower.includes('dreamcast')) { 
            return basePath + 'dreamcast.png';
		} else if (nameLower.includes('master system') || nameLower.includes('sega master system')) { 
            return basePath + 'mastersystem.png';
		} else if (nameLower.includes('mega drive/genesis') || nameLower.includes('genesis')) { 
            return basePath + 'megadrive.png';	
		} else if (nameLower.includes('game gear') || nameLower.includes('sega game gear')) { 
            return basePath + 'gamegear.png';			
		} else if (nameLower.includes('saturn') || nameLower.includes('sega saturn')) { 
            return basePath + 'saturn.png';
		} else if (nameLower.includes('32x') || nameLower.includes('sega 32x')) { 
            return basePath + 'sega32x.png';
		} else if (nameLower.includes('mega cd') || nameLower.includes('sega cd')) { 
            return basePath + 'segacd.png';
        } else if (nameLower.includes('stadia') || nameLower.includes('google stadia')) { 
            return basePath + 'stadia.png';
        } else if (nameLower.includes('gbc') || nameLower.includes('game boy color')) { 
            return basePath + 'gbc.png';
        } else if (nameLower.includes('gba') || nameLower.includes('game boy advance')) { 
            return basePath + 'gba.png';
        } else if (nameLower.includes('game boy') || nameLower.includes('gb')) { 
            return basePath + 'gameboy.png';
        } else if (nameLower.includes('3do') || nameLower.includes('3do interactive multiplayer')) { 
            return basePath + '3do.png';
        } else if (nameLower.includes('arcade')) { 
            return basePath + 'arcade.png';
		} else if (nameLower.includes('commodore vic-20')|| nameLower.includes('vic-20')) { 
            return basePath + 'vic20.png';
		} else if (nameLower.includes('commodore pet')) { 
            return basePath + 'pet.png';
		} else if (nameLower.includes('commodore c64')) { 
            return basePath + 'c64.png';
		} else if (nameLower.includes('commodore 16')) { 
            return basePath + 'c16.png';
		} else if (nameLower.includes('commodore')) {  // General fallback for Commodores
            return basePath + 'commodore.png';
		}	
		// Add more mappings here for other consoles/platforms as needed...

        // Default fallback icon if no specific match is found
        console.warn(`No specific logo for platform: "${platformName}", using default.`);
        return basePath + 'default.png';
    }

	// --- Rating UI Rendering and Handling ---

    /**
     * Renders the appropriate rating input/display based on style and value.
     * @param {HTMLElement} container - The div to render into.
     * @param {string} style - 'stars', 'percent', 'score', or 'off'.
     * @param {number | null} currentValue - The current rating value (e.g., 3 for stars, 75 for percent/score).
     */
    function renderRatingUI(container, style, currentValue) {
        container.innerHTML = ''; // Clear previous content
		

        if (style === 'off') {
            console.log("Rating display is off.");
            container.classList.add('rating-off');
			//container.style.display = 'none'; // Hide the container
            return;
        } else {
             container.style.display = 'flex'; // Ensure container is visible
        }

        switch (style) {
            case 'stars':
                const starContainer = document.createElement('div');
                starContainer.classList.add('rating-stars');
                for (let i = 1; i <= 5; i++) {
                    const star = document.createElement('span');
                    star.textContent = '★'; // Unicode star
                    star.dataset.value = i;
                    if (currentValue && i <= currentValue) {
                        star.classList.add('filled');
                    }

                    star.addEventListener('mouseover', (e) => {
                        const hoverValue = parseInt(e.target.dataset.value);
                        const stars = starContainer.querySelectorAll('span');
                        stars.forEach((s, index) => {
                             s.classList.toggle('hover', index < hoverValue);
                        });
                    });
                    starContainer.addEventListener('mouseout', () => {
                         starContainer.querySelectorAll('span').forEach(s => s.classList.remove('hover'));
                    });

                    star.addEventListener('click', (e) => {
                        const clickedValue = parseInt(e.target.dataset.value);
                        // If clicking the same star again, clear rating (optional)
                        if (clickedValue === currentGameRating.value) {
                            currentGameRating.value = null;
                        } else {
                             currentGameRating.value = clickedValue;
                        }
                        console.log("Star rating set to:", currentGameRating.value);
                        renderRatingUI(container, style, currentGameRating.value); // Re-render to show change
                    });
                    starContainer.appendChild(star);
                }
                container.appendChild(starContainer);
                break;

            case 'percent':
            case 'score':
                const inputContainer = document.createElement('div');
                inputContainer.classList.add('rating-input-container');
                const numInput = document.createElement('input');
                numInput.type = 'number';
                const maxValue = (style === 'score' ? 9999 : 100); 
                numInput.min = 0;
                numInput.max = maxValue;
                numInput.value = (currentValue !== null && currentValue >= 0 && currentValue <= maxValue) ? currentValue : '';
                numInput.classList.add('rating-input');
                 // --- ADD Specific Class ---
                if (style === 'score') {
                    numInput.classList.add('rating-input-score');
                    numInput.placeholder = `0`;
                } else { // percent
                    numInput.classList.add('rating-input-percent');
                    numInput.placeholder = `0`;
                }
                // --- END ADD ---


                numInput.addEventListener('input', (e) => {
                    let val = parseInt(e.target.value);
                     if (isNaN(val) || val < 0) val = null;
                     else if (val > maxValue) val = maxValue; // Use maxValue

                     e.target.value = (val === null) ? '' : val;
                     currentGameRating.value = val;
                     console.log(`${style} rating set to:`, currentGameRating.value);
                });
                numInput.addEventListener('change', (e) => { // Final validation
                    let val = parseInt(e.target.value);
                     if (isNaN(val) || val < 0) val = null;
                     else if (val > maxValue) val = maxValue; // Use maxValue
                    e.target.value = (val === null) ? '' : val;
                    currentGameRating.value = val;
                });


                 inputContainer.appendChild(numInput);

                if (style === 'percent') {
                    const percentSign = document.createElement('span');
                    percentSign.textContent = '%';
                    percentSign.classList.add('percent-sign');
                    inputContainer.appendChild(percentSign);
                } else if (style === 'score') {
                    // --- ADD "Score" Label ---
                    const scoreLabel = document.createElement('span');
                    scoreLabel.textContent = 'Score';
                    scoreLabel.classList.add('score-label');
                    inputContainer.appendChild(scoreLabel);
                    // --- END ADD ---
                }
                container.appendChild(inputContainer);
                break;
        }
    }

	 // Collection Functions
	 
	 /**
     * Populates a select dropdown with unique options from the collection data.
     * @param {HTMLSelectElement} selectElement - The dropdown element.
     * @param {Array<object>} collectionData - The array of metadata objects.
     * @param {string} metadataKey - The key in the metadata object to extract values from (e.g., 'developer', 'platforms').
     * @param {string} defaultOptionText - Text for the initial default option (e.g., "Filter by Developer...").
     */
    function populateFilterDropdown(selectElement, collectionData, metadataKey, defaultOptionText) {
        if (!selectElement) return;

        const currentValue = selectElement.value; // Preserve current selection if possible
        selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`; // Reset options

        const uniqueValues = new Set();

        collectionData.forEach(cardMeta => {
            const value = cardMeta[metadataKey];
            if (Array.isArray(value)) { // Handle arrays like platforms/genres
                value.forEach(item => { if (item) uniqueValues.add(item.trim()); });
            } else if (value && typeof value === 'string') {
                uniqueValues.add(value.trim());
            }
        });

        // Sort alphabetically and add options
        [...uniqueValues].sort((a, b) => a.localeCompare(b)).forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            selectElement.appendChild(option);
        });

        // Restore previous selection if it still exists
        if (selectElement.querySelector(`option[value="${CSS.escape(currentValue)}"]`)) {
             selectElement.value = currentValue;
        }
    } // End populateFilterDropdown
	
	 // Reads collection data from backend API
     async function loadCollection() {
         console.log("Loading collection from backend API...");
         collectionStatus.textContent = 'Status: Loading collection...';
         collectionGrid.innerHTML = '<p class="info-message loading">Loading collection...</p>';
         refreshCollectionButton.disabled = true; // Disable button while loading

         try {
            const response = await fetch(`${API_BASE_URL}/api/getCollection`);
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: `Server returned status ${response.status}` }));
                 throw new Error(errorData.error || `Failed to load collection: ${response.status}`);
            }

            const collectionData = await response.json(); // Expecting array of metadata objects

            if (!Array.isArray(collectionData)) {
                 throw new Error("Received invalid data format from server.");
            }

            gameCardCollection = collectionData; // Update global collection
            console.log(`Collection loaded: ${gameCardCollection.length} cards found.`);
            collectionStatus.textContent = `Status: Loaded ${gameCardCollection.length} cards.`;

			// Populate Filter Dropdowns
            console.log("Populating filter dropdowns...");
            populateFilterDropdown(collectionFilterDeveloper, gameCardCollection, 'developer', 'Developed by...');
            populateFilterDropdown(collectionFilterPlatform, gameCardCollection, 'platforms', 'Released on...');
            console.log("Filter dropdowns populated.");
            

            // Render the grid with the loaded data (triggers sort/filter)
            renderCollectionGrid(gameCardCollection);

         } catch (error) {
             console.error('Error loading collection:', error);
             collectionStatus.textContent = 'Status: Error loading collection.';
             collectionGrid.innerHTML = `<p class="error-message">Error loading collection: ${error.message}</p>`;
             alert(`Error loading collection: ${error.message}`);
             gameCardCollection = []; // Reset collection on error
             renderCollectionGrid([]); // Render empty grid
         } finally {
             refreshCollectionButton.disabled = false; // Re-enable refresh button
         }
     } // End loadCollection


    /**
     * Renders the game cards in the collection grid based on current data, filters, and sort.
     * @param {Array<object>} collectionData - The array of METADATA objects.
     */
    function renderCollectionGrid(collectionData) {
        console.log("Rendering collection grid...");
        collectionGrid.innerHTML = '';

        if (!Array.isArray(collectionData) || collectionData.length === 0) {
            collectionGrid.innerHTML = '<p class="info-message">No game cards found or loaded yet.<br>Save game details and place files in `public/results`, then Refresh.</p>';
            return;
        }

        // --- Apply Filtering ---
        const titleFilter = collectionFilterTitle.value.toLowerCase().trim();
        const developerFilter = collectionFilterDeveloper.value; // Get selected developer
        const platformFilter = collectionFilterPlatform.value;   // Get selected platform

        console.log(`Filtering by: Title='${titleFilter}', Dev='${developerFilter}', Platform='${platformFilter}'`);

        let filteredData = collectionData.filter(cardMeta => {
             // Title Filter (keep existing)
             const titleMatch = !titleFilter || cardMeta.name?.toLowerCase().includes(titleFilter);

             // Developer Filter
             const developerMatch = !developerFilter || cardMeta.developer === developerFilter;

             // Platform Filter (check if selected platform is in the card's array)
             const platformMatch = !platformFilter || (Array.isArray(cardMeta.platforms) && cardMeta.platforms.includes(platformFilter));

             return titleMatch && developerMatch && platformMatch; // Must match all active filters
        });
        // --- End Filtering ---


        // --- Apply Sorting (with Normalization for Rating) ---
        const sortValue = collectionSortSelect.value;
        console.log(`Sorting by: ${sortValue}`);
        let sortedData = [...filteredData]; // Work on a copy

        // Helper function to get a comparable numeric rating value (0-100 scale for stars/percent)
        const getComparableRating = (meta) => {
            if (meta.userRatingValue === null || meta.userRatingValue === undefined) {
                return null; // Unrated items
            }
            const style = meta.userRatingStyle || 'score'; // Default to 'score' if style missing
            const value = Number(meta.userRatingValue);

            if (isNaN(value)) return null; // Invalid number

            switch (style) {
                case 'stars':
                    // Scale 1-5 stars to 0-100 (approx. 20 points per star)
                    // Clamp value 0-5 first for safety
                    const clampedStarValue = Math.max(0, Math.min(5, value));
                    return clampedStarValue * 20;
                case 'percent':
                     // Value is already 0-100, clamp for safety
                    return Math.max(0, Math.min(100, value));
                case 'score':
                     // Treat score differently - map to a higher range or keep as is?
                     // To sort them separately or alongside?
                     // Option A: Keep score as is (0-99999) - will sort differently
                     // return value;
                     // Option B: Normalize score to 0-100 (loses precision)
                      return Math.max(0, Math.min(100, Math.round(value / 999.99)));
                     // Option C: Map score to a very high number so it always sorts last/first if mixed?
                     // return 100000 + value; // To sort scores after stars/percent
                     // Let's go with Option A for now - keep score value separate
                     return value; // Keep original score value
                default:
                    return null; // Unknown style
            }
        };

        sortedData.sort((aMeta, bMeta) => {
             switch (sortValue) {
                 case 'name-asc': return (aMeta.name || '').localeCompare(bMeta.name || '');
                 case 'name-desc': return (bMeta.name || '').localeCompare(aMeta.name || '');
                 case 'release-asc': return (aMeta.releaseTimestamp || 0) - (bMeta.releaseTimestamp || 0);
                 case 'release-desc': return (bMeta.releaseTimestamp || 0) - (aMeta.releaseTimestamp || 0);
                 case 'rating-asc': { // Sort Low to High
                     const ratingA = getComparableRating(aMeta);
                     const ratingB = getComparableRating(bMeta);
                     const styleA = aMeta.userRatingStyle || 'score';
                     const styleB = bMeta.userRatingStyle || 'score';

                     // Handle nulls (unrated) - sort them last
                     if (ratingA === null && ratingB === null) return 0;
                     if (ratingA === null) return 1; // a is null, put it after b
                     if (ratingB === null) return -1; // b is null, put it after a

                     // If styles differ and one is score, sort score separately (e.g., after others)
                     // This example sorts scores AFTER stars/percent
                     if (styleA === 'score' && styleB !== 'score') return 1; // Sort a (score) after b
                     if (styleA !== 'score' && styleB === 'score') return -1; // Sort b (score) after a

                     // If styles are the same (or both not score), compare normalized/original values
                     return ratingA - ratingB;
                 }
                 case 'rating-desc': { // Sort High to Low
                     const ratingA = getComparableRating(aMeta);
                     const ratingB = getComparableRating(bMeta);
                     const styleA = aMeta.userRatingStyle || 'score';
                     const styleB = bMeta.userRatingStyle || 'score';

                     // Handle nulls (unrated) - sort them last
                     if (ratingA === null && ratingB === null) return 0;
                     if (ratingA === null) return 1; // a is null, put it after b
                     if (ratingB === null) return -1; // b is null, put it after a

                     // Sort scores AFTER stars/percent
                     if (styleA === 'score' && styleB !== 'score') return 1;
                     if (styleA !== 'score' && styleB === 'score') return -1;

                     // Compare values (descending)
                     return ratingB - ratingA;
                 }
				 // Developer Sort
                 case 'developer-asc': return (aMeta.developer || '').localeCompare(bMeta.developer || '');
                 // Add user number sorting later
                 default: return 0;
             }
        });


        // --- Render Cards ---
         if (sortedData.length === 0) {
              collectionGrid.innerHTML = '<p class="info-message">No game cards match the current filter.</p>';
              return;
         }

        sortedData.forEach(meta => { // Iterate through sorted & filtered metadata
             const cardElement = document.createElement('div');
             cardElement.classList.add('game-card');
             cardElement.dataset.gameId = meta.id;

             // Use correct relative path for cover (../images/...)
             const coverPath = meta.coverUrl ? meta.coverUrl.replace('t_cover_big', 't_cover_small') : ''; // Get small cover URL
             // Note: saveResultsHtml adjusted paths to ../images already, so use that directly
             // For display *here*, we might need paths relative to index.html? No, let's assume paths in meta are correct for this view.
             // If paths were saved as ../images, we need to remove ../ for display here. Let's adjust saveResultsHtml metadata saving.
             // *** Correction Needed: Save absolute-like paths (/images/...) in metadata ***

             // --- Let's assume metadata.coverUrl is saved as the FULL URL from IGDB ---
             // Use higher quality cover image instead of lower (t_cover_small)
             // const displayCoverUrl = meta.coverUrl ? meta.coverUrl.replace('t_cover_big', 't_cover_small') : '';
			 const displayCoverUrl = meta.coverUrl || ''; // Use the URL directly from metadata

			 // --- Update Card Rendering for Played On Logo ---
             let playedOnHtml = '';
             if (meta.userPlatform) {
                 const logoPath = getLogoPathForPlatform(meta.userPlatform); // Get logo for saved platform
                 playedOnHtml = `
                    <p class="played-on-section">
                        <small>Played on:</small>
                        <img src="${logoPath}" alt="${meta.userPlatform}" title="${meta.userPlatform}" onerror="this.style.display='none'">
                    </p>`;
             }
             // --- End Played On Logo ---
			 
             cardElement.innerHTML = `
                 ${displayCoverUrl ? `<img src="${displayCoverUrl}" alt="${meta.name || ''} Cover" class="cover" loading="lazy" onerror="this.style.display='none'">` : '<div class="cover-placeholder">No Cover</div>'}
                 <h4>${meta.name || 'No Title'}</h4>
                 <p>${meta.developer || 'N/A'}</p>
                 <p>${meta.releaseDate || 'N/A'}</p>
                 ${meta.userRatingValue !== null ? `<p>${getStaticRatingHtml(meta.userRatingStyle || 'score', meta.userRatingValue)}</p>` : ''}
				 ${playedOnHtml}
				 <a href="results/${encodeURIComponent(meta.sourceFile)}" target="_blank" title="Open Saved HTML"><small>🔗️ Open Saved HTML</small></a>
		   `;
             collectionGrid.appendChild(cardElement);
        });
         console.log(`Rendered ${sortedData.length} cards.`);

    } // End renderCollectionGrid


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
		
		currentGameRating = { gameId: null, value: null };
        resultsDiv.innerHTML = '<p class="info-message loading">Searching IGDB...</p>';
		obsButtonContainer.innerHTML = ''; // <-- Clear OBS button container on new search
        searchButton.disabled = true;
		
		currentPlatformsOrder = []; // Clear platform order
        selectedPlatformName = null; // Clear selectio

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

        function displaySearchResultsList(results) { // results is now {id, name, year, type, platforms: [name1,...]}
        resultsDiv.innerHTML = '';
        obsButtonContainer.innerHTML = '';
		currentGameRating = { gameId: null, value: null }; // <<< Reset rating when showing list
		
		currentPlatformsOrder = []; // Clear platform order
        selectedPlatformName = null; // Clear selection
		
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

            // --- Left Container ---
            const leftContainer = document.createElement('div');
            leftContainer.classList.add('result-item-left');

            // Title
            const nameSpan = document.createElement('span');
            nameSpan.textContent = game.name;
            nameSpan.classList.add('game-title');
            leftContainer.appendChild(nameSpan);

            // --- Type Span with Dynamic Class ---
            const typeSpan = document.createElement('span');
            const gameTypeString = game.type || 'Game'; // Get type string
            typeSpan.textContent = gameTypeString;
            typeSpan.classList.add('game-type');
            // Add a specific class based on the type for styling
            // Replace spaces and slashes for valid class names
            const typeClass = `type-${gameTypeString.toLowerCase().replace(/[\s\/]+/g, '-')}`;
            typeSpan.classList.add(typeClass);
            leftContainer.appendChild(typeSpan);
            // --- End Type Span ---

             // --- Platform Logos Container (Using Local Logos) ---
            if (game.platforms && game.platforms.length > 0) {
                const logosContainer = document.createElement('div');
                logosContainer.classList.add('result-platform-logos');
                game.platforms.forEach(platformName => { // Iterate through names
                    const logoPath = getLogoPathForPlatform(platformName); // Get local path
                    const logoImg = document.createElement('img');
                    logoImg.src = logoPath; // Use local path
                    logoImg.alt = platformName; // Use name for alt text
                    logoImg.classList.add('result-list-platform-logo');
                    // Size controlled by CSS variable
                    logoImg.onerror = () => { logoImg.src = 'images/platforms/default.png'; logoImg.onerror = () => { logoImg.remove(); }; }; // Fallback
                    logosContainer.appendChild(logoImg);
                });
                leftContainer.appendChild(logosContainer);
            }
            // --- End Platform Logos ---

            // --- Right Container (Year) ---
            const rightContainer = document.createElement('div');
            rightContainer.classList.add('result-item-right');
            const dateSpan = document.createElement('span');
            dateSpan.textContent = `(${game.year || 'N/A'})`;
            dateSpan.classList.add('game-shortdate');
            rightContainer.appendChild(dateSpan);

            // --- Append Containers ---
            item.appendChild(leftContainer);
            item.appendChild(rightContainer);

            // Add click listener
            item.addEventListener('click', () => { fetchGameDetails(game.id); });

            list.appendChild(item);
        });

        resultsDiv.appendChild(list);
    } // End displaySearchResultsList

    async function fetchGameDetails(gameId) {
        resultsDiv.innerHTML = '<p class="info-message loading">Loading details...</p>';
		obsButtonContainer.innerHTML = ''; // <-- Clear OBS button container while loading details
		currentGameRating = { gameId: null, value: null }; // <<< Reset rating before fetching NEW details
        searchButton.disabled = true;
		
		currentPlatformsOrder = []; // Clear platform order
        selectedPlatformName = null; // Clear selection
		
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

	      
// --- Function to Render Platform List ---
    /**
     * Clears and rebuilds the platform list UI based on the provided order.
     * Attaches click listeners for reordering.
     * @param {HTMLElement} platformListContainer - The UL element.
     * @param {string[]} platformNames - Array of platform name strings in desired order.
     */
    function renderPlatformList(platformListContainer, platformNames) {
        platformListContainer.innerHTML = ''; // Clear existing list items

        console.log("Rendering platforms:", platformNames, "Selected:", selectedPlatformName); // Log state

        if (!platformNames || platformNames.length === 0) return;

        platformNames.forEach((platformName, index) => {
            const li = document.createElement('li');
            li.classList.add('platform-item');
            li.dataset.platformName = platformName;

            // Add selected class using the GLOBAL selectedPlatformName
            if (index === 0 && selectedPlatformName === platformName) { // Reads global var
                li.classList.add('platform-item-selected');
                console.log(`Applying selected class to: ${platformName}`);
            }

            // --- RESTORED Logo and Text Span Creation ---
            // Add logo
            const logoPath = getLogoPathForPlatform(platformName);
            const logoImg = document.createElement('img');
            logoImg.src = logoPath;                        // Set the source
            logoImg.alt = `${platformName} logo`;          // Set alt text
            logoImg.classList.add('platform-logo');        // Add class for styling
            logoImg.onerror = () => {                      // Add error handling
                logoImg.src = 'images/platforms/default.png';
                logoImg.onerror = () => { logoImg.remove(); };
            };
            li.appendChild(logoImg); // Append logo to list item

            // Add text span
            const platformNameSpan = document.createElement('span');
            platformNameSpan.classList.add('platform-name-text'); // Add class for visibility toggle
            platformNameSpan.textContent = platformName;            // Set the text content
            li.appendChild(platformNameSpan); // Append text span to list item
            // --- END RESTORED SECTION ---


            // Add click listener for reordering
            li.addEventListener('click', () => {
                const clickedName = li.dataset.platformName;
                const currentIndex = currentPlatformsOrder.indexOf(clickedName);

                if (currentIndex === 0 && li.classList.contains('platform-item-selected')) {
                    console.log(`Deselecting platform: ${clickedName}`);
                    selectedPlatformName = null;
                    renderPlatformList(platformListContainer, currentPlatformsOrder); // Re-render same order, no highlight
                } else {
                    console.log(`Moving platform to front: ${clickedName}`);
                    currentPlatformsOrder.splice(currentIndex, 1);
                    currentPlatformsOrder.unshift(clickedName);
                    selectedPlatformName = clickedName;
                    renderPlatformList(platformListContainer, currentPlatformsOrder); // Re-render new order, highlight new first
                }
            });

            platformListContainer.appendChild(li); // Append the completed list item
        });
    } // End renderPlatformList

    

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
		obsButtonContainer.innerHTML = ''; // <-- Clear button container again just before adding
		currentGameRating = { gameId: data.id, value: null }; // Set CURRENT game ID and reset rating value
		
		console.log(`Displaying details for Game ID: ${currentGameRating.gameId}. Rating reset.`);
		
		currentPlatformsOrder = [...data.platforms]; // <<< STORE Initial Platform Order
		selectedPlatformName = null; // <<< RESET selection state when new game loads
		
        console.log(`Displaying details for Game ID: ${data.id}. Initial platforms:`, currentPlatformsOrder);
        
		// --- Re-apply platform logo size variable ---
        // Ensures the variable is set before elements using it are created in this scope
        const currentLogoSize = localStorage.getItem(LOCAL_STORAGE_LOGO_SIZE_KEY) || 16;
        document.documentElement.style.setProperty('--platform-logo-size', `${currentLogoSize}px`);
        console.log(`displayGameDetails: Ensuring --platform-logo-size is ${currentLogoSize}px`);
		
        const gameInfoDiv = document.createElement('div');
        gameInfoDiv.classList.add('game-info');

        const imgElement = document.createElement('img'); // Thumbnail
        imgElement.src = data.thumbnailUrl || 'https://via.placeholder.com/120x160?text=No+Art';
        imgElement.alt = `${data.name} Box Art`;
        imgElement.onerror = () => { /* ... error handling ... */ };

        const detailsDiv = document.createElement('div'); // Container for text details
        detailsDiv.classList.add('game-details');

        const nameElement = document.createElement('h2'); // Game Name H2
        nameElement.textContent = data.name;
        detailsDiv.appendChild(nameElement);

		const developerElement = document.createElement('p');
        developerElement.classList.add('game-developer'); // Add class for potential styling
        // Use the developer data received from backend (defaults to 'N/A' if not found)
        developerElement.innerHTML = `<strong>${data.developer || 'Unknown'}</strong>`;
        detailsDiv.appendChild(developerElement);

		const releaseElement = document.createElement('p'); // Release Date
        releaseElement.innerHTML = `<strong>${data.releaseDate || 'N/A'}</strong>`;
        detailsDiv.appendChild(releaseElement);

		// Create Rating Container
        const ratingContainer = document.createElement('div');
        ratingContainer.id = 'game-rating-container';
        detailsDiv.appendChild(ratingContainer); // Appended AFTER release date		
		
		// --- Add Platforms Header (Optional but good for clarity) ---
        //const platformsHeader = document.createElement('p');
        //platformsHeader.innerHTML = '<strong>Platforms:</strong>';
        //detailsDiv.appendChild(platformsHeader);
		
    
		
		// --- Platform List Creation & Initial Render ---
        const platformList = document.createElement('ul'); // Create UL container
        if (data.platforms && data.platforms.length > 0) {
             detailsDiv.appendChild(platformList); // Append UL
             renderPlatformList(platformList, currentPlatformsOrder); // Initial render (no selection)
        } else {             
             console.log("No platforms found for this game.");
             // Create a paragraph to show Platforms: N/A
             const noPlatformsPara = document.createElement('p');
             noPlatformsPara.innerHTML = '<strong>Platforms:</strong> N/A';
             // Append this paragraph instead of the empty UL
             detailsDiv.appendChild(noPlatformsPara);
        }

        // --- Create placeholder for Store Links ---
        const storeLinksContainer = document.createElement('div');
        storeLinksContainer.classList.add('store-links-container');
        detailsDiv.appendChild(storeLinksContainer); // Append AFTER platforms


        // Assemble the main info display FIRST
        gameInfoDiv.appendChild(imgElement);
        gameInfoDiv.appendChild(detailsDiv);
        resultsDiv.appendChild(gameInfoDiv); // Add main info to the page
		
		// --- Create and Add "Save for OBS" Button to its own container ---
        const saveButton = document.createElement('button');
        saveButton.id = 'save-obs-button';
        saveButton.type = 'button';
		
        // ... (create saveIcon, saveText) ...
		const saveIcon = document.createElement('img');
        saveIcon.src = 'images/floppy.png'; // Verify this path is correct relative to index.html
        saveIcon.alt = 'Save Icon';
        // Size is controlled by CSS, but setting here helps layout consistency
        saveIcon.width = 24;
        saveIcon.height = 24;
        saveIcon.onerror = () => { // Handle if button icon fails to load
             console.error("Failed to load OBS save button icon: images/GameGet_Logo.png");
             saveIcon.remove(); // Remove broken image
        };

        const saveText = document.createElement('span');
        saveText.textContent = 'Save HTML for OBS'; // Verify text content
		
         // --- Append BOTH icon and text to the button ---
        saveButton.appendChild(saveIcon);
        saveButton.appendChild(saveText);
        // --- End Append ---
		
		console.log("displayGameDetails: 'data' object before adding listener:", JSON.stringify(data, null, 2));
		
        // Add click listener
        saveButton.addEventListener('click', () => {
            saveResultsHtml(data); // Pass the game name for the filename
        });
        // --- Append button to the DEDICATED container ---
        obsButtonContainer.appendChild(saveButton);
        // --- End Save Button ---
		
		// --- Populate Store Links ---
        let hasAnyStoreLink = false;
        storeLinksContainer.innerHTML = ''; // Clear initially
		
		// --- Render Initial Rating UI ---
        const currentRatingStyle = localStorage.getItem(LOCAL_STORAGE_RATING_STYLE_KEY) || 'off';
        renderRatingUI(ratingContainer, currentRatingStyle, currentGameRating.value); // Render into the correct container
		
		// 1. Add buttons for links found directly on IGDB (Steam/Epic)
        storeLinksContainer.innerHTML = ''; // Clear initially
        if (data.igdbStoreLinks && data.igdbStoreLinks.length > 0) {
             console.log(`Adding ${data.igdbStoreLinks.length} store buttons from IGDB data.`);
             data.igdbStoreLinks.forEach(link => { // link is {name, url}
                 let logoSrc = 'images/default_store.png';
                 if (link.name === 'Steam') logoSrc = 'images/steam_logo.png';
                 else if (link.name === 'Epic Games') logoSrc = 'images/epic_logo.png';
                 else if (link.name === 'GOG') logoSrc = 'images/gog_logo.png';
				 else if (link.name === 'itch.io') logoSrc = 'images/itch_logo.png'; 
                 // Add else if for other stores if needed

                 addStoreButton(storeLinksContainer, link.name, link.url, logoSrc);
             });
        } else {
            console.log("No direct store links (Steam/Epic/GOG) found in IGDB data.");
        }
		
		// --- Apply Platform Text Visibility Class based on current setting --- 
        const textIsVisible = localStorage.getItem(LOCAL_STORAGE_PLATFORM_TEXT_KEY) === null ? true : (localStorage.getItem(LOCAL_STORAGE_PLATFORM_TEXT_KEY) === 'true');
        document.body.classList.toggle('platform-text-hidden', !textIsVisible);
        // --- END ADD ---
		
    } // End displayGameDetails

	/**
     * Generates static HTML representation of the rating.
     * @param {string} style - 'stars', 'percent', 'score'
     * @param {number | null} value - The rating value
     * @returns {string} - HTML string or empty string
     */
    function getStaticRatingHtml(style, value) {
        if (value === null || style === 'off') return '';
        
		let displayValue = '';
        switch (style) {
            case 'stars':
                const filledStars = value || 0; const emptyStars = 5 - filledStars;
                displayValue = `<span class="stars">${'★'.repeat(filledStars)}</span><span class="stars-empty">${'☆'.repeat(emptyStars)}</span>`;
                break;
            case 'percent':
                displayValue = `${value}%`;
                break;
            case 'score':
                // --- ADD "Score" Suffix ---
                displayValue = `${value} Score`;
                // --- END ADD ---
                break;
            default: return '';
        }
        // Keep wrapper span
        return `<span class="static-rating">${displayValue}</span>`;
    }
     
	 /**
     * Helper: Creates and adds a store button/link.
     * @param {HTMLElement} container - The parent element.
     * @param {string} storeName - e.g., "GOG", "Steam", "Epic Games".
     * @param {string} url - The URL to the store page.
     * @param {string} logoSrc - Path to the local store logo image.
     */
     function addStoreButton(container, storeName, url, logoSrc) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        // --- CORRECTED CLASS NAME GENERATION ---
        // 1. Convert to lowercase
        // 2. Replace one or more spaces (\s+) globally (g) with a single hyphen (-)
        // 3. Remove any character that is NOT a letter (a-z), number (0-9), or hyphen (-) globally (g)
        const sanitizedClassNamePart = storeName.toLowerCase()
                                          .replace(/\s+/g, '-')
                                          .replace(/[^a-z0-9-]/g, '');
        // 4. Add '-button' suffix
        const storeClass = `${sanitizedClassNamePart}-button`;
        // Example: "Epic Games" -> "epic-games" -> "epic-games-button"
        // Example: "Steam (Main)" -> "steam-(main)" -> "steam--main" -> "steam-main-button" (approx)
        // Example: "itch.io" -> "itch.io" -> "itchio" -> "itchio-button"
        // --- END CORRECTION ---


        // Add the base class and the generated specific class
        console.log(`addStoreButton: Adding classes 'store-button', '${storeClass}' for store "${storeName}"`);
        try {
             link.classList.add('store-button', storeClass);
        } catch (e) {
             console.error(`Error adding classes for store "${storeName}" (generated class: "${storeClass}"):`, e);
             link.classList.add('store-button'); // Add base class at least
        }


        link.title = `View on ${storeName}`; // Use "View on" for consistency

        // Add logo
        const logo = document.createElement('img');
        logo.src = logoSrc;
        logo.alt = `${storeName} logo`;
        logo.classList.add('store-logo');
        logo.width = 16; logo.height = 16;
        logo.onerror = () => { console.warn(`Failed to load store logo: ${logoSrc}`); logo.remove(); };

        // Add text
        const text = document.createElement('span');
        text.textContent = `View on ${storeName}`; // Use "View on"

        link.appendChild(logo);
        link.appendChild(text);
        container.appendChild(link);
    } // End addStoreButton

          // --- Function to Save HTML for OBS ---
 async function saveResultsHtml(gameData) { // Now accepts full gameData object
		console.log("OBS SAVE: Received gameData:", JSON.stringify(gameData, null, 2));
        const gameName = gameData.name || 'Untitled Game';
        const gameId = gameData.id || Date.now();
        console.log(`OBS SAVE: Starting generation for "${gameName}" (ID: ${gameId})`);

        requestAnimationFrame(async () => { // Use rAF for style computation timing
            try {
                // --- Step 0: Get current UI/Rating state ---
                const ratingStyle = localStorage.getItem(LOCAL_STORAGE_RATING_STYLE_KEY) || 'off';
                // Get rating value for the specific game being saved
                const ratingValue = (currentGameRating.gameId === gameData.id) ? currentGameRating.value : null;
                const shouldShowStores = localStorage.getItem(LOCAL_STORAGE_STORE_LINKS_KEY) === null ? true : (localStorage.getItem(LOCAL_STORAGE_STORE_LINKS_KEY) === 'true');
                const isPlatformTextHidden = document.body.classList.contains('platform-text-hidden');

                // --- Step 1: Clone #results content & modify clone for static output ---
                console.log("OBS SAVE: Cloning #results div and modifying clone...");
                const resultsClone = resultsDiv.cloneNode(true);
                // 1a: Inject Static Rating / Remove Input Container
                const ratingContainerInClone = resultsClone.querySelector('#game-rating-container');
                if (ratingContainerInClone) {
                    const staticRatingHtml = getStaticRatingHtml(ratingStyle, ratingValue);
                    if (staticRatingHtml) { ratingContainerInClone.innerHTML = staticRatingHtml; ratingContainerInClone.removeAttribute("style"); ratingContainerInClone.classList.remove('rating-off'); }
                    else { ratingContainerInClone.remove(); }
                }
                // 1b: Remove Store Links Container if hidden by settings
                const storeContainerInClone = resultsClone.querySelector('.store-links-container');
                if (storeContainerInClone && !shouldShowStores) storeContainerInClone.remove();
                else if(storeContainerInClone) { const loading = storeContainerInClone.querySelector('.store-loading'); if(loading) loading.remove(); }
                // 1c: Adjust local image paths
                const imagesToAdjust = resultsClone.querySelectorAll('img');
                imagesToAdjust.forEach(img => {
                    const currentSrc = img.getAttribute('src');
                    if (currentSrc && !currentSrc.match(/^(https?:)?\/\//) && !currentSrc.startsWith('../')) { img.setAttribute('src', '../' + currentSrc); }
                });
                // 1d: Get final inner HTML of the modified clone
                const resultsContent = resultsClone.innerHTML;


                // --- Step 2: Fetch and clean base CSS ---
                /* ... Keep logic to fetch style.css, remove themes, @font-face, :root ... */
                let baseCss = "/* Base styles error */";
                try {
                    console.log("OBS SAVE: Fetching style.css...");
                    const cssResponse = await fetch('style.css');
                    if (cssResponse.ok) {
                        let cssText = await cssResponse.text();
                        console.log("OBS SAVE: Cleaning style.css...");
                        // Remove Themes
                        const themeBlockRegex = /body\[data-theme=(['"]).*?\1\]\s*\{[\s\S]*?\}/gi;
                        cssText = cssText.replace(themeBlockRegex, '');
                        // Remove @font-face
                        const fontFaceRegex = /@font-face\s*\{[\s\S]*?\}/gi;
                        cssText = cssText.replace(fontFaceRegex, '');
                         // Remove original :root
                         const rootBlockRegex = /:root\s*\{[\s\S]*?\}/i;
                         cssText = cssText.replace(rootBlockRegex, '');
                         baseCss = cssText.trim();
                         console.log("OBS SAVE: CSS cleaned.");
                    } else { throw new Error(`Fetch failed: ${cssResponse.status}`); }
                } catch (error) { console.error("OBS SAVE: Error fetching/cleaning style.css:", error); }


                // --- Step 3: Get Computed Variable Values for styling ---
                /* ... Keep logic to get computed vars into appliedVariablesString ... */
                console.log("OBS SAVE: Getting computed styles from BODY...");
                let appliedVariablesString = "";
                const varNames = [
                     '--bg-color', '--element-bg', '--text-color', '--text-muted',
                     '--border-color', '--border-light', '--primary-color', '--primary-hover',
                     '--accent-color', '--accent-darker', '--error-color', '--body-font',
                     '--platform-logo-size'
                ];
                const computedBodyStyle = getComputedStyle(document.body); // Read from body
				
                // --- Declare activeFontValue here ---
                let activeFontValue = '-apple-system, sans-serif'; // Provide a safe default

                varNames.forEach(varName => {
                     const value = computedBodyStyle.getPropertyValue(varName).trim();
                     if (value) {
                         // Capture the font value when iterating
                         if (varName === '--body-font') {
                             activeFontValue = value; // Assign the computed font value
                         }
                         console.log(` > Computed ${varName} = ${value}`);
                         appliedVariablesString += `    ${varName}: ${value};\n`;
                     } else { console.warn(`Could not get computed value for ${varName}`); }
                });
                // --- activeFontValue is now set correctly ---


                // --- Step 4: Determine required Font Definitions ---
                /* ... Keep logic to generate fontDefinitionsHtml (local @font-face OR google <link>s) ... */
                 let fontDefinitionsHtml = ""; // This will hold the <link> or <style> tags

                console.log(`OBS SAVE: Determining font definition for active font: ${activeFontValue}`);

                // Fetch the font list JSON to check against local fonts
                let localFontsData = [];
                let isLocalFontActive = false;
                try {
                    const fontListResponse = await fetch('fonts/fonts.json');
                    if (fontListResponse.ok) {
                        localFontsData = await fontListResponse.json();
                        if (!Array.isArray(localFontsData)) localFontsData = []; // Ensure it's an array
                    } else { console.warn("OBS SAVE: Could not fetch fonts.json to check local fonts."); }
                } catch (e) { console.error("OBS SAVE: Error fetching fonts.json", e); }

				// Check if the active font matches one defined in fonts.json
                const activeLocalFontInfo = localFontsData.find(font => activeFontValue === font.cssValue);

                if (activeLocalFontInfo) {
                    // --- It's a local font ---
                    /* ... Generate localFontDefinition @font-face style block ... */
                     const localFontFamily = activeLocalFontInfo.name;
                     const localFontFilename = activeLocalFontInfo.filename;
                     let format = 'woff'; if (localFontFilename.endsWith('.woff2')) format = 'woff2'; else if (localFontFilename.endsWith('.ttf')) format = 'truetype'; else if (localFontFilename.endsWith('.otf')) format = 'opentype';
                     fontDefinitionsHtml = `<style id="local-font-face">@font-face { font-family: '${localFontFamily}'; src: url('../fonts/${localFontFilename}') format('${format}'); }</style>`;
                    console.log(`OBS SAVE: Including @font-face for local font: ${localFontFamily}`);
                }
                // Check for Google Fonts
                else if (!activeFontValue.includes('-apple-system')) {
                    /* ... Find and assemble Google Font <link> tags into fontDefinitionsHtml ... */
                    const googlePreconnect1 = document.querySelector("link[rel='preconnect'][href='https://fonts.googleapis.com']");
                    const googlePreconnect2 = document.querySelector("link[rel='preconnect'][href='https://fonts.gstatic.com']");
                    const googleCssLink = document.querySelector("link[rel='stylesheet'][href^='https://fonts.googleapis.com/css2']");
                    let linksToAdd = [];
                    if (googlePreconnect1) linksToAdd.push(googlePreconnect1.outerHTML);
                    if (googlePreconnect2) linksToAdd.push(googlePreconnect2.outerHTML);
                    if (googleCssLink) linksToAdd.push(googleCssLink.outerHTML);
                    if (linksToAdd.length > 0) { fontDefinitionsHtml = linksToAdd.join('\n    '); console.log("OBS SAVE: Including Google Font Tags."); } 
					else {
                        console.log("OBS SAVE: Non-local/non-system font detected but required Google <link> tags not found.");
                        fontDefinitionsHtml = '<!-- Google Font link tags not found -->';
                    }
                } else {
                    // --- It's the System Default font ---
                    console.log("OBS SAVE: System default font active, no extra definition needed.");
                    fontDefinitionsHtml = '<!-- System default font active -->';
                }


                // --- Step 5: Generate Metadata Tags (Specific Fields) ---
                console.log("OBS SAVE: Generating metadata tags...");
                let metaTags = [];
                // Helper to create meta tag, handling quotes and nulls
                const createMetaTag = (name, content) => {
                    const safeContent = content !== null && content !== undefined ? String(content).replace(/"/g, '"') : '';
                    return `<meta name="${name}" content="${safeContent}">`;
                };

                metaTags.push(createMetaTag("gameget:id", gameData.id));
                metaTags.push(createMetaTag("gameget:name", gameData.name));
                metaTags.push(createMetaTag("gameget:developer", gameData.developer));
                // metaTags.push(createMetaTag("gameget:publisher", gameData.publisher)); // Keep if you add publisher later
                metaTags.push(createMetaTag("gameget:releaseDate", gameData.releaseDate));
                metaTags.push(createMetaTag("gameget:releaseTimestamp", gameData.releaseTimestamp));
                // Join arrays into comma-separated strings for platforms/genres
                metaTags.push(createMetaTag("gameget:platforms", (gameData.platforms || []).join(',')));
                // metaTags.push(createMetaTag("gameget:genres", (gameData.genres || []).join(','))); // Keep if you add genres later
                metaTags.push(createMetaTag("gameget:coverUrl", gameData.thumbnailUrl));
                // User Rating
                if (ratingValue !== null) {
                    metaTags.push(createMetaTag("gameget:userRatingValue", ratingValue));
                    metaTags.push(createMetaTag("gameget:userRatingStyle", ratingStyle));
                }
                // Store Links (JSON stringify the array)
                metaTags.push(createMetaTag("gameget:storeLinks", JSON.stringify(gameData.igdbStoreLinks || [])));
				
				// Add Selected Platform
                if (selectedPlatformName) { // Only add if a platform is actually selected
                     metaTags.push(createMetaTag("gameget:userPlatform", selectedPlatformName));
                     console.log(`OBS SAVE: Adding selected platform to metadata: ${selectedPlatformName}`);
                } else {
                     console.log("OBS SAVE: No platform selected, skipping userPlatform metadata.");
                }
				
                const metaTagsHtml = metaTags.join('\n    ');
                console.log("OBS SAVE: Generated metadata.");
                // --- End Metadata ---


                // --- Step 6: Construct the full HTML structure ---
                const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GameGet Card - ${gameName}</title> <!-- Changed title -->
    <!-- Embed Metadata -->
    ${metaTagsHtml}
    <!-- Embed Font Definition -->
    ${fontDefinitionsHtml}
    <style>
        /* Embedded Base Styles */
        ${baseCss}
        /* Inject Computed Variables into :root */
        :root {
${appliedVariablesString}
        }
        /* OBS Specific Overrides */
        body { position: relative; padding: 0;}
        #results { position: relative; border: none !important; box-shadow: none !important; padding: 10px !important; margin: 0 !important; }
        /* Hide interactive elements specifically for OBS */
        #results button, #results input, #results select, #results a:not(.store-button) { display: none !important; }
        #results .store-button { /* Ensure store buttons are visible if container wasn't removed */ display: inline-flex !important; }
		#game-rating-container { /* Ensure rating container is positioned */ display: block !important; background: none !important; box-shadow: none !important; border: none !important; margin: 10px 0 !important; padding: 5px 0 !important; font-size: 1.8em !important; z-index: auto; }
		#game-rating-container > * {  font-size: 1em !important; font-weight: bold; }
		#game-rating-container .static-rating .stars { font-size: 1em !important;  }
    </style>
</head>
<body class="${isPlatformTextHidden ? 'platform-text-hidden' : ''}">
    <div id="results">
        ${resultsContent}
    </div>
</body>
</html>`;

                // --- Step 7: Create Blob and Download Link ---
                const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const safeGameName = gameName.replace(/[^a-z0-9_\-\s]/gi, '_').replace(/\s+/g, '_');
                link.download = `${safeGameName}_GameGet.html`; // Use ID in filename
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log(`Download triggered for ${link.download}. Includes specific metadata.`);

            } catch (saveError) {
                 console.error("Error during saveResultsHtml execution:", saveError);
                 alert("An error occurred while generating the HTML file.");
            }
        }); // End requestAnimationFrame
    } // End saveResultsHtml
    

    // Initial Setup
    loadLocalFonts().then(() => { // Load local fonts first
         console.log("Local fonts loaded (or attempted). Now loading other settings...");
         loadSettings(); // THEN load other settings (which might select a dynamic font)
         console.log("Initial setup complete.");
    }).catch(err => {
         console.error("Error during initial font load:", err);
         // Still try to load other settings even if fonts fail
		 
    loadSettings(); // Load saved settings on page load
	console.log("Initial setup complete.");
	});


}); // End DOMContentLoaded