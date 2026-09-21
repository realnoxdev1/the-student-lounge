# The Student Lounge

A static, hash-routed lounge for videos, games, and requests. It needs no build step and is ready for GitHub Pages.

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

The form embed uses a Google Forms embed URL. If the form owner provides a different embed URL, replace the `src` in `script.js` while keeping the share link as the external fallback.