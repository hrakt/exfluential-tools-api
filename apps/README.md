
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