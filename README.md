# E-Blood Donation

E-Blood Donation is a simple blood donation and emergency blood request web app built with Node.js, Express, MongoDB, Mongoose, and Socket.IO.

## Features

- Donor registration
- Blood request submission
- Server-side validation with structured JSON errors
- Inline client-side validation
- MongoDB persistence
- Human-readable activity logging in `donor_logs.txt`
- Donor portal page
- Real-time emergency broadcast support

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- JSON Web Token
- HTML, CSS, JavaScript

## Project Files

- `server.js` - Main backend server and API routes
- `index.html` - Main landing page with donor and request forms
- `portal.html` - Donor portal page
- `donor_logs.txt` - Activity log file
- `package.json` - Project metadata and dependencies

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Open the app in your browser:

   ```text
   http://127.0.0.1:5000
   ```

## API Endpoints

- `GET /` - Serve the home page
- `GET /api/donors` - Fetch all donors
- `POST /api/register` - Register a donor
- `POST /api/emergencies` - Submit an emergency blood request
- `POST /api/login` - Generate an admin token
- `GET /api/seed` - Insert sample donor data into MongoDB

## Notes

- Make sure MongoDB is running locally before starting the app.
- Successful donor registrations are saved to MongoDB and appended to `donor_logs.txt`.
- Donor success feedback appears as a popup in the UI.
- Validation errors are returned in structured JSON format.

## License

ISC
