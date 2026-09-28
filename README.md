# ProxyPal

ProxyPal is a web app for people who buy through proxy shopping services. It tracks orders, items, payments, the balance still owed, and package status in one place instead of a spreadsheet.

**Live site:** https://c1aus-y.github.io/ProxyPal/
**API:** https://your-api.onrender.com/healthz
**Demo video:** (link)

> **This deployment is running in demo mode.** The interface is real; the backend
> is simulated in your browser so the site works without a server. See
> [Demo mode](#demo-mode) below. Delete this quote once your API is live.

![A screenshot of the main screen](docs/assets/screenshot.png)

## What it does

- **Dashboard:** active orders, total still owed, and orders that need a tracking update
- **Orders:** every order placed through a proxy, for yourself or for someone else (sister, mom, a friend), with search and a New Order button
- **Order Detail:** the proxy, platform, recipient, items, payment history, remaining balance and courier tracking for one order
- **Add / Edit Order:** log a new order or change its items, cost or proxy
- **Payments:** a log of every payment made across all orders
- **Account:** profile and log out

The remaining balance is always calculated from the items and payments (items total minus payments). It is never stored, so it cannot go out of sync.

## Built with

React, Vite and Tailwind CSS on the front end. Express on the back end. PostgreSQL hosted on Supabase, with Supabase Auth for login. Package tracking comes from the 17TRACK API. The client is on GitHub Pages, the API on (host), the database on Supabase.

## Architecture

The React client logs users in through Supabase Auth and sends the resulting token with every request to the Express API. The API verifies the token, reads and writes PostgreSQL on Supabase with parameterised queries that always filter by the logged-in user, and calls 17TRACK for shipment status. The 17TRACK key lives only on the API server, never in the client.

    Browser (React, GitHub Pages)
       |  login                        |  Bearer token
       v                               v
    Supabase Auth              Express API (host)
                                 |            |
                                 v            v
                     PostgreSQL (Supabase)   17TRACK API

## Demo mode

The client can run two ways, chosen by one environment variable at **build** time.

**Demo mode is the default.** Only the exact string `false` turns it off, so a forgotten or mistyped variable leaves you on the simulated backend with a visible notice rather than a silently broken build.

| `VITE_USE_MOCK_API` | What happens |
| --- | --- |
| unset, or `true` | The client answers its own requests from `localStorage`. No server, no database, nothing shared between visitors. |
| `false` | The client calls the Express API at `VITE_API_BASE_URL`, which reads and writes real PostgreSQL. |

Demo mode is also the fallback if a free-tier API is asleep during a demo.

## Running it yourself

**The client only, in demo mode.** No database needed.

    cd client
    npm install
    cp .env.example .env        # VITE_USE_MOCK_API stays true
    npm run dev                 # http://localhost:5173

**The whole stack.** Needs a Supabase project (or any PostgreSQL).

    # 1. the database: run server/db/schema.sql in the Supabase SQL Editor

    # 2. the API
    cd server
    npm install
    cp .env.example .env        # fill in DATABASE_URL and the other values
    npm run dev                 # http://localhost:3000

    # 3. the client, in another terminal
    cd client
    npm install
    cp .env.example .env
    # set VITE_USE_MOCK_API=false and the Supabase values
    npm run dev

Check the API on its own before you blame the client:

    curl http://localhost:3000/healthz     # is the process alive
    curl http://localhost:3000/readyz      # is the database reachable

## Environment variables

None of these are committed. `.env.example` in each folder lists them with placeholder values.

| Name | Where | What it is |
| --- | --- | --- |
| `DATABASE_URL` | server | PostgreSQL connection string. Contains a password |
| `SUPABASE_JWT_SECRET` | server | used to verify login tokens. Secret |
| `TRACK17_KEY` | server | 17TRACK API key. Secret |
| `CORS_ORIGINS` | server | comma-separated origins allowed to call the API |
| `NODE_ENV` | server | `production` on your host |
| `PORT` | server | **set by the host**, do not set it yourself |
| `VITE_USE_MOCK_API` | client, at build time | only `false` turns demo mode off |
| `VITE_API_BASE_URL` | client, at build time | your API's public URL, no trailing slash |
| `VITE_SUPABASE_URL` | client, at build time | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client, at build time | Supabase anon key. Public by design; row-level security protects the data |

Every `VITE_` value is compiled into the built JavaScript and is **public**. Never put a secret in one.

## Deploying

**Client, to GitHub Pages.** Already wired up in `.github/workflows/deploy-pages.yml`.

1. **Settings > Pages > Build and deployment > Source: GitHub Actions.**
2. Once the API is live, add `VITE_USE_MOCK_API` = `false`, `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings > Secrets and variables > Actions > Variables**, then re-run the workflow. These are compiled in at build time, so the client must be rebuilt.

**API.** Point the host at the `server/` folder and set the server variables above in its dashboard. Set `CORS_ORIGINS` to the exact Pages origin, with no path and no trailing slash.

**Database.** Run `server/db/schema.sql` once in the Supabase SQL Editor.

The repository must be **public** for Pages to serve it on a free account.

## Project structure

    client/                React front end, built by Vite
      src/api/             one interface, two implementations (mockApi, httpApi)
      src/components/      atoms, molecules, organisms
      src/pages/           the seven screens
    server/                Express API
      db/                  schema.sql and the connection pool
    docs/                  proposal, mockup, design system, weekly reports

## What I would do next

- Turn on webhooks from 17TRACK so tracking updates arrive automatically, instead of fetching them when an order is opened
- Support a currency and exchange rate per order, since proxy orders are often bought in one currency and paid in another
- Add a desktop side-navigation layout and refine the responsive behaviour

## Author

Bianca Claire L. Ochoa. BSCS CS401.

## AI use

![Built with AI assistance](https://img.shields.io/badge/built%20with-AI%20assistance-0b5fff)

Built with AI assistance from Claude (Anthropic), used for [what: e.g. API research, schema design, code review]. See [AI-USAGE.md](AI-USAGE.md) for the full account.

## Licence

MIT, see [LICENSE](LICENSE).
