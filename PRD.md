# Product Requirements Document (PRD) - Goal Tracker

## 1. Executive Summary & Overview
The Goal Tracker is a modern, responsive, client-first web application designed to help users establish habits through **Daily Routines** and track time spent on specific projects or chores via a **Task Manager**. 

The core philosophy of the application is **KISS (Keep It Simple, Stupid)**: it offers high responsiveness, clean aesthetics, and offline-first capabilities. When online, the app seamlessly synchronizes state to a cloud database (Supabase) using a robust transaction queue.

---

## 2. Target Platforms & Responsiveness
The application must adapt itself beautifully to three main viewport categories:
* **PCs/Desktops (Large screens):** Side-by-side view featuring a sidebar navigation, a column for Daily Routines, and a column for the Task Manager and active timer.
* **Tablets (Medium screens):** Similar layout to desktop, adjusting column widths fluidly, collapsing the sidebar to an icon-only dock if necessary.
* **Android/Mobile (Small screens):** Single-hand optimized view with a fixed bottom-tab navigation bar to toggle between:
  1. **Routines:** Today's habits checklist.
  2. **Tasks:** Active tasks, milestones, and the active timer.
  3. **Analytics:** Heatmaps, daily stats, and logs.

---

## 3. Product Features & Functional Requirements

### 3.1 Daily Routines
* **Description:** Recurrent daily habits (e.g., "Read 10 pages", "Drink water") that users check off.
* **Requirements:**
  * Simple binary checklist (Completed / Uncompleted).
  * Automatically resets at midnight local timezone.
  * No time logging or timer for routines.
  * **Streaks:** Calculates and displays "Current Streak" and "Longest Streak".
  * **Consistency Heatmap:** A visual 30-day contribution map (similar to GitHub's contribution grid) in shades of light green/teal representing completion rates.

### 3.2 Task Manager & Time Logging
* **Description:** A tool to list, track, and log active one-off work sessions (Clockify-style).
* **Requirements:**
  * Tasks have three states: `Todo`, `In Progress`, and `Completed`.
  * Support for optional inline subtasks (milestones) per task.
  * **Stopwatch Timer:** Click "Play" to start recording time. Starting the timer automatically transitions the task state to `In Progress`. Click "Stop" to finish tracking, which creates a log entry.
  * **Manual Logging:** Users can manually input duration (hours/minutes) and details if they forgot to use the timer.
  * **Smart Transitions:** Marking a task as `Completed` automatically stops any running timer on it and saves the logged session.

### 3.3 User Authentication & Sessions
* **Requirements:**
  * Supported signup/login methods: **Google OAuth** and **Email OTP** (One-time password / Magic link).
  * **Developer Bypass / Guest Mode:** Local-only sandbox session so users (or developers) can test all dashboards and features instantly without completing Google Cloud or Supabase authentication setup.
  * Sessions must be persistent and not break down (tokens should auto-refresh).

### 3.4 Local-First State & Syncing
* **Requirements:**
  * Main state is read from and written to a client-side Zustand store.
  * The Zustand store is persisted in `LocalStorage` (or `IndexedDB`) for instantaneous app load.
  * When offline, all state-changing actions (creating a task, logging time, ticking a routine) are saved locally and appended to an **Action Queue**.
  * A background network listener monitors connection status. When online, the app replays the Action Queue to the Supabase Postgres database sequentially using a **Last-Write-Wins** policy.

---

## 4. Technical Stack
* **Framework:** Next.js (App Router, React)
* **Language:** TypeScript
* **State Management:** Zustand + Persist Middleware
* **Styling:** Vanilla CSS (CSS Modules) for maximum design customizability.
* **Database & Auth Backend:** Supabase (Postgres & GoTrue Auth)
* **Hosting:** Vercel (recommended)

---

## 5. Visual Design & Aesthetics
* **Theme:** Soft, high-end light theme.
* **Color Palette:**
  * Canvas/Background: Warm off-white / porcelain (`#fafafa` / `#fdfcfb`).
  * Text/Typography: Soft slate, charcoal, and dark gray for premium hierarchy.
  * Accents: Vibrant pastel gradients (emerald green for habits, electric indigo/violet for timers).
* **Styling details:** Use rounded corners (`border-radius: 12px` or higher), thin glassmorphic overlays (`backdrop-filter`), soft shadows, and micro-animations for hover and active states (transitions, scales).

---

## 6. Database Schema

### Profiles
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | References `auth.users` |
| `email` | text | User email |
| `created_at` | timestamp | Creation time |

### Routines
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Unique routine ID |
| `user_id` | uuid (FK) | References `profiles.id` |
| `title` | text | Routine title |
| `category` | text | E.g., 'Health', 'Learning' |
| `is_active` | boolean | Enabled status |
| `created_at` | timestamp | Creation time |

### Routine Logs
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Unique log ID |
| `routine_id` | uuid (FK) | References `routines.id` (cascade delete) |
| `user_id` | uuid (FK) | References `profiles.id` |
| `completed_date` | date | Date in YYYY-MM-DD |
| `created_at` | timestamp | Log creation timestamp |

### Tasks
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Unique task ID |
| `user_id` | uuid (FK) | References `profiles.id` |
| `title` | text | Task title |
| `description` | text | Detailed task info |
| `status` | text | 'todo', 'in_progress', 'completed' |
| `created_at` | timestamp | Creation time |

### Task Subtasks
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Unique subtask ID |
| `task_id` | uuid (FK) | References `tasks.id` (cascade delete) |
| `title` | text | Subtask description |
| `is_completed` | boolean | Completion flag |
| `created_at` | timestamp | Creation time |

### Task Time Logs
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Unique timing log ID |
| `task_id` | uuid (FK) | References `tasks.id` (cascade delete) |
| `user_id` | uuid (FK) | References `profiles.id` |
| `started_at` | timestamp | Time session started |
| `ended_at` | timestamp | Time session ended |
| `duration_seconds`| integer | Duration in seconds |
| `description` | text | Summary of work done |
| `created_at` | timestamp | Log insertion time |
