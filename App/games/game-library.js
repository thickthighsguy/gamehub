(() => {
  const defaultAssetBaseUrl = "https://raw.githubusercontent.com/thickthighsguy/gameslist/main/";
  const assetBaseUrls = new Map([
    ["12 Mini Battles", "https://cdn.jsdelivr.net/gh/yrgen73/12@5043038783e6ce235c297b1a5b2982a643bea713/"],
    ["Crossy Road", "https://cdn.jsdelivr.net/gh/bubbls/youtube-playables@latest/crossy-road/"],
    ["Five Nights at Epstein's", "https://cdn.jsdelivr.net/gh/web-ports/fnae@c9c8b513a27155bf37c4ab3dee74e99b12b895ba/"],
    ["Five Nights at Freddy's", "https://cdn.jsdelivr.net/gh/genizy/fnaf@latest/1/"],
    ["Five Nights at Freddy's 2", "https://cdn.jsdelivr.net/gh/genizy/fnaf@latest/2/"],
    ["Five Nights at Freddy's 3", "https://cdn.jsdelivr.net/gh/genizy/fnaf@latest/3/"],
    ["Five Nights at Freddy's 4", "https://cdn.jsdelivr.net/gh/genizy/fnaf@latest/4/"],
    ["Minecraft 1.21.4", "https://cdn.jsdelivr.net/gh/genizy/mc@main/data/1.21.4/"],
    ["Ragdoll Hit", "https://rawcdn.githack.com/genizy/google-class/main/ragdoll-hit/"],
    ["Terraria", "https://cdn.jsdelivr.net/gh/web-ports/terraria@main/"],
    ["The Deadseat", "https://cdn.jsdelivr.net/gh/genizy/web-port@main/deadseat/"],
    ["War The Knights", "https://cdn.jsdelivr.net/gh/Sharon-Eva/home@0e6a3e7b393557c56f318855343173b63eac8c21/publ/js/"]
  ]);
  const gamesByPath = new Map();
  let archiveKey;
  let activeGame;
  let loadToken = 0;

  function decodeBase64(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  async function deriveArchiveKey(passphrase, archive) {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: decodeBase64(archive.salt),
        iterations: archive.iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  async function decryptGame(game, key) {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: decodeBase64(game.iv) },
      key,
      decodeBase64(game.data)
    );
    return new TextDecoder().decode(plaintext);
  }

  function withBaseUrl(source, game) {
    const directory = game.path.split("/").slice(0, -1).map(encodeURIComponent).join("/");
    const root = assetBaseUrls.get(game.name) || defaultAssetBaseUrl;
    const baseUrl = directory ? new URL(`${directory}/`, root).href : root;
    const baseTag = `<base href="${baseUrl}">`;
    const sourceWithBase = /<head\b[^>]*>/i.test(source)
      ? source.replace(/<head\b[^>]*>/i, (head) => `${head}\n${baseTag}`)
      : source.replace(/<html\b[^>]*>/i, (html) => `${html}<head>${baseTag}</head>`);

    return /^\s*<!doctype/i.test(sourceWithBase)
      ? sourceWithBase
      : `<!doctype html>\n${sourceWithBase}`;
  }

  function initialize() {
    const archive = window.GAME_ARCHIVE;
    const gameList = document.querySelector("#gameList");
    const gameListStatus = document.querySelector("#gameListStatus");
    const retryGames = document.querySelector("#retryGames");
    const gameDialog = document.querySelector("#gameDialog");
    const gamePlayerTitle = document.querySelector("#gamePlayerTitle");
    const gamePlayerStatus = document.querySelector("#gamePlayerStatus");
    const gameFrame = document.querySelector("#gameFrame");
    const gameUnlockForm = document.querySelector("#gameUnlockForm");
    const gamePassphrase = document.querySelector("#gamePassphrase");
    const gameUnlockButton = document.querySelector("#gameUnlockButton");
    const gameUnlockMessage = document.querySelector("#gameUnlockMessage");

    gameFrame.addEventListener("load", () => {
      if (gameDialog.open && activeGame && gameFrame.srcdoc) {
        gamePlayerStatus.hidden = true;
      }
    });

    function showUnlockError(message) {
      gamePlayerStatus.hidden = true;
      gameUnlockForm.hidden = false;
      gameUnlockMessage.textContent = message;
      gamePassphrase.focus();
    }

    async function showGame(game, key, token) {
      const source = await decryptGame(game, key);
      if (token !== loadToken || !gameDialog.open) return;

      gameFrame.srcdoc = withBaseUrl(source, game);
      gameFrame.hidden = false;
      gameUnlockForm.hidden = true;
      gamePlayerStatus.textContent = "Loading game...";
      gamePlayerStatus.hidden = false;
      gameUnlockMessage.textContent = "";
      gamePassphrase.value = "";
    }

    function openGame(game) {
      const token = ++loadToken;
      activeGame = game;
      gamePlayerTitle.textContent = game.name;
      gameFrame.srcdoc = "";
      gameFrame.hidden = true;
      gameUnlockMessage.textContent = "";
      gameUnlockForm.hidden = Boolean(archiveKey);
      gamePlayerStatus.hidden = true;
      gameDialog.showModal();

      if (!archiveKey) {
        gamePassphrase.focus();
        return;
      }

      gamePlayerStatus.textContent = "Loading game...";
      gamePlayerStatus.hidden = false;
      showGame(game, archiveKey, token).catch(() => {
        if (token !== loadToken || !gameDialog.open) return;
        archiveKey = undefined;
        showUnlockError("Could not unlock this game. Enter the passphrase again.");
      });
    }

    gameList.replaceChildren();
    gameList.setAttribute("aria-busy", "true");
    retryGames.hidden = true;

    if (!Array.isArray(archive?.games) || !archive.games.length) {
      gameListStatus.textContent = "The local game archive could not be loaded. Reload the page and try again.";
      retryGames.hidden = false;
      gameList.setAttribute("aria-busy", "false");
      return;
    }

    [...archive.games].sort((first, second) => first.path.localeCompare(second.path)).forEach((game) => {
      gamesByPath.set(game.path, game);
      const item = document.createElement("li");
      const button = document.createElement("button");
      const copy = document.createElement("span");
      const title = document.createElement("span");
      const path = document.createElement("span");
      const action = document.createElement("span");

      button.className = "game-item";
      button.type = "button";
      button.dataset.gamePath = game.path;
      copy.className = "game-item-copy";
      title.className = "game-item-title";
      title.textContent = game.name;
      path.className = "game-item-path";
      path.textContent = game.path;
      action.className = "game-item-action";
      action.setAttribute("aria-hidden", "true");
      action.textContent = "▶";
      copy.append(title, path);
      button.append(copy, action);
      item.append(button);
      gameList.append(item);
    });

    gameListStatus.textContent = `${archive.games.length} games stored in the local encrypted archive.`;
    gameListStatus.hidden = false;
    gameList.setAttribute("aria-busy", "false");

    gameList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-game-path]");
      const game = button && gamesByPath.get(button.dataset.gamePath);
      if (game) openGame(game);
    });

    retryGames.addEventListener("click", () => location.reload());
    document.querySelector("#gameClose").addEventListener("click", () => gameDialog.close());

    gameUnlockForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!activeGame) return;

      const game = activeGame;
      const token = ++loadToken;
      gameUnlockButton.disabled = true;
      gameUnlockMessage.textContent = "Unlocking...";
      try {
        const key = await deriveArchiveKey(gamePassphrase.value, archive);
        await showGame(game, key, token);
        if (token === loadToken && gameDialog.open) archiveKey = key;
      } catch {
        if (token === loadToken && gameDialog.open) {
          showUnlockError("Incorrect passphrase or game data could not be decrypted.");
          gamePassphrase.select();
        }
      } finally {
        gameUnlockButton.disabled = false;
      }
    });

    gameDialog.addEventListener("close", () => {
      loadToken += 1;
      activeGame = undefined;
      gameFrame.srcdoc = "";
      gameFrame.hidden = true;
      gameUnlockForm.reset();
      gameUnlockForm.hidden = true;
      gameUnlockMessage.textContent = "";
      gamePlayerStatus.hidden = true;
    });
  }

  window.GameLibrary = { initialize };
})();
