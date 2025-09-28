# Resumefy Backend

Supabase-powered backend for the Resumefy resume optimization platform.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start local development:**
   ```bash
   npm run supabase:start
   ```

   This will start the local Supabase stack (requires Docker Desktop).

3. **View local dashboard:**
   - API: http://localhost:54321
   - DB: http://localhost:54323
   - Studio: http://localhost:54323

## Database Schema

### Tables

- **email_captures**: Stores user email submissions and resume uploads
- **magic_links**: Manages secure authentication tokens

### Key Features

- Magic link authentication
- Resume upload tracking
- Job position preferences
- Privacy-focused (30-day auto-delete)

## Scripts

- `npm run supabase:start` - Start local development
- `npm run supabase:stop` - Stop local stack
- `npm run supabase:status` - Check status
- `npm run supabase:reset` - Reset database (runs migrations + seeds)
- `npm run supabase:deploy` - Deploy to production

## Production Setup

1. Create Supabase project at https://supabase.com
2. Copy project reference and update `supabase:link` script
3. Set up environment variables in `.env`
4. Run `npm run setup` to link project
5. Deploy with `npm run deploy:prod`