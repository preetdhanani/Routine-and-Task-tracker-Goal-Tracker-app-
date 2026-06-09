# Google Login & Cloud Sync Setup Guide

This guide walks you through configuring **Google OAuth** and **Email OTP** for the Goal Tracker app using **Supabase**.

---

## Step 1: Create a Supabase Project (If you haven't already)
1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New Project** and select/create an Organization.
3. Choose a Project Name (e.g., `Goal Tracker`), set a Database Password, choose a server region close to you, and click **Create New Project**.
4. Once the project is provisioned:
   * Go to **Project Settings** (Gear icon) -> **API**.
   * Copy the **Project URL** and paste it as `NEXT_PUBLIC_SUPABASE_URL` in your [.env.local](file:///S:/study/data%20scientist/projects/Goal%20Tracker/.env.local) file.
   * Copy the **anon / public** API Key and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your [.env.local](file:///S:/study/data%20scientist/projects/Goal%20Tracker/.env.local) file.

---

## Step 2: Configure Google Cloud Developer Console
To enable Google Login, you need to register the Goal Tracker with Google to get an OAuth client credential.

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar, click **New Project**, name it (e.g., `Goal Tracker Auth`), and click **Create**.
3. Search for **OAuth consent screen** in the search bar and select it.
4. Select **External** (if you want any Google Account to be able to sign in) and click **Create**.
5. Fill out the required App Details:
   * **App name:** `Goal Tracker`
   * **User support email:** Your email address
   * **Developer contact information:** Your email address
   * Click **Save and Continue** (skip Scopes and Test Users by clicking through).
6. Go back to the **OAuth consent screen** page and click **Publish App** under "Publishing status" to make it live.
7. Search for **Credentials** in the search bar.
8. Click **Create Credentials** -> **OAuth client ID**.
9. Select **Application type:** `Web application`.
10. Set the following fields:
    * **Name:** `Goal Tracker Client`
    * **Authorized JavaScript origins:**
      * Add URI: `http://localhost:3000` (for local development)
      * *(Optional)* Add your Vercel deployment URL if hosting online.
    * **Authorized redirect URIs:**
      * Go to the **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google**.
      * Copy the **Redirect URI** displayed there (it looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
      * Paste it into the Google Console's **Authorized redirect URIs** list.
11. Click **Create**.
12. Copy the generated **Client ID** and **Client Secret**.

---

## Step 3: Enable Google Provider in Supabase
1. Go back to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** -> **Providers** -> **Google**.
3. Toggle the **Enable Google Provider** switch.
4. Paste the **Client ID** and **Client Secret** you copied from the Google Cloud Console.
5. Click **Save**.

---

## Step 4: Restart Your Next.js Dev Server
1. Stop your running development server in your terminal (`Ctrl + C`).
2. Run `npm run dev` again to load the new `.env.local` variables.
3. Open `http://localhost:3000`. You will see the login screen automatically update to display the Google and Email login inputs, replacing the developer warning.
4. Try clicking **Sign in with Google**! It will redirect you to Google's sign-in screen, sign you in, create a user account in your Supabase DB, and sync your state.
