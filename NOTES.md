# GameGet - IGDB Search Tool

GameGet is a simple web application designed to quickly search the Internet Game Database (IGDB) via their API. It displays key game information, including cover art, developer, release date, and platforms (with logos). It features extensive UI customization and allows users to add a temporary rating and export the current view as a styled HTML file suitable for use as an OBS browser source.

## Key Features

*   **Fast IGDB Search:** Quickly find games using the comprehensive Internet Game Database API.
*   **Detailed Game Info:** View essential details like developer, release date, and box art.
*   **Visual Platform Logos:** See supported platforms displayed with recognizable local icons.
*   **Store Link Finder:** Displays available links to game pages on GOG.com (via API), Steam & Epic (via IGDB data) when available.
*   **Highly Customizable UI:** Personalize your view with multiple preset themes (Light, Dark, Purple, Hotdog Stand) or create your own via a full color editor.
*   **Theme Management:** Save, share, and import custom color theme files (.txt).
*   **Flexible Font Selection:** Choose from popular Google Fonts, system defaults, or add your own local fonts (`.woff`, `.ttf`, etc. via `fonts.json`).
*   **Persistent Settings:** Remembers your chosen theme, font, and toggle preferences.
*   **Configurable UI:** Adjust platform logo size and toggle the visibility of platform names.
*   **Personal Game Rating:** Add your own temporary rating to viewed games (Stars, Score, or Percent).
*   **OBS Integration Ready:** Export currently displayed game info (with your rating and styles) as a self-contained HTML file, perfect for OBS browser sources.
*   **Local Setup:** Runs locally using Node.js, keeping data fetching efficient.

## Purpose & Use Case

This tool is ideal for streamers or content creators who want a quick way to look up game information and display nicely formatted details (including cover art, developer, release date, platforms, store links, and a personal rating) as an overlay in streaming software like OBS Studio using its browser source feature. The settings allow for extensive visual customization to match stream branding.

## Technical Stack

*   **Backend:** Node.js, Express (for serving files and API proxy/checks)
*   **API:** IGDB API (via Twitch Authentication), GOG Search API
*   **Frontend:** HTML, CSS (with Variables), Vanilla JavaScript
*   **Dependencies:** `axios`, `cors`, `dotenv`, `string-similarity`

## Setup & Installation

Follow these steps to get GameGet running on your local machine:

