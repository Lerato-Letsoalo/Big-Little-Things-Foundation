# Big Little Things Foundation

**Small Acts. Big Impact.**

The Big Little Things Foundation (BLTF) website is a full-stack platform
for a South African nonprofit focused on youth-driven community
initiatives and practical support for under-resourced communities. It
helps visitors learn about the foundation, explore its projects and
impact, volunteer, donate, and connect with the organisation.

-   **Live website:**
    https://big-little-things-foundation.onrender.com/index.html
-   **Repository:**
    https://github.com/Lerato-Letsoalo/Big-Little-Things-Foundation

## About the Foundation

Established in 2021 by Iman Cassiem, Chloe Grotewold and Lehlohonolo
Mgedeza, the foundation supports communities through the provision of
everyday essentials such as clothing, food, toiletries and sanitary-care
products. Youth participation and community involvement are central to
its initiatives.

## Features

### Public website

-   Home page introducing the foundation, its mission and community
    work.
-   About page sharing the foundation's story.
-   Projects page for community initiatives and drives.
-   Gallery featuring moments from activities and volunteer days.
-   Team information and volunteer testimonials.
-   Volunteer registration and contact pages.
-   Donation page to help visitors contribute.
-   Login and registration pages.
-   Language-switching support for English and selected South African
    languages.
-   Search and an on-page form assistant.

### Server-side functionality

The Node.js/Express backend exposes API routes for: - Authentication and
account registration - Team information and events - Donations -
Volunteer management - Testimonials and gallery content - Certificates -
Contact enquiries - Dashboard data - Search - AI-assisted functionality

The application also includes request validation, password hashing, JWT
support, cookie handling, rate limiting on authentication endpoints,
security headers, and a health-check endpoint.

## Technology Stack

  -----------------------------------------------------------------------
  Layer                               Technologies
  ----------------------------------- -----------------------------------
  Frontend                            HTML, CSS, JavaScript

  Backend                             Node.js, Express

  Database                            MySQL, using the `mysql2` driver

  Authentication and security         JSON Web Tokens, bcryptjs, Helmet,
                                      CORS, cookie-parser,
                                      express-rate-limit,
                                      express-validator

  AI integrations                     Google GenAI SDK and Groq SDK

  File and document support           Multer and PDFKit

  Configuration                       dotenv

  Development                         Nodemon
  -----------------------------------------------------------------------

## Project Structure

``` text
Big-Little-Things-Foundation/
├── public/                 # Public website pages and frontend assets
│   ├── assets/             # CSS, JavaScript, images and other assets
│   ├── dashboards/         # Dashboard-related frontend files
│   ├── index.html          # Home page
│   ├── about.html
│   ├── projects.html
│   ├── gallery.html
│   ├── donate.html
│   ├── volunteer.html
│   ├── contact.html
│   ├── login.html
│   └── register.html
├── server/
│   ├── config/             # Server configuration
│   ├── middleware/         # Shared middleware and error handling
│   ├── routes/             # API route handlers
│   ├── utils/              # Shared utilities
│   └── server.js           # Express application entry point
├── database/
│   ├── schema.sql          # Database schema
│   └── seed.sql            # Seed data
├── scripts/
│   ├── setupDb.js          # Database setup script
│   └── createAdmin.js      # Admin account setup script
├── documentation/          # Project manual and documentation
├── uploads/                # Uploaded media files
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project locally:

-   Node.js and npm
-   MySQL server
-   Git

### 1. Clone the repository

``` bash
git clone https://github.com/Lerato-Letsoalo/Big-Little-Things-Foundation.git
cd Big-Little-Things-Foundation
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root. Configure the database
connection and any credentials required by the server configuration and
AI integrations. Use the variable names expected by the files in
`server/config/` and `server/routes/`.

**Do not commit your `.env` file, passwords, API keys, database
credentials, or private certificates to GitHub.** Use your hosting
provider's environment-variable settings for deployment.

### 4. Set up the database

Create a MySQL database and configure its connection details in your
environment. Then run:

``` bash
npm run db:setup
```

The repository also includes `database/schema.sql` and
`database/seed.sql` for the database structure and seed data. Check the
setup script and database configuration before running manual SQL
imports to avoid applying the same setup twice.

### 5. Start the application

For a normal local run:

``` bash
npm start
```

For development with automatic server restarts:

``` bash
npm run dev
```

The server uses the `PORT` environment variable when provided and
otherwise defaults to port `3000`. Open http://localhost:3000 in your
browser.

### Optional: Create an administrator account

If you need to create an admin account, review the script's required
inputs and environment configuration, then run:

``` bash
npm run admin:create
```

Keep administrator credentials private and use a strong password.

## API Overview

The backend mounts the following API route groups:

  Base path             Purpose
  --------------------- ---------------------------------
  `/api/auth`           Authentication and registration
  `/api/team`           Team information
  `/api/events`         Events and community drives
  `/api/donations`      Donation workflows
  `/api/testimonials`   Volunteer testimonials
  `/api/gallery`        Gallery content
  `/api/volunteers`     Volunteer workflows
  `/api/certificates`   Certificates
  `/api/contact`        Contact enquiries
  `/api/dashboard`      Dashboard data
  `/api/search`         Search
  `/api/ai`             AI-assisted features
  `/api/health`         Health check

The health endpoint should return a JSON response indicating that the
service is running. Consult the route files for the supported HTTP
methods, request fields, and access requirements for each endpoint.

## Deployment

The live site is hosted on Render:

https://big-little-things-foundation.onrender.com/index.html

When deploying your own instance, configure the required environment
variables and MySQL connectivity in the hosting dashboard, install
dependencies, and use `npm start` as the start command. Ensure uploaded
files and database storage are configured appropriately for the hosting
environment; local filesystems on some hosting plans may not provide
persistent storage.

## Security Notes

-   Keep secrets and production credentials out of source control.
-   Use HTTPS in production and restrict database access to trusted
    services.
-   Configure strong, unique administrator credentials.
-   Authentication endpoints have rate limiting; do not remove
    protections without an equivalent mitigation.
-   The application intentionally does not serve proof uploads as public
    static files. Preserve appropriate access controls for donation
    proofs and other sensitive uploads.
-   Review the project's environment configuration and deployment
    settings before exposing a production instance.

## Documentation

A project manual is available in
[`documentation/Big_Little_Things_Foundation_Manual.pdf`](documentation/Big_Little_Things_Foundation_Manual.pdf).


