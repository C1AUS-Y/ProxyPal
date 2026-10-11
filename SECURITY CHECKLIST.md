# Security Checklist

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
|---|---|---|---|
| 1 | `.env` is gitignored and is not in the repository | Yes | `.gitignore` includes `.env` files and no `.env` file is committed. |
| 2 | A `.env.example` with placeholder values only is committed | Yes | `.env.example` files are included with example values. |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | Supabase and API credentials are kept in environment variables instead of the source code. |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | Yes | I searched the full Git history and found no secrets. |
| 5 | Any credential that was ever committed has been rotated | Yes | No credential remains exposed; any that was committed has been rotated. |
| 6 | Production credentials live only in my hosting provider's environment settings | Yes | Production credentials are set only in the hosting provider's environment settings. |

## GitHub Actions

| # | Check | Yes / No / N/A | Evidence |
|---|---|---|---|
| 7 | No secret value is written literally in any workflow YAML file | Yes | The workflow does not contain actual passwords or API keys. |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | N/A | The current workflow does not use GitHub Actions secrets. |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | Yes | I checked the latest Actions logs and no secret is printed. |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | Yes | I checked the final build artifact and it contains no `.env` or key files. |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | Yes | The workflow actions are pinned to commit SHAs. |
| 12 | Secret scanning and push protection are enabled on the repository | Yes | Secret scanning and push protection are turned on in the GitHub settings. |

## Database

| # | Check | Yes / No / N/A | Evidence |
|---|---|---|---|
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | The database queries use parameters instead of directly adding user input. |
| 14 | The database is not open to the whole internet, or is reachable only by the app | Yes | I verified the database network settings. |
| 15 | The database user the app connects as has only the permissions it needs | Yes | I checked the database user permissions. |
| 16 | Seed and sample data is invented, not real people's data | Yes | The app has no seed or sample data. The only data in it is what users enter themselves. |
| 17 | Debug, seed and reset routes are removed before going public | Yes | There are no public debug, seed, or reset routes in the app. |

## Access control

| # | Check | Yes / No / N/A | Evidence |
|---|---|---|---|
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | Supabase Auth is being used for user login. |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | Yes | Supabase RLS is set up and I tested it signed out. |
| 20 | If Zero Trust: access policy is configured. If an app password: credentials are private | N/A | ProxyPal uses Supabase Auth instead of Zero Trust or an app password. |
| 21 | The gate covers every route, including the ones that only change data | Yes | Login and route protection cover every route, including the ones that change data. |
| 22 | The credentials for the gate are environment variables, not in source | Yes | Supabase configuration is kept in environment variables. |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
|---|---|---|---|
| 23 | Input from the user is validated on the server, not only in the browser | Yes | Server-side validation is done in the Express API. |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | I tested the app for XSS. |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | The server returns a general error message instead of exposing the full error. |
| 26 | CORS is not a wildcard on routes that change data | Yes | CORS uses allowed origins instead of a wildcard. |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
|---|---|---|---|
| 27 | No student number, personal email, phone number or home address is in the repository or commit messages | Yes | I checked the repository and commit messages and did not find personal information. |
| 28 | No classmate's personal data is in the repository | Yes | The repository has no seed or sample data, so it contains no classmate's personal data. |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | The project uses npm packages and `node_modules` is ignored. |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | The frontend assets used in the project are mine, licensed, or properly credited. |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | I checked the repository after pushing the latest frontend update. |

## Anything I found and fixed

The checklist made me check how credentials and user data are handled before making the project public. I also restored `httpApi.js` after it was accidentally deleted and am fixing the Git history before the final push.
