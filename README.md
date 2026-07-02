# YOR News

AI-personalised news dashboard that learns what you care about and delivers only the stories worth your time.

**Live Demo:** https://yornews.com/

## Overview

YOR News is a full-stack web application that replaces the generic, one-size-fits-all news feed with a personalised one. Users pick their interests, and AI curates and summarises articles tailored to them, so the feed stays relevant instead of noisy. It also supports saved articles, per-user API-key management, and a scheduled email newsletter.

## Features

- Personalised news feed driven by each user's chosen interests
- Firebase authentication with per-user preferences
- AI-generated article summaries for quick scanning
- Save articles to read later
- Per-user API-key management with encrypted storage
- Scheduled email newsletter delivered on a recurring cron job
- Responsive dashboard built with Ant Design

## Tech Stack

**Client**
- React 19 and Vite
- Ant Design
- React Router
- Firebase Authentication

**Server**
- Node.js and Express
- Neon (serverless Postgres) via `pg`
- firebase-admin for token verification
- Groq SDK for AI summaries
- Nodemailer for email delivery
- node-cron for scheduled newsletters

## Getting Started

### Prerequisites
- Node.js 18 or newer
- A Neon Postgres database
- A Firebase project (for auth)

### 1. Clone the repository
```bash
git clone https://github.com/Momosquare016/yornews.git
cd yornews
```

### 2. Set up the server
```bash
cd server
npm install
```

Create a `server/.env` file with the following variables (values omitted):

```
PORT
DATABASE_URL
FRONTEND_URL
API_URL
GROQ_API_KEY
NEWS_API_KEY
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
```

Run the database migrations found in `server/migrations/`, then start the API:
```bash
npm run dev
```

### 3. Set up the client
```bash
cd ../client
npm install
```

Create a `client/.env` file with the following variables (values omitted):

```
VITE_API_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Start the client:
```bash
npm run dev
```

## Architecture

The project is split into a `client/` single-page app and a `server/` API.

The server follows a layered structure:

- **routes/** map HTTP endpoints to controllers (auth, news, saved, preferences, API keys, newsletter)
- **controllers/** handle request and response logic
- **services/** hold the business logic and external integrations (Groq AI, news providers, email, the newsletter scheduler)
- **middleware/** verify Firebase auth tokens and user API keys on protected routes
- **migrations/** contain the SQL schema changes for Postgres

User-supplied provider API keys are never stored in plain text. They are encrypted at rest (see `server/utils/apiKeyCrypto.js`) and decrypted only when needed to make requests on the user's behalf.

## Author

Built by Muhammad Ali

LinkedIn: https://www.linkedin.com/in/muhammad-ali-r-35a9762b4
