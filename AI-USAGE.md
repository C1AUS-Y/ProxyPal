# AI usage

ProxyPal was built with AI assistance from Claude (Anthropic). This file is the record of it.

## 1. How I used AI

At least six entries. One per real use. Every entry needs a commit link.

### 2026-09-28 - Frontend Development

- **Tool:** Claude
- **What I asked for:** To refine the initial frontend code I made as it was too simple and archaic.
- **What it gave back:** A rebuilt frontend with routes, layout, pages, components, and mock API with fake static values.
- **What I kept, what I changed, and why:** I kept the structure because it follows my design system. I wrote the Tailwind config myself so the web app uses my colours, sizes and fonts. I also changed the app title, description, LICENSE name and README credit, and fixed the initial navigation since it was at the bottom when it should've been on the side.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/f5d40c4

### 2026-10-03 - Configured Supabase and Github pages

- **Tool:** Claude
- **What I asked for:** Help with how to set up Supabase schema.
- **What it gave back:** Instructed me on how to structure and write the tables and security policies and triggers.
- **What I kept, what I changed, and why:** I wrote the profiles, items, orders, and payment tables and the security policies, and enabled the row level security for them myself. Ended up changing my initial plan here which was allowing users to upload images as their profile pic and scrapping it entirely. I also changed and added a script that drops any old tables from the template. I also turned on GitHub Pages so the web app is live.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/0e49e88

### 2026-10-03 - Added 17TRACK webhook, fixed Backend, and polished Frontend

- **Tool:** Claude
- **What I asked for:** Improve the UI again by making it more modern and polished after feedback from some users such as my friends and sister. They complained that it still looked old. Also asked for some guidance on how to connect the 17TRACK api properly to the web app and Supabase because the 17TRACK docs wasn't clear enough for me to follow.
- **What it gave back:** A reworked UI across all pages, with automatic light and dark mode based on system setting. I implemented dark mode since my sister said the brightness and white theme hurt her eyes. It also returned a very thorough guideline on how to set up webhooks and 17TRACK api.
- **What I kept, what I changed, and why:** I kept the newly polished frontend. Everything else in this commit was configured by me which includes the Edge Function webhook on Supabase, setting up Supabase and 17TRACK on their respective dashboards, connection to Supabase Auth and the database, and README rewrite. Added comments to better explain the schema as well.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/1daf69a


### 2026-10-04 - Fixed 17TRACK tracking

- **Tool:** Claude
- **What I asked for:** My 17TRACK code didn't work as well as I wanted, kept getting spotty and hopeless when it came to not knowing the courier so I asked for help improving it.
- **What it gave back:** It suggested to use 17TRACK's courier list and ask the user for the carrier if they know it.
- **What I kept, what I changed, and why:** I kept its initial suggestion (the courier list and the optional carrier). I changed how the list is used: I saved it as a local file (carriers.json) so lookups are free and don't call 17TRACK, and I wrote carrierFallback.js myself to guess the courier from the number's format. It only picks a courier automatically when the format is clearly one courier, otherwise it shows suggestions and asks the user. I had to implement this because guessing actually took credits off my 17TRACK api, and I didn't want to waste it all on guessing and incorrect tracking numbers.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/501fad9 (carrierFallback.js is in 245f759)

### 2026-10-04 - Fixed server.js after 17TRACK changes

- **Tool:** Claude
- **What I asked for:** After changes to track17.js, my server code no longer matched it properly so I asked for help on how to fix it.
- **What it gave back:** trackingCarrier is validated, syncTracking takes a carrier, the tracking routes read the saved number and courier before calling 17TRACK, and a /api/carriers route.
- **What I kept, what I changed, and why:** I kept the carrier handling (validation, syncTracking, and the tracking routes). I later replaced its /api/carriers route which queried a carriers table my schema doesn't have, with routes that read the bundled carriers.json, so courier lookups are free and don't need the database.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/32350d3

### 2026-10-04 - Fixing crashes on tracking numbers/address

- **Tool:** Claude
- **What I asked for:** The order page kept returning blank when it loaded tracking updates from 17TRACK, asked for source of errors and possible solutions.
- **What it gave back:** A formatLocation function on the server that turns an address object into text, toText and toEvents on the client that force every event field to a string, and unique keys for the timeline items.
- **What I kept, what I changed, and why:** I kept the fix since it did address the big error that affected the main feature of  my webapp. The server cleans new events, and the client cleans events that were already saved, so old orders stop crashing too.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/c226e01

## 2. Where the AI got it wrong

### Case 1 - Event address crashed the order page

- **What it gave me:** In the 17TRACK code, an event's location fell back to its address field when there was no location, so the address was passed on as is.
- **What was wrong with it:** 17TRACK sends address as an object (city, state, country), not text. The order page tried to render it, and React crashed and blanked the whole screen because I didn't have anything to receive and convert it properly.
- **What I did instead:** The server now turns the address into text with formatLocation. The client also forces every event field to a string (toText and toEvents), so events already saved with objects are cleaned up too.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/c226e01

