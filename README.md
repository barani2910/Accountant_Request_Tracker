# Accountant Request Tracker

A small full-stack workspace for tracking client accounting requests, due dates, and team assignments. It uses three MySQL tables, a React/Vite interface, and an Express API.

## Features

- Dashboard totals for all five request counts, including dynamically calculated overdue requests.
- Create and browse clients, assignees, and requests; inspect each person's linked request list.
- Search by request, client, or assignee; filter by status; sort requests by due date.
- Update request status, edit or delete a request, and view request details.
- Daily overdue email reminders with a manual reminder-check endpoint.
- Assistant answers supported workspace questions from controlled MySQL queries and sends general questions to an optional LLM API.
- Fictional sample records for a quick local walkthrough.

## Architecture

```text
React + Vite (5173)  ->  Express REST API (3001)  ->  MySQL
                                      |             clients
                                      |             assignees
                                      |             requests
                                      +-> Nodemailer SMTP
                                      +-> LLM API (general questions only)
```

There are exactly three database tables. `requests.client_id` and `requests.assignee_id` reference the owning records, so names and contact details are not copied into requests. Client and assignee detail endpoints join those relationships to retrieve request history and workload. No history, reminder, priority, user, notification, or chat tables are used.

## Tech Stack

- Frontend: React, Vite, Lucide icons
- Backend: Node.js, Express.js
- Database: MySQL with parameterized `mysql2` queries
- Email: Nodemailer and SMTP
- Scheduling: node-cron
- Chat: controlled backend data functions plus Groq chat completions for general questions

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- MySQL 8 (or compatible MySQL server)
- SMTP credentials to actually deliver reminders (optional)
- A Groq API key to answer general questions (optional; key prefix is `gsk_`)

## MySQL Setup

Create the database and three tables:

```sh
mysql -u root -p < database/schema.sql
```

Add clients, assignees, and requests through the application.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set the MySQL values. SMTP and LLM variables can be left empty during local UI development. Copy `frontend/.env.example` to `frontend/.env` only if the API uses a different URL.

Never commit `.env` files. Gmail SMTP requires an app password, not the account's regular password. The fictional sample assignee addresses use reserved demo domains; replace them with mailboxes you control before testing real delivery.

## Run Locally

Open two terminals from the project root.

Backend:

```sh
cd backend
npm install
npm run dev
```

Frontend:

```sh
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The backend listens on <http://localhost:3001>. The database must be running and initialized for data-driven screens to load. If the database is unavailable, the UI displays a connection message instead of fake records.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET, POST | `/api/clients` | List and create clients |
| GET | `/api/clients/:id` | Client details and linked requests |
| GET, POST | `/api/assignees` | List and create assignees |
| GET | `/api/assignees/:id` | Assignee details and assigned requests |
| GET, POST | `/api/requests` | List and create requests |
| GET, PUT, DELETE | `/api/requests/:id` | Read, update, and delete a request |
| PATCH | `/api/requests/:id/status` | Change status |
| GET | `/api/requests/overdue` | Non-completed past-due requests, earliest first |
| GET | `/api/dashboard` | Request totals and overdue count |
| POST | `/api/reminders/check` | Manually check and send eligible reminders |
| POST | `/api/chat` | Answer a workspace or general question |
| GET | `/api/health` | API health check |

`GET /api/requests` accepts `status=Open`, `In Progress`, `Completed`, or `Overdue`, plus `search=<text>`. Results are ordered by due date ascending. Overdue is computed from `due_date < CURDATE()` and `status <> 'Completed'`; it is not a stored status.

## Test Overdue Reminders

1. Configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, and optionally `EMAIL_FROM` in `backend/.env`.
2. Replace the demo assignee email addresses with mailboxes you can receive mail at.
3. Start the backend and click **Send reminders** in the app, or call the API:

```sh
curl -X POST http://localhost:3001/api/reminders/check
```

The backend checks past-due non-completed requests. It skips rows whose `last_reminder_sent` is already today. It updates that date only after SMTP delivery succeeds. The job also runs daily at 09:00 in the server's local timezone. An unconfigured or failing SMTP server is reported as a failed send; no success is claimed.

## Test the Chatbot

Workspace questions query MySQL using fixed backend functions; user text is never executed as SQL. Try:

- `Show all requests for ABC Corporation.`
- `What requests are assigned to Arun?`
- `Show Arun's overdue requests.`
- `How many open requests are there?`
- `What is the email of ABC Corporation?`
- `What is GST?`

For general accounting questions, add your Groq API key to `LLM_API_KEY` in `backend/.env`. The default endpoint is `https://api.groq.com/openai/v1` and the default model is `openai/gpt-oss-20b`; both can be changed with `LLM_BASE_URL` and `LLM_MODEL`. A `gsk_` key is from Groq, not xAI Grok (whose keys use a different format). Without a key, workspace questions continue to work and general questions receive a clear setup message. No LLM request is made for application data questions. Do not paste API keys into chat or commit them.


4. Trigger the reminder check. Nodemailer sends first, then `last_reminder_sent` is updated to prevent another same-day send.
5. Ask a client/assignee question to show a controlled MySQL query, then ask a general accounting question to show the optional LLM path.
