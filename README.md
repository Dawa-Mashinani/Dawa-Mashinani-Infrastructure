Site is live in my server, access it via: (https://dawa-dashinani-infrastructure.vercel.app/)

Below you get the instructions to set up and run it in your own server 
# Dawa-Mashinani-Infrastructure

A frontend/infrastructure repo bootstrapped with Vite + React + TypeScript and Tailwind. This README explains how to clone the repository from your GitHub organization, install dependencies, run the dev server, expose it with ngrok, and push the code to GitHub.

**Prerequisites**

- Node.js (LTS recommended, e.g. 18.x or newer)
- npm (or pnpm/yarn) — this guide uses `npm`
- Git
- Optional: `ngrok` (see below — you can also use `npx ngrok`)

**Repository**

You will need a repository created in your GitHub organization (for example `github.com/ORG/Dawa-Mashinani-Infrastructure`). If the repo doesn't exist yet, create it on GitHub first.


Clone the repo (straight URL for this project):

```bash
git clone https://github.com/Dawa-Mashinani/Dawa-Mashinani-Infrastructure.git
cd Dawa-Mashinani-Infrastructure
```

If you're moving this existing working tree into the freshly-created remote instead of cloning, run the push commands in the Push section below.

---

## Local setup

1. Install dependencies

```bash
npm install
```

Note: you may encounter dependency resolution conflicts (npm ERESOLVE) on some environments due to a dev dependency peer compatibility. If `npm install` fails with an ERESOLVE error, try either:

```bash
npm install --legacy-peer-deps
# or
npm install --force
```

If you prefer to keep stricter resolutions, you can also pin `vite` to a compatible version required by the conflicting package (for example `vite@7`) — but `--legacy-peer-deps` is the quickest workaround.

2. Environment variables

Copy and fill `.env` (if `.env.example` exists, copy that). Make sure to supply any API keys or Supabase values required by the app.

```bash
cp .env.example .env  # if a sample exists
# then edit .env with your values
```

3. Start the dev server

Open a terminal in the project root and run:

```bash
npm run dev
```

Vite will start the local dev server (default: http://localhost:5173). Keep this terminal open; the server must be running before you start `ngrok`.

---

## Expose the local server with ngrok

Run `ngrok` from a separate terminal (not the same one running the dev server). Example using `npx` (no global install required):

```bash
# in a new terminal, after npm run dev is running
npx ngrok http 5173
```

If you have an ngrok account and want a stable URL or to avoid re-auth each machine, set your auth token once and then start ngrok normally:

```bash
npx ngrok authtoken YOUR_NGROK_AUTHTOKEN
npx ngrok http 5173
```

Important: run the dev server first (`npm run dev`) — then open another terminal and start `ngrok`. Do not run both commands in the same terminal tab.

---

## Push the project to GitHub (example commands)


If this local folder is not already a git repo, initialize, commit, and push to the remote repository `https://github.com/Dawa-Mashinani/Dawa-Mashinani-Infrastructure.git`:

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Dawa-Mashinani/Dawa-Mashinani-Infrastructure.git
git push -u origin main
```

If the remote already exists and you only need to push local changes:

```bash
git add .
git commit -m "Describe changes"
git push
```

If you prefer SSH remote URLs, you can add the SSH remote instead:

```bash
git remote add origin git@github.com:Dawa-Mashinani/Dawa-Mashinani-Infrastructure.git
git push -u origin main
```

---

## Troubleshooting

- If `vite: command not found` appears when running `npm run dev`, make sure `node_modules` is installed in the project root and you run `npm run dev` from the project folder.
- If `npm install` fails with ERESOLVE, use `npm install --legacy-peer-deps` as shown above.
- If ngrok shows an error binding to the port, confirm the dev server is running on port `5173` (or pass the correct port to ngrok).

---

