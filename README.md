# MyMain

A secure four-level tree workspace with on-demand Logs and Links, dated log entries, and email/password authentication.

## Setup

1. In the existing Supabase project, open the SQL Editor.
2. Run `supabase-schema.sql` once.
3. Under Authentication > URL Configuration, allow:
   - `http://localhost:8000/`
   - `https://esemmelman.github.io/mymain/`
4. Serve this folder locally with `python -m http.server 8000`.
5. Open `http://localhost:8000/` and create an account.

Only the Supabase publishable key is used by the browser. Never add a secret or service-role key to this repository.
