# Supabase Backend Deployment Guide

## Project Details
- **Project ID**: `vqckqklspuikiehamoij`
- **Project URL**: `https://zenpiofjlwngvyebhpeq.supabase.co`

## Prerequisites
- Supabase CLI installed: `npm i -g supabase`
- Authenticated with Supabase: `supabase login`

## Deployment Steps

### 1. Link Project (One-time setup)
```bash
cd /path/to/Dawa-Mashinani-Infrastructure
supabase link --project-ref vqckqklspuikiehamoij
```

### 2. Deploy Database Migrations
```bash
supabase db push
```
This will:
- Create tables (users, notifications, vitals, etc.)
- Set up RLS policies
- Initialize demo data
- Apply all migrations from `supabase/migrations/`

**Migrations included:**
- `20260317012817_0f2cebbb-1ada-49d3-8cfb-1d8e9d34a5bd.sql` - Initial schema
- `20260319200000_ussd_jirani_infrastructure.sql` - Jirani/USSD setup
- `20260319210000_fix_rls_and_seed_demo.sql` - RLS policies & demo data
- `20260320010000_grant_anon_table_access.sql` - Anonymous access
- `20260322090000_no_login_demo_bootstrap.sql` - No-login demo bootstrap

### 3. Deploy Edge Functions
```bash
supabase functions deploy
```
This will deploy:
- `api-gateway` - Main API handler
- `ussd-webhook` - USSD/SMS webhook handler

**Function Configuration** (in `supabase/config.toml`):
```toml
[functions.ussd-webhook]
verify_jwt = false

[functions.api-gateway]
verify_jwt = false
```

### 4. Verify Deployment
Check Supabase Dashboard:
1. **Database**: Studio > SQL Editor - verify tables exist
2. **Functions**: Edge Functions section - verify deployed functions
3. **Logs**: Functions > Logs - check for any errors

## Environment Variables (Already Set)
Frontend connects via:
- `VITE_SUPABASE_URL`: `https://zenpiofjlwngvyebhpeq.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_q0FWrBV0owzcY6_MnkNEZA_hBUC23RO`

## Database Schema
Key tables:
- `profiles` - User profiles
- `notifications` - App notifications
- `vitals_history` - Health vitals data
- `jirani_requests` - Community health requests
- `ussd_sessions` - USSD session tracking

## API Endpoints
After deployment, these endpoints become available:
- `https://zenpiofjlwngvyebhpeq.supabase.co/functions/v1/api-gateway`
- `https://zenpiofjlwngvyebhpeq.supabase.co/functions/v1/ussd-webhook`

## Troubleshooting

### Migration conflicts
If migrations fail:
```bash
supabase migration list
supabase migration resolve <migration_id>
```

### Function deployment issues
Verify functions directory structure:
```
supabase/functions/
├── api-gateway/
│   └── index.ts
└── ussd-webhook/
    └── index.ts
```

### Re-deploy all
```bash
supabase db reset  # WARNING: Clears data
supabase db push
supabase functions deploy
```

## Monitoring
- **Dashboard**: https://supabase.com/dashboard
- **Real-time logs**: Functions > Logs
- **Database health**: Database > Logs & Connections

