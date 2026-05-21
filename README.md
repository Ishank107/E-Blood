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
- Real-time emergency broadcast support for the local Node server

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- JSON Web Token
- HTML, CSS, JavaScript

## Project Files

- `server.js` - Main local backend server and API routes
- `app.js` - Shared Express app used by local server and Vercel API functions
- `api/[...path].js` - Vercel serverless API entrypoint
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

## Vercel Deployment

This project is ready to deploy on Vercel as a static front end with serverless API routes.

You must set these environment variables in Vercel:

- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret used to sign the login token

Important notes:

- Vercel cannot use the local MongoDB instance from your laptop.
- The deployed app must use MongoDB Atlas or another hosted MongoDB service.
- Socket.IO real-time notifications work in the local Node server, but Vercel serverless functions do not keep a long-running socket server.

## Notes

- Make sure MongoDB is running locally before starting the app.
- Successful donor registrations are saved to MongoDB and appended to `donor_logs.txt`.
- Donor success feedback appears as a popup in the UI.
- Validation errors are returned in structured JSON format.

## License

ISC
