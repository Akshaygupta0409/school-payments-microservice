# School Payments Microservice Backend

## Project Structure
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Business logic
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API route definitions
│   ├── app.js          # Express app configuration
│   └── server.js       # Server startup
├── .env                # Environment variables
└── package.json        # Project dependencies and scripts
```

## Setup
1. Install dependencies
```bash
npm install
```

2. Create a `.env` file with necessary configurations

## Running the Server
- Development: `npm run dev`
- Production: `npm start`

## API Endpoints
- `/api/users`: User management
- `/api/payments`: Payment-related operations
