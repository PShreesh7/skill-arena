

# Fix AI Coach Unauthorized Access

## Problem
The AI Coach page sends the Supabase anon key (`VITE_SUPABASE_PUBLISHABLE_KEY`) as the Authorization header. However, the edge function validates this as a user JWT using `getClaims()`, which fails because the anon key is not a user session token.

## Solution
Update the frontend (`src/pages/AICoach.tsx`) to retrieve the logged-in user's actual session token and send that instead.

## Changes

### `src/pages/AICoach.tsx`

1. Import the Supabase client:
   ```typescript
   import { supabase } from '@/integrations/supabase/client';
   ```

2. Update the `streamChat` function to fetch the real user session token before making the request:
   - Call `supabase.auth.getSession()` to get the current session
   - If no session exists, throw an error prompting the user to log in
   - Use `session.access_token` in the Authorization header instead of the anon key

### No backend changes needed
The edge function (`supabase/functions/ai-coach/index.ts`) already correctly validates JWTs using `getClaims()`. The only issue is on the client side sending the wrong token.

