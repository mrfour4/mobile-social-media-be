# Social Media Backend (NestJS)

Backend service for a social media application built with **NestJS**, **Prisma**, and **PostgreSQL**.  
This project provides authentication (Google OAuth + JWT), user management, and core social features.

---

## Tech Stack

- Node.js >= 18
- NestJS v11
- Prisma v7
- PostgreSQL (Docker)
- JWT Authentication
- Google OAuth

---

## Prerequisites

Make sure you have the following installed:

- Node.js >= 18
- Docker & Docker Compose
- npm or yarn

---

## Project Setup

### 1. Clone repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Setup environment variables

Create a `.env` file in the project root.

Example structure (do NOT use real secrets):

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db_name>?schema=public

JWT_ACCESS_SECRET=<your-access-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>

GOOGLE_CLIENT_ID=<your-google-client-id>

APP_DEEP_LINK_BASE=yourapp://add-friend
```

---

### 4. Start PostgreSQL with Docker

```bash
docker compose up -d
```

Verify database is running on port `5432`.

---

### 5. Prisma setup

Generate Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

---

### 6. Run the application

Development mode:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

Server will start at:

```
http://localhost:3000
```

---

## Useful Commands

```bash
npx prisma studio
npm run lint
npm run test
npm run test:e2e
```

---

## Notes

- This project uses Prisma v7 (not v6).
- Google OAuth requires proper configuration in Google Cloud Console.
- Docker is recommended for local database consistency.

---

## License

UNLICENSED – for educational and internal use only.
