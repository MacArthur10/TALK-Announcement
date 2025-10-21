CAD3 Backend

This is the backend API for the CAD3 Intranet application (Node + Express + TypeScript + MongoDB).

Getting started

1. Copy the example env file and edit values:

   - Windows PowerShell

   $ cp .env.example .env; # or copy manually in Explorer

2. Install dependencies:

   npm install

3. Run in development (watch + ts-node):

   npm run dev

4. Seed the database with demo accounts/services:

   npm run seed

Build & run

1. Build:

   npm run build

2. Start:

   npm start

Notes

- The project expects a MongoDB instance running and reachable at MONGO_URI.
- JWT secret should be set in .env before running in production.
- Default seed credentials are shown in the seed file.
