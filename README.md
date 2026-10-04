# ProxyPal

ProxyPal is a web app for people who buy through proxy shopping services, whether for themselves or on behalf of someone else. It tracks orders, items, payments, the balance still owed, and package status in one place, replacing the spreadsheet most people use for this.

- **Live site:** https://c1aus-y.github.io/ProxyPal/
- **API health check:** https://proxypal-aggn.onrender.com/healthz
- **Demo video:** todo

<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/71b2c478-fecc-4baa-9228-faf7ad6cf2ba" />

## Features

- **Dashboard:** active orders, the total still owed, and recent orders
- **Orders:** every order placed through a proxy, with search and a New Order button
- **Order detail:** proxy, platform, recipient, items, payment history, remaining balance and courier tracking for one order
- **Add / edit order:** log a new order or change its items, cost or proxy
- **Payments:** a log of every payment made across all orders
- **Account:** profile and log out

The remaining balance is always calculated from the items and payments (items total minus payments) by a database view. It is never stored, so it cannot go out of sync.

## Built with

React, Vite and Tailwind CSS on the front end. Express on the back end. PostgreSQL hosted on Supabase, with Supabase Auth for login. Package tracking comes from the 17TRACK API. A Supabase Edge Function receives 17TRACK's tracking webhooks and saves the new status, so tracking updates arrive without anyone re-saving an order. The client is hosted on GitHub Pages, the API is hosted on Render, and the database on Supabase.

## Architecture

The React client logs users in through Supabase Auth and sends the resulting token with every request to the Express API. The API verifies the token, reads and writes PostgreSQL using parameterised queries that always filter by the logged-in user, and calls 17TRACK for shipment status. The 17TRACK key lives only on the API server, never in the client.

    Browser (React, GitHub Pages)
       |  login                        |  Bearer token
       v                               v
    Supabase Auth              Express API (host)
                                 |            |
                                 v            v
                     PostgreSQL (Supabase)   17TRACK API

## Setup

**Install first**

