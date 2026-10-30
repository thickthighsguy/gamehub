# gamehub

## App layout

- `App/games/index.html` contains the app markup.
- `App/games/styles.css` contains the app styles.
- `App/games/app.js` handles sign-in, navigation, tabs, and theme switching.
- `App/games/game-library.js` handles the local archive, passphrase, and game player.
- `App/games/archive.js` contains the encrypted game launchers.

The scripts are regular local scripts rather than ES modules so the app can still be opened directly with `file://`.

## Game archive

Browse loads the encrypted HTML launcher archive from `App/games/archive.js`; it does not call the GitHub API at runtime. Games are decrypted in memory after the passphrase is entered, and the derived key is kept only for the current page session.

The archive contains the HTML files from the configured games repository, not all of their game assets. Many launchers still load scripts, styles, or game data from external CDNs, so internet access is required and a CDN outage can prevent a game from starting.

The current shared four-digit passphrase is a temporary prototype gate, not strong protection: it can be guessed offline from the archive. A static app also cannot securely enforce subscription status. Per-user passphrases and subscription access need a trusted server to authenticate users and authorize access.