### Case 2 - Guessing couriers burned my 17TRACK credits

- **What it gave me:** Tracking code that registered a number with 17TRACK even when the courier wasn't known, so 17TRACK had to guess it.
- **What was wrong with it:** The guessing burned my credits and I only get 200 tracked parcels. It also registered the number again on every edit.
- **What I did instead:** I made it check the number against the local carrier list first and only register once the courier is known. I also added a courier picker on the order form and stopped it re-registering on every edit.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/245f759

### Case 3 - Order number was shared between all users

- **What it gave me:** A frontend that showed Order # using the database id (for example in OrderCard.jsx).
- **What was wrong with it:** With the real database the id is shared by every user, so order numbers jumped around and weren't per user. A new user's first order wasn't #1.
- **What I did instead:** I gave each order its own per-user number. I added a unique index and a trigger in the database that sets it automatically, and changed the frontend to show it.
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/6f32d88 (the database trigger is in https://github.com/C1AUS-Y/ProxyPal/commit/57706c2)

## 3. Who wrote what

At least a fifth of this project is code you wrote yourself. Name it, and explain
it in your own words.

### Written by me

I did most of the backend.

- **File:** client/tailwind.config.js
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/f5d40c4
- **What it does and why it is built this way:** It keeps my design tokens (colours, text sizes, fonts) in one place. content tells Tailwind which files to scan. If I want to change the design I only edit this file.

- **File:** server/db/schema.sql (the profiles, orders, items, and payments tables, and all the row-level security policies and dropping of old template data)
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/0e49e88
- **What it does and why it is built this way:** The tables hold the data and ON DELETE CASCADE removes an order's rows when the order or user is deleted. orders.user_id defaults to auth.uid() so it's accurate, and the CHECK constraints reject bad values like a wrong status or an amount of 0 or less. The policies make sure users can only view and edit their own rows or data. items and payments have no user id, so their policies check the parent order (main) and see if it belongs to the user.

- **File:** server/carrierFallback.js
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/245f759
- **What it does and why it is built this way:** It works out which courier a tracking number belongs to using the local carriers.json, so it doesn't call 17TRACK. It checks the number's format (international post numbers like for example, EE123456789JP, end with the origin country code) and lists couriers from my home country first. trackIfMatched only calls 17TRACK once the courier is known, either because the user picked it or because the format clearly matches one courier. If it isn't sure, it returns suggestions and asks the user. I built it this way because 17TRACK only lets me track 200 parcels and a wrong courier wastes one.

- **File:** client/src/auth/AuthContext.jsx and ProtectedRoute.jsx
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/1daf69a
- **What it does and why it is built this way:** AuthContext wraps Supabase's session handling so any page can ask who is logged in, and I don't store passwords myself. It restores the session on refresh and stays in sync on login, logout and token refresh. ProtectedRoute sends anyone without a session to /login.

- **File:** the Supabase Edge Function for the 17TRACK webhook (index.ts)
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/1daf69a
- **What it does and why it is built this way:** It receives the webhook calls 17TRACK sends and saves the new tracking status. Status changes arrive automatically so nobody has to re-save an order. It is deployed on Supabase, so it is not a file in the main ProxyPal repo.

- **File:** server/server.js
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/1daf69a (carrier changes: https://github.com/C1AUS-Y/ProxyPal/commit/32350d3)
- **What it does and why it is built this way:** This is where the routes are. It validates all input on the server and returns every error in one 400. Every route needs a login and uses the user's id. POST /api/orders replies right away and syncs tracking in the background, so a slow 17TRACK call never blocks saving an order. I also added trackingCarrier, validated as a whole number and passed through syncTracking, so 17TRACK gets the courier when the user knows it.

- **File:** server/ordersRepo.js
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/1daf69a
- **What it does and why it is built this way:** All the SQL. Queries are parameterised and filtered by user_id, so users only see their own orders. Create and update use transactions so an order and its items save together or not at all.

- **File:** server/auth.js
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/1daf69a
- **What it does and why it is built this way:** It checks the login token with Supabase's public keys and sets req.userId. Checking locally is faster than asking Supabase every time.

### The AI-written part I understand best

- **File:** server/track17.js
- **Commit:** https://github.com/C1AUS-Y/ProxyPal/commit/501fad9
- **What it does and why I kept it:** It's the only file that talks to 17TRACK so the API key stays on the server. registerNumber tells 17TRACK to start tracking a number and getStatus gets its events. Both take an optional courier code now, because 17TRACK tracks better when it's told the courier instead of guessing. If 17TRACK rejects a number, the error includes its code so the caller can see why. getStatus combines the events from every provider, gives them readable texts or labels, and sorts them oldest first so the timeline reads in order. I kept it because the rest of my app only deals with my four statuses and a clean list of events.
