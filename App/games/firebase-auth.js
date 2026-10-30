(() => {
  const authForm = document.querySelector("#authForm");
  const identityInput = document.querySelector("#identity");
  const passwordInput = document.querySelector("#password");
  const formTitle = document.querySelector("#formTitle");
  const formCaption = document.querySelector("#formCaption");
  const submitButton = document.querySelector("#submitButton");
  const switchPrompt = document.querySelector("#switchPrompt");
  const modeSwitch = document.querySelector("#modeSwitch");
  const formError = document.querySelector("#formError");
  const authScreen = document.querySelector("#authScreen");
  const appShell = document.querySelector("#appShell");
  let auth;
  let database;
  let isSignUp = false;

  function usernameToAuthEmail(username) {
    return `${username.trim().toLowerCase()}@users.gamehub.invalid`;
  }

  function configIsReady(config) {
    return config
      && config.apiKey
      && config.authDomain
      && config.databaseURL
      && config.projectId
      && config.appId
      && !config.apiKey.startsWith("YOUR_")
      && !config.appId.startsWith("YOUR_")
      && !config.authDomain.startsWith("YOUR_");
  }

  function authErrorMessage(error) {
    const messages = {
      "auth/email-already-in-use": "That username is already taken.",
      "auth/invalid-credential": "Username or password is incorrect.",
      "auth/invalid-email": "Enter a username using 3-24 letters, numbers, dots, underscores, or hyphens.",
      "auth/user-not-found": "Username or password is incorrect.",
      "auth/wrong-password": "Username or password is incorrect.",
      "auth/operation-not-allowed": "Enable Email/Password in Firebase Authentication first.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/weak-password": "Choose a password with at least 6 characters.",
      "auth/network-request-failed": "Could not reach Firebase. Check your internet connection."
    };
    if (error.code === "PERMISSION_DENIED" || /permission denied/i.test(error.message || "")) {
      return "Profile access was denied. Check the Realtime Database security rules.";
    }
    return messages[error.code] || "Firebase could not complete the request. Check the web config and try again.";
  }

  async function saveProfile(user, username) {
    const profile = database.ref(`users/${user.uid}`);
    await Promise.all([
      profile.child("username").set(username),
      profile.child("createdAt").set(firebase.database.ServerValue.TIMESTAMP)
    ]);
  }

  async function showSignedInUser(user) {
    if (!user) {
      authScreen.hidden = false;
      appShell.hidden = true;
      return;
    }

    let profile = {};
    try {
      const snapshot = await database.ref(`users/${user.uid}`).once("value");
      profile = snapshot.val() || {};
      formError.textContent = "";
    } catch (error) {
      formError.textContent = authErrorMessage(error);
    }

    const username = profile.username || user.displayName || "Player";
    document.querySelector("#sidebarUser").textContent = username;
    document.querySelector("#avatarInitial").textContent = username.charAt(0).toUpperCase();
    document.querySelector("#accountIdentity").textContent = username;
    authScreen.hidden = true;
    appShell.hidden = false;
  }

  modeSwitch.addEventListener("click", () => {
    isSignUp = !isSignUp;
    passwordInput.autocomplete = isSignUp ? "new-password" : "current-password";
    formTitle.textContent = isSignUp ? "Create your account" : "Welcome back";
    formCaption.textContent = isSignUp ? "A few details and you are good to go." : "Sign in to pick up where you left off.";
    submitButton.textContent = isSignUp ? "Create account" : "Log in";
    switchPrompt.textContent = isSignUp ? "Already have an account?" : "New to Game Hub?";
    modeSwitch.textContent = isSignUp ? "Log in" : "Create an account";
    formError.textContent = "";
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!authForm.reportValidity()) return;
    if (!auth || !database) {
      formError.textContent = "Add the Firebase web app settings and enable Email/Password sign-in first.";
      return;
    }

    const username = identityInput.value.trim().toLowerCase();
    const authEmail = usernameToAuthEmail(username);
    const password = passwordInput.value;
    submitButton.disabled = true;
    formError.textContent = "";

    try {
      if (isSignUp) {
        const credential = await auth.createUserWithEmailAndPassword(authEmail, password);
        await credential.user.updateProfile({ displayName: username });
        await saveProfile(credential.user, username);
      } else {
        await auth.signInWithEmailAndPassword(authEmail, password);
      }
    } catch (error) {
      formError.textContent = authErrorMessage(error);
    } finally {
      submitButton.disabled = false;
    }
  });

  document.querySelector("#signOutButton").addEventListener("click", async () => {
    try {
      await auth.signOut();
    } catch (error) {
      formError.textContent = authErrorMessage(error);
    }
  });

  const config = window.FIREBASE_CONFIG;
  if (!configIsReady(config) || !window.firebase) {
    formError.textContent = "Add the Firebase web app settings and enable Email/Password sign-in first.";
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(config);
    if (firebase.analytics && typeof firebase.analytics.isSupported === "function") {
      firebase.analytics.isSupported().then((isSupported) => {
        if (isSupported) firebase.analytics();
      }).catch((error) => {
        console.error("Firebase Analytics initialization failed.", error);
      });
    }
    auth = firebase.auth();
    database = firebase.database();
    auth.onAuthStateChanged((user) => {
      showSignedInUser(user).catch((error) => {
        formError.textContent = authErrorMessage(error);
      });
    });
  } catch (error) {
    formError.textContent = authErrorMessage(error);
  }
})();
