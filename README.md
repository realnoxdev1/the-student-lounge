# The Student Lounge

A hash-routed lounge for videos, games, and requests. The request form uses Supabase so visitor submissions are shared, while the private inbox is protected by authentication and database row-level security.

## Run locally

```bash
npm run check
npm start
```

Open http://localhost:4173.

## Publish on GitHub Pages

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.

GitHub will provide a URL like `https://your-username.github.io/the-student-lounge/`.

## Set up private video requests

The public request form is at `#request`; the owner inbox is at `#requests`. Set up Supabase once before publishing:

1. Create a Supabase project and note its **Project URL** and **anon/publishable key** from **Project Settings → API**. The browser key is public by design; never put a service-role key in the site.
2. In Supabase **Authentication**, create the site owner's email/password user. Use that exact email in the following steps.
3. Open `supabase-setup.sql`, replace `OWNER_EMAIL_HERE` with the owner's email, then run the SQL in the Supabase SQL Editor. This allows anyone to submit, but only the matching authenticated owner to read requests.
4. Put the Project URL, anon/publishable key, and owner's email into `supabase-config.js`.
5. Publish the site. Visitors submit through `#request`; sign in with the owner account at `#requests` to view submissions.

Requests are stored in Supabase, not in each visitor's browser. Row-level security is enforced by the database, so the inbox is not made private merely by hiding its link.