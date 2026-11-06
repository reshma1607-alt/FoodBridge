FoodBridge

## Project title
FoodBridge — Food Donation and Redistribution Platform

## Team details
- **Team name:** Stack Storm
- **Member 1:** Sk. Reshma — 241FA04170
- **Member 2:** V. Divija — 241FA04150
- **Member 3:** P. Keerthi — 241FA04706

## Project description
FoodBridge is a full-stack web application that helps food donors share surplus food with people and organizations that need it. Donors can post and manage donations, while recipients can browse available food and submit a claim with pickup details.

## Objectives
- Connect food donors with nearby recipients and organizations.
- Make surplus food easier to share before it goes to waste.
- Provide a simple workflow for posting, finding, and claiming donations.

## Technologies used
- **Frontend:** React, Vite, Axios, CSS
- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB
- **Authentication:** Firebase Authentication (email/password)

## Features
- Email/password sign-up and sign-in through Firebase Authentication.
- Donor and recipient flows.
- Create a food donation with quantity, unit, location, availability time, and donor contact details.
- Browse currently available donations.
- Claim an available donation with recipient and pickup details.
- Donor views for responses and personal donations.
- Update or delete a donor's available donation.
- Responsive landing and application interface.

## API routes
| Method | Route | Purpose |
|---|---|---|
| `GET` | `/` | API health message |
| `GET` | `/api/donations` | List available donations |
| `POST` | `/api/donations` | Create a donation |
| `GET` | `/api/donations/mine/:email` | List a donor's donations |
| `GET` | `/api/donations/responses/:email` | List claimed donations for a donor |
| `PUT` | `/api/donations/:id` | Update an available donation |
| `DELETE` | `/api/donations/:id` | Delete an available donation |
| `PATCH` | `/api/donations/:id/claim` | Claim an available donation |

## Local installation and execution

### Prerequisites
- Node.js and npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- A Firebase project with email/password Authentication enabled

### 1. Configure the backend
From the repository root:

```bash
cd backend
npm install
```

Create `backend/.env` with your own MongoDB connection string:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Keep `.env` private and do not commit credentials. Start the API:

```bash
node server.js
```

The API listens on `http://localhost:5000` by default.

### 2. Configure and start the frontend
In another terminal, from the repository root:

```bash
cd frontend
npm install
```

Configure the Firebase client settings in `frontend/src/firebase.js`. Set the frontend API base URL to the backend address. For local development, use `http://localhost:5000/api`; for deployment, set `VITE_API_URL` to the deployed backend API address.

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Deployment
The application is deployed on Render:
- **Frontend URL:** https://foodbridge-1-5nq7.onrender.com
- **Backend API URL:** https://foodbridge-2iuu.onrender.com
- **MongoDB:** Configure `MONGO_URI` as a private environment variable on the backend host; never put the connection string in this README.

For production, configure `VITE_API_URL` to `https://foodbridge-2iuu.onrender.com/api` in the frontend hosting environment and allow the frontend origin in the backend CORS settings. Configure `MONGO_URI` as a private environment variable on the backend host; never put the connection string in this README.

## Database design
The MongoDB `Donation` document stores food name, quantity, unit, location and optional coordinates, availability deadline, donor details, recipient/pickup details, status, and timestamps.

## Future scope
- Add location-based discovery and distance filtering.
- Add notifications when donations are claimed or updated.
- Add stronger server-side authorization for donor-owned records.
- Add deployment configuration and production API URL management.

## Project links
- **GitHub repository:** https://github.com/reshma1607-alt/FoodBridge
- **Deployed application:** https://foodbridge-1-5nq7.onrender.com
- **Backend API:** https://foodbridge-2iuu.onrender.com
