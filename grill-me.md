# Grill-Me Session: Goal Tracker Q&A Transcript

This document records the exact interview and design decisions reached during our `/grill-me` session on June 8, 2026.

---

### **Q1: Data Persistence & Syncing**
* **Question:** Do you need automatic real-time sync between your PC and Android phone (which requires a backend database and login), or is offline-first local storage with manual JSON backup/restore sufficient for your needs?
* **Answer:** Cloud-synced online database with Google/Email OTP login. Local-first caching/database that syncs with the online database seamlessly, and the sync should be persistent and robust (not breaking down).

---

### **Q2: Sync Architecture & Conflict Resolution**
* **Question:** For conflict resolution when syncing offline edits back to the cloud, is a "Last-Write-Wins" policy (the most recent update simply overwrites the database) sufficient, or do we need specific merge logic for when you modify the same routine/task on two different devices while offline?
* **Answer:** Kept simple (KISS). Use Zustand + LocalStorage queue for local-first state. When offline, we write actions to a local queue. When online, we play them back to Supabase. Last-Write-Wins conflict resolution is sufficient.

---

### **Q3: Time Tracking Mechanics**
* **Question:** Should the timing log also record a daily "total time active" summary automatically, or is a simple chronological list of duration logs per task/routine enough for your tracking dashboards?
* **Answer:** A hybrid approach (like Clockify) for Tasks (stopwatch timer + manual entry). Daily Routines are strictly binary checkboxes (Checked/Unchecked) to check compliance; they do **not** have active time logging or start/stop timers.

---

### **Q4: Responsive Layout & Aesthetics**
* **Question:** For the mobile view, do you prefer a swipeable tab system (swiping left/right to switch between Daily Routines and Tasks), or a fixed bottom-navigation bar where you explicitly tap the icons?
* **Answer:** Fixed bottom-navigation bar. Detailed layout preferences:
  1. **Desktop/Tablet Layout:** Left sidebar navigation. Main content area uses a split-screen layout: left column for "Daily Routines", right column for "Task Manager" and the active timer.
  2. **Mobile (Android) Layout:** Bottom-tab navigation bar for simple one-handed navigation.
  3. **White Aesthetics:** Soft, premium light theme. Warm porcelain/clay off-white backgrounds, soft gray borders, glassmorphic card overlays, and subtle colored gradients.

---

### **Q5: Authentication & Initial Testing**
* **Question:** Would you like to start with this "Developer Bypass / Guest Mode" enabled so you can test the UI and features immediately, or do you want to set up your Supabase project and Google Cloud credentials first before we write any code?
* **Answer:** Start with a "Developer Bypass / Guest Mode" enabled so the application is immediately testable and functional locally, with credentials loaded via environment variables when ready.

---

### **Q6: Daily Routine History & Streaks**
* **Question:** Do you want to include this GitHub-style consistency heatmap and dynamic streak calculator for your daily routines, or should we keep the routines as a simple daily checklist with no history?
* **Answer:** Include the GitHub-style consistency heatmap (shades of light green/teal) showing progress over the past 30 days, along with current/longest streak calculators.

---

### **Q7: Task Status Flow & Timer Integration**
* **Question:** Does this automatic timer-to-status transition (Start Timer → In Progress, Complete Task → Stop Timer) align with how you want to work, or would you prefer complete manual control over task statuses?
* **Answer:** Connected flow:
  - Starting a timer on a task transitions its status to `In Progress`.
  - Completing a task stops any active timer and prompts to log that time session.
  - Tasks support optional checklists/milestones.

---

### **Q8: Codebase Architecture**
* **Question:** Are you comfortable using TypeScript for type safety, or do you prefer to write the project in standard JavaScript?
* **Answer:** Next.js App Router, TypeScript, and CSS Modules (Vanilla CSS).

---

### **Q9: Progressive Web App (PWA) Support**
* **Question:** Would you like us to configure the application as an installable Progressive Web App (PWA) for Android, or is a standard mobile browser site sufficient?
* **Answer:** Standard mobile web app is fine (no PWA manifest/service worker caching needed for launch; keeps it KISS).
