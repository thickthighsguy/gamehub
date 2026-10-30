# gamehub

## Universal Loader

Open the repository-root `universal-loader.html` to load the latest app from the `main` branch. The root `index.html` redirects there. On each page load it fetches the app HTML, stylesheet, and local scripts from GitHub with cache-busting requests, then assembles them in the current page. It does not require copying the app files into the root folder. Internet access is required.

## App layout

- `App/games/index.html` contains the app markup.
- `App/games/styles.css` contains the app styles.
- `App/games/app.js` handles navigation, tabs, and theme switching.
- `App/games/game-library.js` handles the local archive, passphrase, and game player.
- `App/games/firebase-auth.js` handles Firebase Authentication and per-user profile data.
- `App/games/firebase-config.js` contains the Firebase web app config.
- `App/games/archive.js` contains the encrypted game launchers.
- `App/games/database.rules.json` contains the recommended Realtime Database rules.

The scripts are regular local scripts rather than ES modules. Firebase Auth should be tested from `http://localhost` or HTTPS, not by opening the page directly with `file://`.

## Game archive

Browse loads the encrypted HTML launcher archive from `App/games/archive.js`; it does not call the GitHub API at runtime. The passphrase is checked by decrypting the selected entry in memory, and the derived key is kept only for the current page session. After unlock, the selected game HTML runs in a sandboxed frame, with relative resources resolved from its configured asset host.

The archive contains the HTML files from the configured games repository, not all of their game assets. Many launchers still load scripts, styles, or game data from external CDNs, so internet access is required and a CDN outage can prevent a game from starting.

The current shared four-digit passphrase is a temporary prototype gate, not strong protection: it can be guessed offline from the archive. A static app also cannot securely enforce subscription status. Per-user passphrases and subscription access need a trusted server to authenticate users and authorize access.

## Firebase login setup

1. In Firebase Console, add a Web app to project `games-c72c0` and enable **Authentication > Sign-in method > Email/Password**.
2. Add `localhost` under **Authentication > Settings > Authorized domains** for local testing.
3. The Web app config for project `games-c72c0` is already set in `App/games/firebase-config.js`. If you use another Firebase project, replace those values with its Web app config and keep `databaseURL` set to that project's Realtime Database URL.
4. Paste `App/games/database.rules.json` into **Realtime Database > Rules** and publish the rules.

The form accepts only a username and password. Firebase Email/Password Auth requires an email-shaped identifier, so the client maps each lowercase username to a reserved alias ending in `@users.gamehub.invalid`; it does not collect or store a user's email. This prevents a public username lookup table, but email verification and password-reset emails are unavailable. Authentication uses in-memory-only persistence, so users must sign in again after reloading or reopening the app. Firebase Analytics is not initialized, avoiding persistent analytics identifiers. Realtime Database stores only `users/{uid}/username` and `createdAt`; users can read their own profile, and writes to other paths (including subscription status) are denied by default.