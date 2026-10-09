# Proposal
Last updated: 2026-10-09.

## The app

**ProxyPal** lets someone who buys through a proxy shopping service log each of their own orders, whether it is for themselves or for someone like a sibling or parent. For each order it records the items, the cost, and how much has been paid to the proxy so far. It then tracks the remaining balance and the package status in one place, instead of spread across a spreadsheet.

## Who it is for

Me, and people like me who use a proxy shopping service to buy or ship things they cannot get themselves, locally or from another country, sometimes for themselves and sometimes for someone else (my sister, my mom).

I used to track this in Excel, and it was hard to keep tabs on what I ordered, who it was really for, how much it cost, how much I had already paid the proxy, and where the package was. When I open the app I am usually trying to do one of three things: check how much I still owe on an order, log a payment I just made, or see whether a package has moved.

## Core features (what is built)

| # | Screen | What it does |
| --- | --- | --- |
| 1 | Dashboard | Active orders, the total still owed across them, and recent orders |
| 2 | Orders | Every order placed through a proxy, with search and a New Order button |
| 3 | Order detail | Proxy, platform, recipient, order date, status, items, payment history, remaining balance and courier tracking |
| 4 | Add / edit order | Log a new order or change its items, cost or proxy |
| 5 | Payments | A log of every payment made across all orders |
| 6 | Login, sign up, account | Added after the proposal. Every order belongs to a logged-in user |

Also added after the proposal:

- **Real package tracking** through the 17TRACK API, instead of a status I type in by hand / updated manually.
- **Courier suggestions.** When a tracking number does not clearly belong to one courier, the app suggests likely couriers from a bundled list and lets the user pick. This was also an issue for me during Excel days because the sellers just give me the tracking number and call it a day.
- **Automatic tracking updates.** A Supabase Edge Function receives 17TRACK webhooks and saves the new status.

## Stretch goals and what was cut

| Item | Status | Why |
| --- | --- | --- |
| Per-order currency and exchange rate | Stretch goal | The app treats every amount as one currency. Proxy orders are often bought in one currency and paid in another, so this is the most useful next feature |
| My own shipment status labels (for example "arrived in PH", "released to my address") | Added | Real courier data comes from 17TRACK, so the app maps its statuses to four of its own: ordered, in transit, shipped, delivered |
| Sample data from my Excel tracker | Cut | Every order belongs to a real account, and a new account starts empty. There is no more seed data |
| Automated tests | Stretch goal | None written yet |

## Where each piece is hosted

| Piece | Host | The free tier's catch |
| --- | --- | --- |
| Client (React, Vite) | GitHub Pages | The workflow must be re-run after changing/updating them |
| API (Express) | Render | A free web service sleeps when idle, so the first request after a quiet period is slow |
| Database and login | Supabase | A free project pauses after about a week of low activity and must be restored manually from dashboard |
| Package tracking | 17TRACK API | Limited to 3 requests per second. The API queues its calls with a 400 ms gap and retries once it is told "too many requests" |
| Tracking webhooks | Supabase Edge Function | Runs on the same Supabase project, so it has the same pausing catch |

## Demo mode

Demo mode was used up to week 3. It was switched off in week 3 when I started using my own tracking numbers / orders, and it is no longer in the app. The live site now uses real accounts and the real API only, so there is nothing left to turn off.

## Risks

| Risk | Then | Now |
| --- | --- | --- |
| Keeping the balance in sync while the items and payments lists change (my biggest worry in the proposal) | Unsure how to keep it right as nested state changes | **Fixed** The balance is never stored. A database view works it out as items total minus payments every time it is read, so it cannot drift |
| Free tiers sleeping or pausing | Not considered | **Fixed** Covered by the hosting notes above |
| 17TRACK limits and a hidden API key | Not considered | **Fixed** The key lives only on the server, and calls are spaced out and retried to prevent "too many requests" errors |
| One person's data leaking to other user | Not considered | **Fixed** Every query filters by the logged-in user, and the database uses row level security |
