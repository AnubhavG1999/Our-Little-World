# Static site on GitHub Pages, shared data in Firebase on the free plan

The game must cost nothing and need no credit card, so it is a static page on GitHub Pages with Firebase (Spark plan) for Google sign-in and shared data. Free GitHub Pages requires a public repo, so the game's code and art are public; privacy comes from Firestore security rules that admit only the two players' Google accounts. Those rules contain both email addresses, so `firestore.rules` is deliberately kept out of the repo and pasted into the Firebase console by hand.

## Considered Options

- **Firebase Hosting** instead of GitHub Pages — no public repo, but the owner wanted GitHub Pages.
- **No sign-in** — simpler, but anyone who found the URL could read the Letters.
