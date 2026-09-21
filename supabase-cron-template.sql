-- MOMENTUM 15 — PUSH CRON SETUP
-- Replace:
--   YOUR_PROJECT_REF
--   YOUR_LONG_RANDOM_CRON_SECRET
--
-- The cron secret MUST exactly match the CRON_SECRET Edge Function secret.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists supabase_vault with schema vault;

select vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-momentum-push',
  'momentum_push_url'
);

select vault.create_secret(
  'YOUR_LONG_RANDOM_CRON_SECRET',
  'momentum_push_cron_secret'
);

select cron.schedule(
  'momentum-push-every-minute',
  '* * * * *',
  $$
    select net.http_post(
      url := (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'momentum_push_url' limit 1
      ),
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-cron-secret',(
          select decrypted_secret from vault.decrypted_secrets
          where name = 'momentum_push_cron_secret' limit 1
        )
      ),
      body := jsonb_build_object('source','momentum-cron'),
      timeout_milliseconds := 10000
    );
  $$
);
