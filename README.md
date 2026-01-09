
# Medical Asset Generator (Async Queue Demo)

## Overview

This project is a small full-stack demo I built to better understand **asynchronous backend workflows**, **queues**, and **background workers** in a SaaS-style system.

The idea is inspired by tools used by healthcare marketing platforms: a user submits a request (ex: practice info), the backend processes it asynchronously, and the frontend is notified when the result is ready.

The main focus of this project is **backend architecture**

---

## What This App Does

1. A user submits a request from the frontend (doctor name, practice type, etc.)
2. The API immediately accepts the request and stores it
3. A background worker picks up the job asynchronously
4. The job is processed (AI generation is currently mocked or possibly updated)
5. The request status is updated
6. The frontend is notified via WebSocket when processing completes

This avoids blocking HTTP requests and simulates real production workflows.

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Google Cloud SQL)
- **ORM:** Drizzle ORM
- **Async Processing:** Custom queue + worker
- **Realtime Updates:** WebSockets (`ws`)
- **Frontend:** Vue.js
- **Infrastructure:** Google Cloud Run (Dockerized)

---

## Architecture Overview

### Requests & Jobs

- **`requests` table**
  - Stores user input and final output (asset URL / result)
  - Represents *what* the user asked for

- **`jobs` table**
   - Created when a request is sent
  - Tracks async processing state
  - `queued → processing → completed / failed`
  - Includes retry count and error tracking

---

## Queue & Worker Design

- A background worker runs on an interval
- Worker picks up any requests that have the status of `queued` using:

  ```sql
  FOR UPDATE SKIP LOCKED``
- Worker marks the job as `processing` then exceutes the asset generation
- After succesfull completion
  - Job status → `completed`
  - Request status → `completed`
  - Asset URL is saved to the database
  - Server broadcasts `job-completed` message to all connected WebSocket clients
- Frontend picks up the websocket broadcast and dispalys a toast message, refreshes the page

# Future Improvements

### 1. Multi-Tenant Architecture
Right now, there's no authentication—anyone can see all requests. I want to add:
- User accounts with login/signup
- Each user only sees their own requests and jobs
- Row-level security in the database so queries automatically filter by account
- JWT tokens for API authentication

This would make it production-ready for multiple customers.

### 2. Redis Queue System (Bull/BullMQ)
The current polling worker checks the database every second even when there's nothing to do. That's wasteful. I'd like to switch to Redis-backed queuing where:
- Jobs are pushed onto a Redis queue
- Workers are triggered immediately when a job arrives (no polling)
- Retries and scheduling happen automatically
- Scaling up is easier—just spin up more workers

### 3. TypeScript Migration
Converting the Node.js backend to TypeScript would:
- Catch bugs before they happen (type checking)
- Make refactoring way safer
- Eliminate the need for manual validation on every endpoint
- Give me better IDE autocomplete
- Make the code self-documenting

### 4. Other Nice-to-Haves
- Rate limiting so users can't spam requests
- Pagination on the request history (load 10 at a time instead of all)
- Better error messages and logging for debugging
- Email notifications when a job completes
- Webhooks so external systems can subscribe to job completion events