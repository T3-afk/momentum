MOMENTUM 15 CLOUD PWA
======================

WHAT THIS VERSION ADDS
----------------------
• Same Momentum save on Windows + iPhone.
• Email/password Momentum account.
• Automatic cloud sync using Supabase.
• Realtime updates when another device changes the save.
• Real Web Push notification support.
• Scheduled push jobs for Inbox reminders, Permanent Task deadlines,
  and Boss Project deadlines.
• Existing local/offline Momentum still works if cloud is unavailable.
• Manual Sync Now / Upload This Device / Download Cloud controls.
• Existing Export / Import backup remains available.

IMPORTANT
---------
This ZIP contains the application and backend CODE, but you still need your own
Supabase project because I cannot create an external account/project or private
keys on your behalf.

PUBLIC values (safe in cloud-config.js / a public GitHub Pages repository):
• Supabase Project URL
• Supabase publishable/anon key
• VAPID public key

PRIVATE values (NEVER put in GitHub/index.html/cloud-config.js):
• Supabase secret/service-role key
• VAPID private key
• CRON_SECRET


1. CREATE THE SUPABASE DATABASE
-------------------------------
On Windows:
1. Create a project at https://supabase.com
2. Open SQL Editor.
3. Run all of "supabase-setup.sql".
4. Open the project's API settings and copy the Project URL and
   Publishable key (or legacy anon key).


2. CREATE WEB PUSH KEYS
-----------------------
Install Node.js on Windows if needed, then run:

    npx -y web-push generate-vapid-keys

Save both keys somewhere private.
Only the PUBLIC key belongs in cloud-config.js.


3. CONFIGURE MOMENTUM
---------------------
Open cloud-config.js and fill in:

    supabaseUrl
    supabasePublishableKey
    vapidPublicKey

Upload the PWA files to your existing GitHub Pages Momentum repository.
Windows and iPhone should open the exact same HTTPS Momentum address.


4. DEPLOY THE PUSH EDGE FUNCTION
--------------------------------
The function is already included at:

    supabase/functions/send-momentum-push/index.ts

From this package folder on Windows:

    npx supabase login
    npx supabase link --project-ref YOUR_PROJECT_REF
    npx supabase functions deploy send-momentum-push --no-verify-jwt

Then set the private function secrets:

    npx supabase secrets set VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
    npx supabase secrets set VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
    npx supabase secrets set VAPID_SUBJECT="mailto:YOUR_EMAIL"
    npx supabase secrets set CRON_SECRET="YOUR_LONG_RANDOM_SECRET"

The VAPID public key set here must be the SAME public key in cloud-config.js.


5. SCHEDULE THE PUSH SENDER
---------------------------
Open "supabase-cron-template.sql".

Replace:
    YOUR_PROJECT_REF
    YOUR_LONG_RANDOM_CRON_SECRET

The cron secret must match the CRON_SECRET from step 4.

Run the edited SQL in Supabase SQL Editor.
It calls the notification sender every minute.


6. WINDOWS
----------
Open your hosted Momentum HTTPS URL.
Settings -> Cloud Sync + Notifications:
• Create Account
• Confirm your email if required
• Sign In
• Enable Notifications
• Allow notification permission


7. IPHONE
---------
• iOS/iPadOS 16.4 or newer
• Open Momentum's HTTPS page
• Add Momentum to Home Screen
• Launch Momentum FROM the Home Screen icon
• Sign into the same Momentum account as Windows
• Settings -> Enable Notifications
• Tap Allow

Apple requires the notification permission request to be triggered by user
interaction; Momentum's Enable Notifications button does exactly that.


WHAT SYNCS
----------
• Tasks / daily grades
• Rank / RP
• Recurring tasks
• Permanent tasks
• Boss projects
• Notes
• Reminders
• Achievements
• Focus-session statistics
• Theme / profile text settings
• YouTube soundtrack URL/settings

LOCAL TO EACH DEVICE
--------------------
• Uploaded soundtrack audio
• Profile picture
• Intro picture
• Uploaded intro background

Those are intentionally excluded from the shared JSON save because they can be
large. The existing Export Momentum Save feature remains the safest full backup.


FIRST SYNC
----------
Recommended:
1. Sign in FIRST on the device containing your real Momentum progress.
2. If your cloud save is empty, Momentum uploads that device.
3. Sign in on the second device.
4. The second device downloads the cloud save.

Sync uses a latest-save-wins strategy. For manual recovery you have:
• Sync Now
• Upload This Device
• Download Cloud


SECURITY
--------
supabase-setup.sql enables Row Level Security. A signed-in user can access only
rows whose user_id matches that account.

Passwords are managed by Supabase Auth and are not stored in the Momentum save.
Private VAPID and server keys stay in Supabase only.
