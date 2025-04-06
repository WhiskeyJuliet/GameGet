# GameGet
A IGBD search tool - Made with the assistance of Google AI Studio; a forward regarding this can be found here on my [website](https://www.wtrjones.co.uk/gameget/)

##Guide

This guide explains how to set up and run the GameGet application locally on your machine.

## Prerequisites

1.  **Node.js and npm:** You need Node.js installed, which includes the Node Package Manager (npm). Download and install it from [nodejs.org](https://nodejs.org/). Verify installation by opening your terminal or command prompt and running `node -v` and `npm -v`.
2.  **Code Files:** Download or obtain the `server.js` file and the `public` folder (including all its contents like `index.html`, `style.css`, `script.js`, and the `images` and `fonts` subfolders).
3.  **Text Editor:** A code editor like VS Code, Sublime Text, Notepad++, etc.

## Setup Steps

1.  **Create Project Folder:**
    *   Create a new folder on your computer where you want to store the project (e.g., `gameget-app`).
    *   Place the downloaded `server.js` file directly inside this folder.
    *   Place the downloaded `public` folder (and all its contents) inside this folder. Your structure should look like:
        ```
        gameget-app/
        ├── public/
        │   ├── fonts/
        │   ├── images/
        │   ├── index.html
        │   ├── style.css
        │   └── script.js
        └── server.js
        ```

2.  **Open Terminal:**
    *   Open your terminal or command prompt.
    *   Navigate into the project folder you created:
        ```
        cd path/to/your/gameget-app
        ```

3.  **Initialize npm:**
    *   This command creates a `package.json` file needed to manage dependencies. Run:
        ```
        npm init -y
        ```
    *   (The `-y` flag accepts default settings, which is fine for this.)

4.  **Install Dependencies:**
    *   Install the Node.js packages required by `server.js`:
        ```
        npm install express axios cors dotenv string-similarity
        ```
    *   This will download the necessary packages into a `node_modules` folder.

5.  **Get Twitch API Credentials:**
    *   The application uses the IGDB API, which requires Twitch authentication.
    *   Go to the [Twitch Developer Console](https://dev.twitch.tv/console/) and log in or create a Twitch account.
    *   Navigate to the "Applications" section and click "+ Register Your Application".
    *   Fill in the form:
        *   **Name:** Choose any name (e.g., "My GameGet App").
        *   **OAuth Redirect URLs:** Enter `http://localhost` (required, even if not strictly used here).
        *   **Category:** Select "Application Integration" or similar.
    *   Click "Create".
    *   Find your newly created application and click "Manage".
    *   Copy the **Client ID**.
    *   Click "New Secret" to generate a **Client Secret**. **Copy this secret immediately and store it securely.** You will not be able to see it again after leaving the page.

6.  **Create `.env` File:**
    *   In the root of your project folder (`gameget-app/`), create a new file named exactly `.env` (note the leading dot).
    *   Open the `.env` file in your text editor and add your Twitch credentials like this, replacing the placeholders with the actual values you copied:
        ```
        # .env file - Store your secrets here
        TWITCH_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
        TWITCH_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
        ```
    *   Save the file.
    *   **Important:** Ensure this `.env` file is *never* committed to public repositories (like GitHub) if you decide to use version control.

7.  **Run the Application:**
    *   Go back to your terminal (which should still be in the project directory).
    *   Start the server using Node.js:
        ```
        node server.js
        ```
    *   You should see output similar to:
        ```
        Server listening at http://localhost:3000
        INFO: Using IGDB API. Features: ...
        ```

8.  **Access the App:**
    *   Open your web browser and navigate to:
        ```
        http://localhost:3000
        ```
    *   The GameGet application should load and be ready to use!

Enjoy searching for games!
