# MyMain v1.7.0

A secure four-level tree workspace with on-demand Logs and Links, dated log entries, and email/password authentication.

MyMain can also create reusable Google Drive workspaces from Presentation, Research Project, Event, or Blank templates, populate starter Google Docs and spaced clickable project checklists, save friendly links beneath the selected node, and add a checklist preview node alongside Links. See `GOOGLE_DRIVE_SETUP.md` for Google authorization setup.

Project checklist items can be copied into the PM app as an undated project from the workspace or Project Checklist node actions menu.

## Setup

1. In the existing Supabase project, open the SQL Editor.
2. Run `supabase-schema.sql`. Run it again after pulling a version that includes database features such as embedded pages; the script is designed to update the existing schema safely.
3. Under Authentication > URL Configuration, allow:
   - `http://localhost:8000/`
   - `https://esemmelman.github.io/mymain/`
4. Serve this folder locally with `python -m http.server 8000`.
5. Open `http://localhost:8000/` and create an account.

Only the Supabase publishable key is used by the browser. Never add a secret or service-role key to this repository.
