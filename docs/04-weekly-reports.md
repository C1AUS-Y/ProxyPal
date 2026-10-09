# Weekly reports
 Weeks 1 and 2 are copied from the project reports I submitted in Canvas.

---

## Week of 2026-09-23 (Week 1)

**Done.**
- Identified a global shipping/tracking API that covers most of the couriers used by the proxy services and sellers I order from across different countries (specifically China, US, Japan, and Hong Kong).
- Decided on Supabase (PostgreSQL) as the database for better management, since the app needs to persist orders, items, user information, and payments rather than just hold them in memory.
- Sketched a desktop wireframe to go with the mobile wireframe already developed, so both breakpoints are planned before I start building.
- Initialized dependencies (React, Vite, Tailwind, Supabase).

**Why.** I need a shipping API early because tracking is one of the core features of ProxyPal and I didn't really want to build the Order Detail screen around fake data that wouldn't reflect how real tracking updates arrive. I have used Supabase for previous projects and its build on PostgreSQL which was convenient. I had also finished the Desktop wireframe since only the mobile version was created. Locking in dependencies this week means every screen I build from here on uses the same stack instead of me switching tools mid-project, which prevents confusion on my end.

**Stuck.**
- Finding a reliable, affordable shipping API took longer than I expected, as most of the available ones only cover major couriers, and a lot of the couriers my proxy orders actually go through are more diverse and niche, so I had to dig though a few options before settling on one that had reasonable coverage.
- Debated on whether I'll do mobile application or just stick to webapp. Decided to stick with the webapp as per subject.

**Hours.** 6 to 10 hours (estimated afterwards).

**Next.**
- First test whether the API is compatible and working by coding a simple script before actual development of the webapp.
- Set up Database schema.
- Wire up the shipping API and figure out how tracking status maps to the webapp's status labels.
- Build the actual components of the design system and each screen from those components.
- Make everything responsive per desktop and mobile wireframes.
- Test the full features and performance of the app.

---

## Week of 2026-09-28 (Week 2)

**Done.**
- Built the front end from the design system: atoms, molecules and organisms, all screens, and routing between them. It currently runs on mock data stored in the browser.
- Set up Supabase (PostgreSQL) with orders, items, payments and profiles tables, Supabase Auth for login, and row-level security so each user only sees their own data.
- Made the remaining balance a value computed in the database from items and payments, instead of stored or calculated in the web app so there's no out of sync risks.
- Created a 17TRACK account and API key for shipment tracking. Testing and implementation are planned in the next few days.
- Reviewed the project repo's requirements and decided to build the Express API between the client and Supabase, so the finals submission has all three requirements met instead of relying on Supabase for everything.

**Why.** The front end needed to exist before real data could be wired in which I realized this week, and building it from the design system keeps every screen consistent. Computing the balance in the database removes the sync risk I flagged in Week 1. I'm using Supabase Auth so I don't handle passwords myself, and the tracking API key will stay on the Express server so it never reaches the browser.

**Stuck.**
- My wireframes had no Login/Sign up screen, even though Supabase Auth means the app needs one. I'm adding it to the screen map and building it next.
- The front end works but looks plain compared to what I want. I'm planning a visual polish pass so it's more modern and easier on the eyes, while keeping to the design system.
- Tailwind styles weren't showing at first. The classes had no effect until I added the PostCSS and Tailwind config files and pointed content at my src files.
- The 17TRACK integration is still in progress. My account is limited to 200 tracked parcels, so I'll register each tracking number only once when an order is saved instead of on every page load, and I'm starting with the API before considering webhooks.

**Hours.** 15 to 25 hours (estimated afterwards).

**Next.**
- Write the Express API for orders, items and payments, with token verification and ownership checks in every query.
- Add a Login/Sign up screen and protect routes.
- Restore the mock/real API switch in the client and connect it to the API.
- Integrate 17TRACK on the server and map its statuses to my labels (Ordered, Shipped, In Transit, Delivered).
- Deploy the client and API.
- Make everything responsive per desktop and mobile wireframes.
- Test the full features and performance of the app.

---

## Week of 2026-10-05 (Week 3)

**Done.**
- The deployed app now works end to end: the client is on GitHub Pages and the Express API is on Render. Login, orders, items, payments and tracking all work against the real Supabase database.
- The API checks the login token on every request and only returns the logged-in user's own data.
- Tracking: the app works out the courier from the tracking number, or suggests couriers when it isn't sure. Status updates also arrive through a Supabase Edge Function that receives 17TRACK's webhooks.
- Demo mode is switched off. The live site only uses real accounts.
- Wrote the proposal, mockup and design system docs, and added the `.env.example` files back.

**Stuck.**
- The free tiers go to sleep. Render sleeps when idle, so the first request is slow. Supabase pauses a free project after about a week without activity.

**Hours.** 20 to 30 hours (estimated afterwards).

**Next.**
- Fill in `AI-USAGE.md` and write the part of the code I wrote myself (mostly backend).
- Record the demo video and finish the security checklist.
