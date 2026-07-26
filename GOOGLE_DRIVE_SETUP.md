# Google Drive workspace setup

MyMain v1.6.1 can create reusable folder, starter-document, and clickable checklist workspaces in Google Drive.

1. In Google Cloud Console, create or select a project.
2. Enable the Google Drive API and Google Docs API.
3. Configure the OAuth consent screen.
4. Create an OAuth 2.0 Client ID for a Web application.
5. Add every origin where MyMain runs, such as `http://localhost:8000` and the GitHub Pages origin, to Authorized JavaScript origins.
6. Put the client ID in `google-config.js` as `window.MYMAIN_GOOGLE_CLIENT_ID`.

MyMain requests the `drive.file` scope. It can manage the folders and documents it creates, without requesting access to every file in the user's Drive. Never place a Google client secret in this browser application.
