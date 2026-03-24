# Deployment Guide for Dawa Mashinani

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (vercel.com)
- Project linked to GitHub repository

### Deployment Steps

1. **Install Vercel CLI** (optional, for local testing):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Environment Variables** (set in Vercel Dashboard):
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Auto-Deployment
Once connected to GitHub, Vercel will automatically deploy on every push to `main` branch.

---

## Backend Deployment (Supabase)

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Logged in to Supabase: `supabase login`

### Deployment Steps

1. **Link to Supabase Project**:
   ```bash
   cd /path/to/project
   supabase link --project-ref vqckqklspuikiehamoij
   ```

2. **Deploy Migrations**:
   ```bash
   supabase db push
   ```

3. **Deploy Functions** (Edge Functions):
   ```bash
   supabase functions deploy
   ```

4. **Verify Deployment**:
   - Check Supabase Dashboard: Database > Migrations
   - Check Functions: Edge Functions section

---

## GitHub Actions (Optional CI/CD)

Create `.github/workflows/deploy.yml` for automated deployments.

---

## Monitoring & Logs

### Vercel
- Dashboard: vercel.com
- Real-time logs: `vercel logs`

### Supabase
- Dashboard: supabase.com/projects
- Database logs: Studio > Logs
- Function logs: Edge Functions > Logs

