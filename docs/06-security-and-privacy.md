# Security and privacy checklist

Work through this **before your first push**, and again before you submit. It is
short, none of it is exotic, and a grader can check most of it in two minutes.

Your repository is public, in your own account, and permanent. That is the point
of it, and it is also why this file exists.

## Before the first push

- [x] `.gitignore` includes `.env`, and `git check-ignore -v .env` confirms it
- [x] `git ls-files | grep -iE '\.env$|\.pem$|id_rsa'` prints nothing
- [x] `.env.example` is committed, with **placeholder** values only
- [x] No connection string, key or password anywhere in the repository,
      including in a screenshot
- [x] No `student.json`, and no name, student number or email of yours or anyone
      else's

Deleting a file later does **not** remove it from the history. If you commit a
credential, **rotate it first**, at the service, and clean up the history second.
The rotation is the fix; the cleanup is hygiene.

## The application

- [x] Every SQL query is parameterised. Values go in the array, never into the
      string. This is one line of defence you already know how to do
- [x] Input is validated **on the server**, not only in React. Length limits on
      every text field
- [x] `cors({ origin: allowedOrigins })` names your origins. Not `cors()` with no
      options, which allows every site on the internet
- [x] `NODE_ENV=production` on the host, and no stack trace in any response body
- [x] `helmet` installed, which is one line for several real protections
- [x] Anything that costs money or accepts a password is rate limited
- [x] Passwords, if you have accounts, are hashed with bcrypt and never logged
- [x] Every route that touches somebody's data has the ownership check **in the
      query**, as `AND user_id = $2`, not as an `if` above it
- [x] `npm audit` run once, and the easy fixes taken

```bash
npm install helmet
```

```js
import helmet from 'helmet'
app.use(helmet())
```

## Privacy

The half that matters more, because it is about other people.

- [x] **No real classmates' names, numbers, emails or photos**, anywhere. Not in
      seed data, not in screenshots, not in the demo video. Consent for a course
      project does not cover the next ten years of a public repository
- [x] Seed data is invented. Yours will be read
- [x] If real people tested your app, even three friends, their data is deleted
      before you submit
- [x] If your app collects anything about anyone, the app says what it collects
- [x] Any face in a screenshot is stock, generated, or yours

ProxyPal keeps an email address and the names people type in the recipient field, so it is covered by the Philippine Data Privacy Act. It collects only what the features need: each order belongs to one logged-in user, and the 17TRACK key and database login stay on the server.