- Node.js 20 or newer
- A free [Supabase](https://supabase.com) project
- A [17TRACK](https://api.17track.net) API key

**1. Get the code and install**

    git clone https://github.com/C1AUS-Y/ProxyPal.git
    cd ProxyPal
    cd server && npm install
    cd ../client && npm install

**2. Create the database**

Open your Supabase project, go to the SQL Editor, paste in the contents of `server/db/schema.sql` and run it. This creates the tables, the balance view, row level security and the profile trigger. There is no seed data: a new account starts empty.

**3. Configure environment variables**

In each folder, copy `.env.example` to `.env` and fill it in. Nothing in a `.env` file is committed.

    cp server/.env.example server/.env
    cp client/.env.example client/.env

Server (`server/.env`):

| Name | What it is |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string from Supabase (the session pooler string). Contains a password. Secret |
| `SUPABASE_URL` | Your Supabase project URL. The API uses it to fetch the keys that verify login tokens |
| `TRACK17_KEY` | 17TRACK API key. Secret |
| `CORS_ORIGINS` | Comma-separated origins allowed to call the API, e.g. `http://localhost:5173` |
| `PORT` | Optional locally (defaults to 3000). Set by the host when deployed |

Client (`client/.env`):

| Name | What it is |
| --- | --- |
| `VITE_API_BASE_URL` | The API's address, e.g. `http://localhost:3000`, no trailing slash |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key. Public by design; row level security protects the data |

Every `VITE_` value is compiled into the built JavaScript and is public. Never put a secret in one.

## Running it

In two terminals:

    # terminal 1: the API
    cd server
    npm run dev          # http://localhost:3000

    # terminal 2: the client
    cd client
    npm run dev          # http://localhost:5173

Check the API on its own first:

    curl http://localhost:3000/healthz     # {"ok":true}  the process is alive
    curl http://localhost:3000/readyz      # {"ok":true,"db":"up"}  the database is reachable

Open http://localhost:5173. You should see the login screen. Choose **Sign up**, create an account (if Supabase email confirmation is on, confirm it from your email first), then log in. The dashboard starts empty.

## Using the app

1. **Sign up and log in.** Every screen except the login page needs an account.
2. **Add an order** with the + button: the proxy, the platform, who it is for, and its items. Add a tracking number if you have one.
3. **Open the order** to see its items, the balance, and tracking status.
4. **Log a payment** on the order detail screen. The remaining balance updates.
5. **Check Payments** for every payment across all orders.

## API

Every `/api` route needs an `Authorization: Bearer <token>` header (the Supabase login token) and only ever returns the logged-in user's own data. Without a valid token the API returns `401`.

| Method | Path | What it does | Success / errors |
| --- | --- | --- | --- |
| GET | `/healthz` | Is the server process alive | 200 |
| GET | `/readyz` | Is the database reachable | 200, 503 |
| GET | `/api/orders` | List your orders with items and payments | 200 |
| GET | `/api/orders/:id` | One order with items, payments and balance | 200, 404 |
| POST | `/api/orders` | Create an order with its items | 201, 400 |
| PUT | `/api/orders/:id` | Replace an order's details and items | 200, 400, 404 |
| DELETE | `/api/orders/:id` | Delete an order | 204, 404 |
| POST | `/api/orders/:id/payments` | Log a payment against an order | 201, 400, 404 |
| POST | `/api/orders/:id/tracking` | Register the order's tracking number with 17TRACK | 202, 400, 404 |
| GET | `/api/orders/:id/tracking` | Fetch the latest 17TRACK status and save it on the order | 200, 400, 404 |

The server validates all input itself, because a browser form can be bypassed.

## Project structure

    client/                  React front end, built by Vite
      src/api/               httpApi.js: every call to the Express API
      src/auth/              login session context and route protection
      src/components/        atoms, molecules, organisms
      src/layouts/           the app shell
      src/lib/               small helpers (money, dates, Supabase client)
      src/orders/            shared orders state
      src/pages/             the screens
    server/                  Express API
      server.js              routes, validation, error handling
      auth.js                verifies the Supabase login token
      ordersRepo.js          all SQL for orders, items and payments
      track17.js             17TRACK calls and status mapping
      db/                    schema.sql and the connection pool
    docs/                    proposal, mockup, design system, reports, security notes

## Deploying

**Client, to GitHub Pages.** The workflow in `.github/workflows/deploy-pages.yml` builds and publishes on every push to `main` that touches `client/`.

1. Set **Settings > Pages > Source** to **GitHub Actions**.
2. Under **Settings > Secrets and variables > Actions > Variables**, add `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. They are compiled in at build time, so re-run the workflow after changing them.

**API.** Point your host at the `server/` folder, run `npm start`, and set `DATABASE_URL`, `SUPABASE_URL`, `TRACK17_KEY` and `CORS_ORIGINS` in its dashboard. Set `CORS_ORIGINS` to `https://c1aus-y.github.io` exactly (no path, no trailing slash).

## Screenshots

<!-- to add screenshots -->

| Dashboard | Orders | Order detail |
| --- | --- | --- |
|  |  |  |

## Known issues and next steps

**Known issues**

- If someone sends a bad value, the database rejects it, but the user gets a generic 500 error instead of a clear 400 message.
- Loading the orders list runs a few database queries for every order. It's fine for one person's orders, but it would get slow with a lot of data.
- I haven't written any automated tests.

**Next steps**

- Let each order have its own currency and exchange rate. Proxy orders are usually bought in one currency and paid for in another, and right now the app treats everything as one amount.
- Check every field on the server and return a proper 400 with a useful message when something is wrong.
- Rewrite the orders query so the list loads in fewer trips to the database.

## AI use

Built with AI assistance from Claude (Anthropic). See [AI-USAGE.md](AI-USAGE.md) for the full account.

## License

MIT, see [LICENSE](LICENSE).
