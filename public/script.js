      
document.addEventListener('DOMContentLoaded', () => { // Ensure DOM is loaded

    // --- DOM Element References ---
    const gameInput = document.getElementById('gameInput');
    const searchButton = document.getElementById('searchButton'); // Make sure this finds the button
    const resultsDiv = document.getElementById('results');
    const obsButtonContainer = document.getElementById('obs-button-container'); // Save for OBS button
	const ratingStyleGroup = document.getElementById('rating-style-group');
	

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
    const LOCAL_STORAGE_CUSTOM_COLORS_KEY = 'customThemeColors';
	const LOCAL_STORAGE_LOGO_SIZE_KEY = 'platformLogoSize';
    const LOCAL_STORAGE_PLATFORM_TEXT_KEY = 'platformTextVisible';
	const LOCAL_STORAGE_STORE_LINKS_KEY = 'storeLinksEnabled'; // Use generic key
	const DYNAMIC_FONT_STYLE_ID = 'dynamic-font-faces'; // ID for our style tag
	const LOCAL_STORAGE_RATING_STYLE_KEY = 'ratingDisplayStyle';
	
	 // --- Secret Theme Activation ---
    const secretSequence = ['d', 'a', 'n', 'n', 'y', 'r', 'u', 'l', 'e', 's'];
    let currentSequence = [];

	// --- Global State ---
    let currentGameRating = { gameId: null, value: null }; // Stores { gameId: 123, value: 4 } or { gameId: 456, value: 85 } etc.
	let currentPlatformsOrder = []; // Store current platform order
	let selectedPlatformName = null; // Global state for selected platform name

    // --- Verify crucial elements exist ---
    if (!searchButton || !gameInput || !resultsDiv || !storeLinksToggleGroup || !exportButton || !importButton || !importFileInput || !obsButtonContainer || !settingsCog || !settingsPanel || !settingsClose || !themeRadioGroup || !fontSelector || !refreshFontsButton || !customColorEditor || !resetCustomColorsButton
        || !platformLogoSizeInput || !ratingStyleGroup || !platformTextToggleGroup ) { 
        console.error("CRITICAL ERROR: One or more essential UI elements not found! Check IDs in index.html and script.js");
        alert("Initialization Error: UI elements missing. App may not function correctly.");
        return;
    }
    console.log("All essential elements verified.");
    // Add similar checks for settings elements if needed

	// --- Create Style Tag for Dynamic Fonts ---
    let dynamicFontStyleSheet = document.getElementById(DYNAMIC_FONT_STYLE_ID);
    if (!dynamicFontStyleSheet) {
        dynamicFontStyleSheet = document.createElement('style');
        dynamicFontStyleSheet.id = DYNAMIC_FONT_STYLE_ID;
        document.head.appendChild(dynamicFontStyleSheet);
        console.log("Created style tag for dynamic fonts.");
    }

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
   
    function applyTheme(themeName) {
        console.log("Applying theme:", themeName);
        try {
            // --- If switching TO a preset/custom FROM dannyvalz, clear custom styles ---
            const previousTheme = document.body.dataset.theme;
            if (previousTheme === 'dannyvalz' && themeName !== 'dannyvalz') {
                 console.log("Switching away from secret theme, clearing potential direct styles...");
                 customColorInputs.forEach(picker => {
                     if(picker.dataset.varname) {
                         document.body.style.removeProperty(picker.dataset.varname);
                     }
                 });
            }
            // --- End Clear ---


            document.body.dataset.theme = themeName; // Apply theme via data attribute
            localStorage.setItem(LOCAL_STORAGE_THEME_KEY, themeName); // Save preference

            if (themeName === 'custom') {
                if (!loadCustomColors()) {
                    populateCustomColorInputsFromComputed();
                    saveCustomColors();
                }
                customColorEditor.style.display = 'block';
            } else {
                customColorEditor.style.display = 'none';
                // Clear direct styles when switching to ANY non-custom theme
                // (This was already here, ensure it runs unless target is 'dannyvalz' where styles might be needed)
                if (themeName !== 'custom' && themeName !== 'dannyvalz') {
                    customColorInputs.forEach(picker => {
                         if(picker.dataset.varname) {
                             document.body.style.removeProperty(picker.dataset.varname);
                         }
                    });
                }
            }
        } catch (e) {
             console.error(`Error applying theme ${themeName}:`, e);
        }
    } // End applyTheme

    function applyFont(fontName) {
        try {
            console.log("Applying font:", fontName);
            document.body.style.setProperty('--body-font', fontName);
            localStorage.setItem(LOCAL_STORAGE_FONT_KEY, fontName);
        } catch (e) {
            console.error(`Error applying font ${fontName}:`, e);
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
        try {
            const response = await fetch('fonts/fonts.json'); // Fetch the JSON file
            if (!response.ok) {
                throw new Error(`Failed to fetch fonts.json: ${response.status}`);
            }
            const localFonts = await response.json();

            if (!Array.isArray(localFonts)) {
                 throw new Error("fonts.json did not contain a valid array.");
            }

            console.log("Found local fonts:", localFonts);

            // 1. Clear previous dynamic font options and styles
            const existingOptions = fontSelector.querySelectorAll('option[data-dynamic-font]');
            existingOptions.forEach(option => option.remove());
            dynamicFontStyleSheet.innerHTML = ''; // Clear previous @font-face rules

            // 2. Generate @font-face rules and add options
            let fontFaceRules = "";
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
					
					
                    fontFaceRules += `
@font-face {
    font-family: '${font.name}';
    src: url('/fonts/${font.filename}') format('${format}');${ascentOverrideRule} /* Add ascent override if defined */
    /* Add font-weight/style here if needed */
}
`;
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

                } else {
                    console.warn("Skipping invalid font entry in fonts.json:", font);
                }
            });

            // 3. Add all @font-face rules to the style tag
            dynamicFontStyleSheet.innerHTML = fontFaceRules;
            console.log("Added @font-face rules and dropdown options.");

            // 4. Re-apply saved font in case it was a dynamic one that just loaded
            const savedFont = localStorage.getItem(LOCAL_STORAGE_FONT_KEY);
            if (savedFont) {
                // Check if the saved font is now available in the dropdown
                 const validFonts = Array.from(fontSelector.options).map(option => option.value);
                 if (validFonts.includes(savedFont)) {
                    console.log("Re-applying previously saved dynamic font:", savedFont);
                    applyFont(savedFont); // Apply the style
                    fontSelector.value = savedFont; // Set the dropdown value
                 } else {
                     console.warn(`Saved font "${savedFont}" still not found after refresh. Using default.`);
                      // Optionally reset to system default visually if saved font is invalid now
                      // applyFont(fontSelector.querySelector("option[value*='-apple-system']").value);
                      // fontSelector.value = fontSelector.querySelector("option[value*='-apple-system']").value;
                 }
            }

        } catch (error) {
            console.error("Error loading or processing local fonts:", error);
            dynamicFontStyleSheet.innerHTML = '/* Error loading font definitions */'; // Clear on error
             // Optionally inform user: alert("Could not load local fonts from fonts.json.");
        }
    }
	
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
		// NOTE: We call loadLocalFonts() at the end of DOMContentLoaded now,
        // so it runs *before* this most of the time.
        // This function primarily needs to handle selecting the saved font
        // *after* loadLocalFonts has potentially populated the list.
        // The logic inside loadLocalFonts already re-applies the saved font.
		
        try { // Wrap entire function for safety
			console.log("--- loadSettings START ---");
            const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
            const defaultTheme = 'light';

            let themeToApply = savedTheme || defaultTheme;

            // Validate theme
            const validThemes = Array.from(themeRadioGroup.querySelectorAll('input[name="theme"]')).map(radio => radio.value);
            if (!validThemes.includes(themeToApply)) {
                console.warn(`Saved theme "${themeToApply}" is invalid. Resetting to default.`);
                themeToApply = defaultTheme;
                localStorage.removeItem(LOCAL_STORAGE_THEME_KEY);
            }

			 // --- No validation needed for 'dannyvalz' here if it's hidden ---
            // Apply theme FIRST
            applyTheme(themeToApply);

             // --- Check Radio State (Skip if theme is 'dannyvalz') ---
            if (themeToApply !== 'dannyvalz') {
                 const currentThemeRadio = themeRadioGroup.querySelector(`input[name="theme"][value="${themeToApply}"]`);
                 if (currentThemeRadio) {
                     currentThemeRadio.checked = true;
                 } else {
                      // If saved theme (light/dark/etc) not found, default to light radio
                      console.warn(`Could not find theme radio for saved/default value: ${themeToApply}. Checking light.`);
                      const defaultThemeRadio = themeRadioGroup.querySelector(`input[name="theme"][value="${defaultTheme}"]`);
                      if (defaultThemeRadio) defaultThemeRadio.checked = true;
                      // If defaulting visually, make sure the actual theme matches
                      if (document.body.dataset.theme !== defaultTheme) {
                           applyTheme(defaultTheme);
                      }
                 }
            } else {
                // If dannyvalz theme loaded, make sure 'light' radio LOOKS checked
                // so user has a starting point if they open settings.
                 const lightRadio = themeRadioGroup.querySelector('input[name="theme"][value="light"]');
                 if(lightRadio) lightRadio.checked = true;
                 console.log("Loaded hidden theme 'dannyvalz'. Defaulting visible radio selection to 'light'.");
            }


            // Load Font (Validation happens within loadLocalFonts now)
            const savedFont = localStorage.getItem(LOCAL_STORAGE_FONT_KEY);
            if (savedFont) {
                // We don't apply here directly, loadLocalFonts handles re-applying if needed
                // We just set the dropdown value if the option exists *now*
                 const fontOption = fontSelector.querySelector(`option[value="${CSS.escape(savedFont)}"]`);
                 if(fontOption) {
                    fontSelector.value = savedFont;
                    console.log(`loadSettings: Set font selector to saved value: ${savedFont}`);
                 } else {
                     console.warn(`loadSettings: Saved font "${savedFont}" not found in dropdown (might load dynamically).`);
                     // Don't remove from storage here, loadLocalFonts will handle validation
                 }
            }

            // --- Load Store Links Toggle State ---
            const savedStoreLinksEnabled = localStorage.getItem(LOCAL_STORAGE_STORE_LINKS_KEY);
            // Default to 'true' (enabled) if no setting is saved yet
            const storeLinksAreEnabled = savedStoreLinksEnabled === null ? true : (savedStoreLinksEnabled === 'true');
			applyStoreLinksToggle(storeLinksAreEnabled); // Apply the setting (which now includes adding/removing class)
            const valueToSelectStore = storeLinksAreEnabled ? 'on' : 'off';
            const currentStoreRadio = storeLinksToggleGroup.querySelector(`input[name="storeLinksToggle"][value="${valueToSelectStore}"]`);
            if (currentStoreRadio) currentStoreRadio.checked = true;
            else { // Fallback if somehow radios are missing/changed
                 const defaultStoreRadio = storeLinksToggleGroup.querySelector('input[name="storeLinksToggle"][value="on"]');
                 if (defaultStoreRadio) defaultStoreRadio.checked = true;
            }

			// Platform Text Visibility
            const savedTextVisible = localStorage.getItem(LOCAL_STORAGE_PLATFORM_TEXT_KEY);
            const textIsVisible = savedTextVisible === null ? true : (savedTextVisible === 'true');
            applyPlatformTextVisibility(textIsVisible); // Apply visibility class
            const textValueToSelect = textIsVisible ? 'show' : 'hide'; // Determine correct radio value
            const currentTextRadio = platformTextToggleGroup.querySelector(`input[name="platformTextToggle"][value="${textValueToSelect}"]`); // Find correct radio
            if (currentTextRadio) {
                currentTextRadio.checked = true; // Set checked state
            } else { // Fallback
                 const defaultTextRadio = platformTextToggleGroup.querySelector('input[name="platformTextToggle"][value="show"]');
                 if (defaultTextRadio) defaultTextRadio.checked = true;
            }
            
			
			      
			// --- Load Rating Display Style ---
            const savedRatingStyle = localStorage.getItem(LOCAL_STORAGE_RATING_STYLE_KEY);
            const defaultRatingStyle = 'off'; // Define the default value
            let ratingStyleToApply = savedRatingStyle || defaultRatingStyle; // Use saved or default

            // Validate the style against available options
             const validRatingStyles = Array.from(ratingStyleGroup.querySelectorAll('input[name="ratingStyle"]')).map(radio => radio.value);
             if (!validRatingStyles.includes(ratingStyleToApply)) {
                 console.warn(`Saved rating style "${ratingStyleToApply}" is invalid. Resetting to default "${defaultRatingStyle}".`);
                 ratingStyleToApply = defaultRatingStyle;
                 localStorage.removeItem(LOCAL_STORAGE_RATING_STYLE_KEY); // Remove invalid value
             }

            applyRatingStyle(ratingStyleToApply, false); // Apply style setting (e.g., hide/show container potentially)

            // Update radio button state
            const currentRatingRadio = ratingStyleGroup.querySelector(`input[name="ratingStyle"][value="${ratingStyleToApply}"]`);
            if (currentRatingRadio) {
                currentRatingRadio.checked = true; // Check the correct radio
            } else {
                 // --- FALLBACK LOGIC ---
                 console.error(`Could not find rating style radio button for value: "${ratingStyleToApply}". Defaulting check state to '${defaultRatingStyle}'.`);
                 // Find the radio button corresponding to the default style
                 const defaultRatingRadio = ratingStyleGroup.querySelector(`input[name="ratingStyle"][value="${defaultRatingStyle}"]`);
                 if (defaultRatingRadio) {
                      defaultRatingRadio.checked = true; // Check the default radio
                 } else {
                      console.error(`CRITICAL: Could not even find the default rating style radio ('${defaultRatingStyle}')!`);
                 }
                 // Ensure the actual applied style matches the fallback default
                 applyRatingStyle(defaultRatingStyle, false);
                 // --- END FALLBACK LOGIC ---
            }
            // --- End Rating Style Load ---

    
            
			
			// --- Update Log ---
            const finalLogoSize = localStorage.getItem(LOCAL_STORAGE_LOGO_SIZE_KEY) || 16;
            const finalTextVisible = localStorage.getItem(LOCAL_STORAGE_PLATFORM_TEXT_KEY) === null ? true : (localStorage.getItem(LOCAL_STORAGE_PLATFORM_TEXT_KEY) === 'true');
            console.log(`Loaded settings: Theme='${document.body.dataset.theme}', Font='${savedFont || 'Default'}', LogoSize='${finalLogoSize}', PlatformText='${finalTextVisible}', StoreLinks='${storeLinksAreEnabled}',RatingStyle='${ratingStyleToApply}'`);
			
			
        } catch (e) {
            console.error("Critical error during loadSettings:", e);
             alert("Error loading settings. Defaults may be applied.");
             try { applyTheme('light'); } catch {}
        } finally {
             console.log("--- loadSettings END ---");
        }
    } // End loadSettings

	    // --- Import/Export Functions ---

    function formatColorsForExport() {
        let outputText = "# GameGet Custom Theme Export\n";
        outputText += `# Saved: ${new Date().toISOString()}\n\n`;
        customColorInputs.forEach(picker => {
            const varName = picker.dataset.varname;
            const value = picker.value;
            if (varName) {
                outputText += `${varName} = ${value}\n`;
            }
        });
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
        if (!file) {
            console.log("No file selected for import.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            console.log("--- Import File Read ---");
            console.log("Raw Content Snippet:", content.substring(0, 200)); // Log beginning of file content

            try {
                // Step 1: Parse
                console.log("Parsing imported colors...");
                const importedColors = parseImportedColors(content);
                console.log("Parsed colors object:", JSON.stringify(importedColors, null, 2)); // Log the parsed object

                if (Object.keys(importedColors).length === 0) {
                    throw new Error("No valid color variables found in the file.");
                }

                // Step 2: Apply Colors
                console.log("Applying parsed colors to styles and inputs...");
                Object.entries(importedColors).forEach(([varName, value]) => {
                    console.log(` -> Processing ${varName} = ${value}`);
                    // Apply directly to body style
                    updateCustomColor(varName, value);
                    // Update the corresponding input fields (picker and hex)
                    syncColorInputs(varName, value);
                });
                console.log("Finished applying/syncing inputs.");


                // Step 3: Set theme attribute & save theme preference
                console.log("Setting theme to 'custom' and ensuring editor is visible...");
                document.body.dataset.theme = 'custom';
                localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'custom');
                if (customColorEditor) { // Ensure editor exists
                    customColorEditor.style.display = 'block';
                } else {
                     console.error("Custom color editor element not found!");
                }

                // Step 4: Save the NEW colors to storage
                console.log("Attempting to save the newly applied custom colors...");
                saveCustomColors(); // saveCustomColors reads from the input elements

                // Step 5: Check the radio button
                console.log("Setting 'custom' theme radio button checked state...");
                const customRadio = themeRadioGroup.querySelector('input[name="theme"][value="custom"]');
                if (customRadio) {
                    customRadio.checked = true;
                } else {
                    console.error("Cannot find custom theme radio button.");
                }

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
        const colors = {};
        const lines = textContent.split('\n');
        const hexRegex = /^#[0-9A-F]{6}$/i; // Regex for #RRGGBB format

        lines.forEach(line => {
            line = line.trim();
            // Ignore comments and empty lines
            if (line.startsWith('#') || line === '') {
                return;
            }

            const parts = line.split('=');
            if (parts.length === 2) {
                const varName = parts[0].trim();
                const value = parts[1].trim().toLowerCase(); // Ensure lowercase hex

                // Validate variable name looks like a CSS var and value is a valid hex
                if (varName.startsWith('--') && hexRegex.test(value)) {
                    // Check if this variable name exists in our inputs
                    if (customColorEditor.querySelector(`[data-varname="${varName}"]`)) {
                         colors[varName] = value;
                    } else {
                         console.warn(`Ignoring unknown variable from import file: ${varName}`);
                    }
                } else {
                    console.warn(`Ignoring invalid line in import file: "${line}"`);
                }
            }
        });
        return colors;
    }

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
            // Handle no platforms
            const noPlatforms = document.createElement('span'); noPlatforms.textContent = ' N/A';
            platformsHeader.appendChild(noPlatforms);
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

        // Add click listener
        saveButton.addEventListener('click', () => {
            saveResultsHtml(data.name); // Pass the game name for the filename
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
    async function saveResultsHtml(gameName) {
        console.log(`OBS SAVE: Starting generation for "${gameName}"`);

        // Wrap core logic in rAF to wait for rendering updates
        requestAnimationFrame(async () => {
            try {
                // --- Step 0: Get current settings needed for generation ---
                const ratingStyle = localStorage.getItem(LOCAL_STORAGE_RATING_STYLE_KEY) || 'off';
                const ratingValue = currentGameRating.value; // Use current in-memory rating
                const shouldShowStores = localStorage.getItem(LOCAL_STORAGE_STORE_LINKS_KEY) === null ? true : (localStorage.getItem(LOCAL_STORAGE_STORE_LINKS_KEY) === 'true');
                console.log(`OBS SAVE: Rating Style='${ratingStyle}', Value=${ratingValue}, ShowStores=${shouldShowStores}`);

				// --- Step 0.5: Get Platform Text Visibility State ---
                const isPlatformTextHidden = document.body.classList.contains('platform-text-hidden');
                console.log(`OBS SAVE: Platform text hidden state: ${isPlatformTextHidden}`);

                // --- Step 1: Clone results content & Modify for static output ---
                console.log("OBS SAVE: Cloning #results div");
                const resultsClone = resultsDiv.cloneNode(true);

                // 1a: Handle Rating Display
                const ratingContainerInClone = resultsClone.querySelector('#game-rating-container');
                if (ratingContainerInClone) {
                    const staticRatingHtml = getStaticRatingHtml(ratingStyle, ratingValue); // Generate static HTML
                    if (staticRatingHtml) {
                        console.log("OBS SAVE: Injecting static rating HTML.");
                        ratingContainerInClone.innerHTML = staticRatingHtml; // Replace input with static HTML
                        ratingContainerInClone.removeAttribute("style"); // Remove potential inline display style if set by JS
                        ratingContainerInClone.classList.remove('rating-off'); // Ensure visible if content present
                    } else {
                        console.log("OBS SAVE: Removing rating container (off or no value).");
                        ratingContainerInClone.remove();
                    }
                }

                // 1b: Handle Store Links Display
                const storeContainerInClone = resultsClone.querySelector('.store-links-container');
                if (storeContainerInClone) {
                    if (!shouldShowStores) {
                        console.log("OBS SAVE: Removing store links container (setting is off).");
                        storeContainerInClone.remove();
                    } else {
                        // Clean up loading message just in case
                        const loadingInClone = storeContainerInClone.querySelector('.store-loading');
                        if (loadingInClone) loadingInClone.remove();
                    }
                }

                // 1c: Adjust local image paths
                console.log("OBS SAVE: Adjusting local image paths...");
                const imagesToAdjust = resultsClone.querySelectorAll('img');
                imagesToAdjust.forEach(img => {
                    const currentSrc = img.getAttribute('src'); // Read original src
                    if (currentSrc && !currentSrc.match(/^(https?:)?\/\//) && !currentSrc.startsWith('../')) {
                        img.setAttribute('src', '../' + currentSrc); // Set adjusted src
                    }
                });

                // 1d: Get final HTML content
                const resultsContent = resultsClone.innerHTML;


                // --- Step 2: Fetch and clean base CSS ---
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


                // --- Step 3: Get Computed Variable Values ---
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

                // --- Step 4: Determine Required Font Definitions (REVISED LOGIC) ---
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
                
                // --- Step 5: Construct the final HTML ---
                const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GameGet Result - ${gameName}</title>
    ${fontDefinitionsHtml} <!-- Embed Google Link OR Local @font-face -->
    <style>
        /* Embedded Base Styles (Themes, :root, @font-face Removed) */
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
		#game-rating-container { /* Ensure rating container is positioned */ display: block !important; background: none !important; box-shadow: none !important; border: none !important; margin: 10px 0 !important; padding: 5px 0 !important; font-size: 1em !important; z-index: auto; }
		#game-rating-container > * {  font-size: 1.8em !important; font-weight: bold; }
		#game-rating-container .static-rating .stars { font-size: 1em !important;  }
	</style>
</head>
<body class="${isPlatformTextHidden ? 'platform-text-hidden' : ''}">
    <div id="results">
        ${resultsContent}
    </div>
</body>
</html>`;

                // --- Step 6: Create Blob and Download Link ---
                const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const safeGameName = gameName.replace(/[^a-z0-9_\-\s]/gi, '_').replace(/\s+/g, '_');
                link.download = `${safeGameName}_GameGet.html`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log(`Download triggered for ${link.download}.`);

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