1.  **Prerequisites:**
    *   **Node.js & npm:** Install from [nodejs.org](https://nodejs.org/). Verify with `node -v` and `npm -v` in your terminal.
    *   **Project Files:** Download or clone the repository. You primarily need `server.js` and the complete `public` folder.

2.  **Create Project Folder & Place Files:**
    *   Create a folder (e.g., `gameget`).
    *   Place `server.js` directly inside this folder.
    *   Place the `public` folder (with all its contents: `index.html`, `style.css`, `script.js`, `images/`, `fonts/`) inside this folder.

3.  **Open Terminal:**
    *   Navigate into your project folder: `cd path/to/gameget`

4.  **Initialize npm:**
    *   Run: `npm init -y` (Creates `package.json`)

5.  **Install Dependencies:**
    *   Run: `npm install express axios cors dotenv string-similarity`
    *   *(Note: If you definitively removed all uses of string-similarity, you can omit it from the install command).*

6.  **Get Twitch/IGDB API Credentials:**
    *   Go to the [Twitch Developer Console](https://dev.twitch.tv/console/) and log in/sign up.
    *   Register a new application:
        *   Name: Anything (e.g., "GameGet Local")
        *   OAuth Redirect URLs: `http://localhost`
        *   Category: "Application Integration"
    *   Manage the created application.
    *   Copy the **Client ID**.
    *   Generate and **immediately copy** the **Client Secret**. Keep these secure.

7.  **Create `.env` File:**
    *   In the root of your project folder (`gameget/`), create a file named exactly `.env`
    *   Add your credentials:
        ```dotenv
        # .env file
        TWITCH_CLIENT_ID=YOUR_CLIENT_ID_HERE
        TWITCH_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
        ```
    *   **Do not share or commit this file.** Add `.env` to your `.gitignore` file if using Git.

## Running the Application

1.  **Open Terminal:** Make sure you are in the project's root directory (`gameget/`).
2.  **Start Server:** Run the command:
    ```bash
    node server.js
    ```
3.  You should see a message like `Server listening at http://localhost:3000`.
4.  **Access App:** Open your web browser and go to `http://localhost:3000`.

## Usage Guide

1.  **Searching:** Type a game name into the input field and press Enter or click the "Search" button.
2.  **Results List:** A scrollable list of up to 35 matching games will appear, showing the Title, Game Type (color-coded), Platform Logos, and Release Year.
3.  **Viewing Details:** Click on any game in the results list to fetch and display its full details.
4.  **Details Display:** Shows Cover Art, Title, Developer, Release Date, Platforms (with logos/names), Store Links (if found and enabled), and the Rating UI.
5.  **Settings Panel:**
    *   Click the cog icon (⚙️) in the top-right corner to open the settings panel.
    *   Click the close button (×) or outside the panel to close it.
6.  **Theme Customization:**
    *   Select a preset theme (Light, Dark, Purple, Hotdog Stand) using the radio buttons.
    *   Select "Custom" to enable the color editor. Use the color pickers or enter hex codes (`#RRGGBB`) to change individual UI colors.
    *   Click "Reset to Theme Defaults" within the custom editor to copy the colors from the currently selected *preset* theme into the custom fields.
    *   Use "Export" to save your current custom colors to a `.txt` file.
    *   Use "Import" to load colors from a previously exported `.txt` file.
7.  **Font Selection:**
    *   Choose from available Google Fonts, your System Default font, or locally added fonts.
    *   To add local fonts, see the "Adding Local Fonts" section below. Click the Refresh button (🔄) next to the dropdown after updating `fonts.json`.
8.  **Store Links Toggle:** Use the "Show"/"Hide" radio buttons to control whether the Store Links section (GOG, Steam, Epic) appears in the details view and the exported HTML.
9.  **Platform Display Settings:**
    *   **Logo Size:** Enter a number (8-48) or use the arrows to set the display size (in pixels) for platform logos in the details view.
    *   **Platform Name:** Choose "Show" or "Hide" to toggle the visibility of text names next to platform logos in the details view.
10. **Rating System:**
    *   Select a rating style ("Stars", "Percent", "Score") or "Off" in Settings.
    *   When viewing game details (and style is not "Off"), the corresponding input will appear below the release date.
    *   Click stars or type a number (0-100 for Percent, 0-99999 for Score) to set a rating **for the current view only**. This rating is *not* saved permanently but *will* be included in the OBS HTML export.
11. **Saving for OBS:**
    *   After viewing game details, click the "Save HTML for OBS" button (floppy disk icon 💾) located below the results area.
    *   Your browser will prompt you to download an HTML file named after the game (e.g., `Doom_GameGet.html`).
    *   **IMPORTANT FOR LOCAL ASSETS:** For images (logos, box art placeholder) and local fonts to load correctly in OBS when using the "Local file" browser source setting, you **must save or move the downloaded HTML file into the `public` folder** (or a subfolder like `public/results/`) of your GameGet application directory.
    *   The saved HTML includes all necessary styles and the current rating.

## Adding Local Fonts

1.  Place your font files (e.g., `MyFont.woff`, `Another.ttf`) inside the `public/fonts/` directory. Supported formats depend on browser but generally include WOFF, WOFF2, TTF, OTF.
2.  Open the `public/fonts/fonts.json` file in a text editor.
3.  Add a new JSON object for each font you want to make available, following this format:
	** This example is marked up for your guidance but json files do not like comments and can break the formatting. Please use the fonts.json.sample file. 
    ```json
    [
      {
        "name": "pxSans", // Display name in dropdown
        "filename": "pxSans.woff", // Exact filename in public/fonts/
        "cssValue": "'pxSans', sans-serif", // font-family value for CSS (use quotes, add fallback)
        "ascentOverride": "115%" // Optional: ascent-override value
      },
      {
        "name": "Another Font",
        "filename": "AnotherFont-Regular.otf",
        "cssValue": "'Another Font', sans-serif"
        // No ascentOverride (optional)
      }
    ]
    ```
    *   Ensure the JSON structure (brackets `[]`, braces `{}`, commas `,`, double quotes `"`) is correct. Use a JSON validator if unsure.
4.  Save the `fonts.json` file.
5.  In the GameGet app, open Settings and click the Refresh button (🔄) next to the Font dropdown. Your new font(s) should now appear in the list.

## Troubleshooting

*   **Server Doesn't Start:** Check the terminal for errors. Ensure Node.js is installed, all dependencies are installed (`npm install`), and the `.env` file exists with correct keys. Check for syntax errors in `server.js`.
*   **App Unresponsive / Buttons Don't Work:** Open the browser's Developer Console (F12). Look for JavaScript errors reported on page load. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R). Ensure all HTML element IDs match those used in `script.js`.
*   **No Search Results / Details Fail:** Check the Developer Console for network errors (4xx, 5xx). Check the Node.js server console output for errors from IGDB or the GOG check (e.g., authentication failure `401`/`403`, syntax errors `400`, timeouts). Verify your `.env` file credentials.
*   **Images/Local Font Not Loading in Saved OBS HTML:** Make sure you saved the `.html` file inside the application's `public` folder (or a subfolder like `public/results/`). Verify the image/font paths within the saved HTML start with `../images/...` or `../fonts/...`.
*   **Theme/Font Settings Not Saving:** Ensure your browser allows localStorage for `localhost`. Check the Developer Console (Application -> Local Storage) to see if values are being stored.

## Contributing


Contributions absoloutley welcomed, feel free make branches for new features or fork the repository and experiment for yourself.

## License


GNU General Public License v3.0 - see LICENSE file in project root.

## Acknowledgements

*	Googlefonts for their free OTL fonts!
*   Data provided by [IGDB.com](https://www.igdb.com/). Requires Twitch Authentication.
*   Uses various Node.js packages (Express, Axios, etc.).

---