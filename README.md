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

## Set up accounts and Pro access

The **Account** page uses Supabase Auth. Logged-out visitors are invited to sign up or sign in every time they visit; signed-in visitors do not see that prompt. Users can use email/password or Google OAuth. Supabase keeps the session, and Pro access is stored against their Auth user ID in a database table (not browser storage). Browser clients can read only their own Pro status and cannot grant it. Payments are not included; the owner awards Pro through the SQL Editor. Inbox access is separate and restricted to the Developer accounts below.

Run the full `supabase-setup.sql` after updating the site to enable profile role tags, image uploads, and managed page media. Members can upload avatars, and active Pro members can also upload a banner image instead of using a preset or URL. Images must be JPEG, PNG, GIF, WebP, or AVIF and under 5 MB; Storage policies limit uploads to each account’s own folder. Accounts for `kbotros2027@staschool.us` and `karaas.botros2@gmail.com` receive the **Developer** tag; `aluckay2027@staschool.us` receives **Helper**. These labels are derived from the authenticated account email and shown on the account profile and chat messages. Helpers and Developers can open **Manage pages** to add/remove video and game embeds for each person; only Developers can access the request inbox.

For Google sign-in, enable the Google provider in Supabase **Authentication → Providers → Google**. Create a Google OAuth client in Google Cloud Console, add Supabase's callback URL (`https://zprkilbqwbckxbvojvkc.supabase.co/auth/v1/callback`) as an authorized redirect URI in Google, then paste the Google client ID and secret into the Supabase provider settings and enable the provider. In Supabase **Authentication → URL Configuration**, set the site URL to `https://realnoxdev1.github.io/the-student-lounge/` and add `https://realnoxdev1.github.io/the-student-lounge/**` and `http://localhost:4173/**` to allowed redirect URLs. Run the full `supabase-setup.sql` in the SQL Editor to apply the database access policies. To grant a Helper Pro themes, first have the Helper create an account, then replace `HELPER_EMAIL_HERE` in the Pro entitlement SQL example at the bottom of that file and run it. Helpers do not get inbox access. Never put a Supabase service-role key or Google client secret in the website.

## Set up private video requests

The public request form is at `#request`; the owner inbox is at `#requests`. Set up Supabase once before publishing:

1. Create a Supabase project and note its **Project URL** and **anon/publishable key** from **Project Settings → API**. The browser key is public by design; never put a service-role key in the site.
2. In Supabase **Authentication**, create the site owner's email/password user. Use that exact email in the following steps.
3. Run the entire latest `supabase-setup.sql` in the Supabase SQL Editor. It creates or repairs the table (including adding missing `name` and `item` columns), allows anyone to submit, and grants inbox reads to the two Developer emails listed above by checking the signed-in Auth account. It also creates `lounge_media` and imports the current videos and games so staff can manage all existing page content. Re-running the setup will not restore media that a Helper or Developer has removed.
4. Put the Project URL, anon/publishable key, and owner's email into `supabase-config.js`.
5. Publish the site. Visitors submit through `#request`; `kbotros2027@staschool.us` or `karaas.botros2@gmail.com` must sign in at **Account** before opening `#requests`. `aluckay2027@staschool.us` and Developers can open `#manage-media`; other accounts are redirected away, and Supabase row-level security blocks unauthorized reads or edits.

Requests are stored in Supabase, not in each visitor's browser. Row-level security is enforced by the database, so the inbox is not made private merely by hiding its link.