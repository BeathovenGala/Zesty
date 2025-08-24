# Zesty: Your Smart Pantry Assistant

## Overview

Zesty is a smart pantry management app designed to combat food waste and save you money. It uses AI to automate the tedious parts of grocery tracking, giving you a powerful, yet effortless tool to manage your kitchen and reduce your environmental footprint. The app's clean, modern UI makes it a pleasure to use, turning a chore into a rewarding habit.

-----

## Features

  * **AI-Powered Expiry Tracking**: Manually add a grocery item, and our AI automatically estimates its shelf life, saving you from having to guess.
  * **Dynamic Recipe Generation**: Instantly get recipes for items nearing expiry or select specific ingredients to generate a custom recipe on demand.
  * **Smart Dashboard**: A central dashboard provides a clear, color-coded overview of your pantry, highlighting items that need to be used soon.
  * **Real-time Alerts**: The app offers simple, in-app notifications to remind you about expiring items.

-----

## Tech Stack

  * **Frontend**: Built with clean HTML, CSS, and JavaScript for a fast and responsive user experience.
  * **Backend**: Node.js and the Express framework to manage all server-side logic and API endpoints.
  * **Database**: SQLite, a lightweight, file-based database for persistent storage.
  * **AI**: The powerful Gemini API, used for both expiry estimation and recipe generation.

-----

## Getting Started

### Prerequisites

  * Node.js and npm installed on your machine.
  * A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1.  Clone the repository or download the project files.
2.  Navigate to the project's root directory in your terminal.
3.  Install the required Node.js dependencies:
    ```bash
    npm install
    ```

### Configuration

1.  Open `server.js` in your code editor.
2.  Find the line `const apiKey = "YOUR_API_KEY_HERE";`
3.  Replace the placeholder with your actual Gemini API key.

### Running the App

1.  In your terminal, start the Node.js server:
    ```bash
    npm start
    ```
2.  Open your web browser and navigate to `http://localhost:3000`.

The app is now running and ready to be used\!

-----

## What's Next

  * **Financial Tracking**: We plan to implement a new feature that tracks the monetary value of food saved and estimates the cost of making recipes at home.
  * **Image Recognition**: Future versions will allow users to take a photo of a receipt or groceries to automatically add items to their pantry, eliminating manual entry.