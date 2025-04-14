# GameGet
An IGDB search tool - Made with the assistance of Google AI Studio; a foreword regarding this can be found here on my [website](https://www.wtrjones.co.uk/gameget/)

This guide explains how to set up and run the GameGet application locally on your machine.

## Prerequisites

1.  **Node.js and npm:** You need Node.js installed, which includes the Node Package Manager (npm). Download and install it from [nodejs.org](https://nodejs.org/). Verify installation by opening your terminal or command prompt and running `node -v` and `npm -v`.
1.  **Text Editor:** A code editor like VS Code, Sublime Text, Notepad++, etc.

## Setup Steps

1. **Clone the repository:**
    * `git clone git@github.com:WhiskeyJuliet/GameGet.git` or `git clone https://github.com/WhiskeyJuliet/GameGet.git`
    * Navigate to the project folder with `cd GameGet`
1. **Install dependencies**
    * Install all required Node.js packages with a single command: `npm install` 
1. **Get Twitch API Credentials:**
    * The application uses the IGDB API, which requires Twitch authentication.
    * Go to the [Twitch Developer Console](https://dev.twitch.tv/console/) and log in or create a Twitch account.
    * Navigate to the "Applications" section and click "+ Register Your Application".
    * Fill in the form:
        * **Name:** Choose any name (e.g., "My GameGet App").
        * **OAuth Redirect URLs:** Enter `http://localhost` (required, even if not strictly used here).
        * **Category:** Select "Application Integration" or similar.
    * Click "Create".
    * Find your newly created application and click "Manage".
    * Copy the **Client ID**.
    * Click "New Secret" to generate a **Client Secret**. **Copy this secret immediately and store it securely.** You will not be able to see it again after leaving the page.
1. **Create `.env` File:**
    * In the root of your project folder, create a new file named exactly `.env` (note the leading dot), or use the included `.env.sample` as a template.
    * Open the `.env` file in your text editor and add your Twitch credentials like this, replacing the placeholders with the actual values you copied:
        ```
        TWITCH_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
        TWITCH_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
        ```
## Running the application
1. **Start the server**
    * `npm start`
    * You should see output similar to:
        ```
        Server listening at http://localhost:3000
        INFO: Using IGDB API. Features: ...
        ```
1. **Access the App:**
    * Open your web browser and navigate to:
        ```
        http://localhost:3000
        ```
    * The GameGet application should load and be ready to use!

### Using with OBS

1.  After viewing game details, click the "Save HTML for OBS" button.
2.  Your browser will download an HTML file (e.g., `Game_Name_GameGet.html`).
3.  **Locate the downloaded file.** By default, it likely saves to your computer's "Downloads" folder.
4.  **Move the file:** For OBS to display platform logos and other images correctly when using the "Local File" option in the Browser Source, **move the downloaded `.html` file into the `public/results` folder** of your GameGet application directory.
5.  **Add to OBS:** In OBS Studio, add a "Browser" source.
    *   Check the "Local file" option.
    *   Click "Browse" and select the `.html` file you just moved into the `public/results/`) folder.
    *   Adjust width/height as needed.
6.  **Updating:** When you save details for a new game, it will download a new file. To avoid having to change the OBS local browser source every time you fetch new details, I suggest saving a copy as Current_GameGet.html to use as your browser source and then overwriting that file instead.
7.	**Tip:** To make saving easier, you can often configure your web browser to "Always ask where to save files" in its download settings. This will let you save directly into the `public/results/` folder each time and/or choose to overwrite an existing file eg. Current_GameGet.html

Enjoy searching for games!
