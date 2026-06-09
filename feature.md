# Goal Tracker - Features & Technical Documentation

The Goal Tracker is a modern, high-performance, client-first web application designed to help users build consistent daily habits through **Daily Routines** and track active productivity via a **Task Manager & stopwatch timer**. 

The application is built around the **KISS (Keep It Simple, Stupid)** philosophy, prioritizing high responsiveness, a premium clay-porcelain visual aesthetic, and offline-first capabilities.

---

## 1. Visual Design & Layout Architecture

### 1.1 UI Theme & Aesthetics
* **Theme:** Soft, warm, high-end light theme.
* **Color Palette:**
  * **Canvas/Background:** Soft off-white / porcelain (`#fafafa` / `#fdfcfb`) for a premium ceramic feel.
  * **Text & Typography:** Soft slate and charcoal grey (`#1c2024` / `#4a4a4a`) for clear typography hierarchy.
  * **Accents:** Pastel-toned gradients (emerald green for habit completions, electric indigo/violet for active productivity and timers).
* **Styling details:** Backdrop-filters for blur overlays (`backdrop-filter: blur(12px)`), thin double borders, soft layered drop-shadows, and micro-animations for hover, click, and loading states.

### 1.2 Layout Responsiveness
The application adapts seamlessly across three main viewport sizes:
* **Large screens (Desktops):** Side-by-side multi-column dashboard. Features a clean sidebar navigation panel, a dedicated column for Daily Routines, and a column for the Task Manager (with time logs, subtask accordions, and active timers).
* **Medium screens (Tablets):** Fluid column wrapping that collapses the navigation sidebar to an icon-only dock to maximize the workspace.
* **Small screens (Mobiles):** Single-hand optimized layout. Uses a fixed sticky bottom navigation bar to transition between pages:
  1. **Routines:** Habit tracking checklist.
  2. **Tasks:** Tasks list, checklist milestones, manual logs, and timer.
  3. **Analytics:** Heatmaps, daily logs, and stats.

---

## 2. Core Features & Functional Specifications

### 2.1 Daily Routines (Habit Tracker)
* **Checkbox list:** Simple binary check/uncheck mechanism for daily routines (e.g. *"Drink 3L Water"*, *"Read 20 Pages"*).
* **Midnight Reset:** Checked routines automatically reset to unchecked state at local midnight.
* **Streak System:** Calculates and displays "Current Streak" and "Longest Streak" in days for each routine based on chronological log history.
* **Consistency Heatmap:** Visual 30-day grid (GitHub contribution style) representing routine completion rates. The teal intensity escalates depending on the percentage of routines completed on that day.

### 2.2 Task Manager & Stopwatch Timer
* **Task Lifecycle:** Support for task creation and status tracking across three states: `Todo` $\rightarrow$ `In Progress` $\rightarrow$ `Completed`.
* **Checklist Milestones (Subtasks):** Nested subtasks (milestones) per task, rendered as interactive checklist boxes inside collapsible cards.
* **Stopwatch Timer:** A play/pause stopwatch button per task. Starting a task's timer automatically updates the task status to `In Progress`.
* **Floating active timer HUD:** When a timer is running, a floating overlay HUD is visible at the bottom of the viewport showing live tickers, so users can pause, stop, or log the activity from anywhere.
* **Manual Time Logging:** Allows users to manually log worked sessions with a date picker, duration inputs, and session descriptions if they forgot to use the timer.
* **Smart Transitions:** Marking a task as `Completed` automatically pauses/stops any running timer on it and saves the logged session.

### 2.3 User Authentication & Sandboxed Guest Mode
* **Authentication:** Seamless user signup and login powered by **Supabase Auth** supporting:
  * **Google OAuth** login.
  * **Email OTP** passwordless login (Magic Link).
* **Developer Bypass / Guest Mode:** Local-only sandbox session that lets visitors bypass auth to test all dashboard features, heatmaps, and tasks instantly using local storage.

### 2.4 Offline-First Synchronization State
* **Zustand Local Cache:** Client state is managed and persisted instantly via a Zustand store using local storage persistence.
* **Sync Action Queue:** When offline, any data modifications (e.g., ticking a routine, creating a task, logging time) are captured as JSON actions and appended to a local `syncQueue`.
* **Replay Engine:** Once internet connectivity is restored, a background listener sequentially replays the `syncQueue` to Supabase using a **Last-Write-Wins** strategy to prevent database desync.

---

## 3. Premium AI Assistant

The AI Assistant is triggered globally via a floating action button (FAB) in the bottom-right of the viewport or via the mobile Bottom Nav. It opens a centered Q&A modal overlay.

### 3.1 Notion-Style Thread Q&A UI
* **Chat Sidebar:** Manage multiple chat threads (create new chats, load chat history, delete threads).
* **Natural messaging flow:** Slack/Notion-style messaging rows with avatars and aligned header rows.
* **Sparkle Thinking Indicator:** Dynamic pulsing loading state representing live AI calculation.

### 3.2 Thread-Level Token Observability
* **Accumulated Stats Badge:** A floating CPU icon displays token usage statistics (Input, Output, Reasoning, Total) aggregated across **all messages in the current thread**.
* **Observability Panel:** An analytics panel inside settings allows developers and users to filter and audit token consumption across individual threads or view global totals.

### 3.3 Dynamic Model Selector
An inline selector next to the send button lets users choose their model directly. It supports:
* **Gemini 3.5 Flash** (`gemini-3.5-flash`) — Standard agent workhorse.
* **Gemini 3.1 Pro** (`gemini-3.1-pro`) — Advanced reasoning model.
* **Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite`) — Fast and lightweight.
* **Gemini 2.5 Pro** (`gemini-2.5-pro`)
* **Gemini 2.5 Flash** (`gemini-2.5-flash`)

### 3.4 Direct REST Orchestration & Structured Actions
The store communicates directly with the Gemini API using standard REST calls, injecting your API key securely. It uses the `systemInstruction` block to pass the user's workspace state (routines, tasks, logs) and the `contents` block for the alternating chat history.

The AI parses user prompts and returns a JSON payload containing standard actions which the store executes atomically:
* `CREATE_TASK`: Instantly creates a task with title, clean description, subtasks (milestones), and initial time logs.
* `CREATE_ROUTINE`: Creates a new habit category.
* `CREATE_SUBTASK`: Appends subtask checklist items to an existing task ID.
* `CREATE_TIME_LOG`: Appends manual time log metrics to an existing task ID.

---

## 4. Database Schema Details

The database is built on Supabase PostgreSQL. Below is the structure of the active tables:

### 4.1 Profiles (`profiles`)
References the default Supabase auth user table.
* `id` (`uuid`, Primary Key) — References `auth.users.id`
* `email` (`text`) — User email address
* `created_at` (`timestamp`) — Date user signed up

### 4.2 Routines (`routines`)
Contains daily recurring habits.
* `id` (`uuid`, Primary Key) — Unique routine identifier
* `user_id` (`uuid`, Foreign Key) — References `profiles.id`
* `title` (`text`) — E.g. *" drink 3L water"*
* `category` (`text`) — E.g. *'Health'*, *'Learning'*, *'Fitness'*, *'Work'*, *'Mindset'*
* `is_active` (`boolean`) — Enabled/disabled state
* `created_at` (`timestamp`) — Creation timestamp

### 4.3 Routine Logs (`routine_logs`)
Stores completions for daily routines.
* `id` (`uuid`, Primary Key) — Unique log identifier
* `routine_id` (`uuid`, Foreign Key) — References `routines.id` (cascade delete)
* `user_id` (`uuid`, Foreign Key) — References `profiles.id`
* `completed_date` (`date`) — Completion date formatted as `YYYY-MM-DD`
* `created_at` (`timestamp`) — Log submission timestamp

### 4.4 Tasks (`tasks`)
Tracks active chores, projects, and work tasks.
* `id` (`uuid`, Primary Key) — Unique task identifier
* `user_id` (`uuid`, Foreign Key) — References `profiles.id`
* `title` (`text`) — Task title
* `description` (`text`) — Clean detailed text
* `status` (`text`) — State: *'todo'*, *'in_progress'*, *'completed'*
* `created_at` (`timestamp`) — Creation timestamp

### 4.5 Task Subtasks (`task_subtasks`)
Checklist milestones nested within a task.
* `id` (`uuid`, Primary Key) — Unique subtask identifier
* `task_id` (`uuid`, Foreign Key) — References `tasks.id` (cascade delete)
* `title` (`text`) — Milestone name
* `is_completed` (`boolean`) — Checked status
* `created_at` (`timestamp`) — Creation timestamp

### 4.6 Task Time Logs (`task_time_logs`)
Timing details logged per task.
* `id` (`uuid`, Primary Key) — Unique log identifier
* `task_id` (`uuid`, Foreign Key) — References `tasks.id` (cascade delete)
* `user_id` (`uuid`, Foreign Key) — References `profiles.id`
* `started_at` (`timestamp`) — Timing session start time
* `ended_at` (`timestamp`) — Timing session end time
* `duration_seconds` (`integer`) — Total session seconds
* `description` (`text`) — What was achieved in the session
* `created_at` (`timestamp`) — Log insertion timestamp

### 4.7 Chat Threads (`chat_threads`)
Syncs AI conversation threads.
* `id` (`uuid`, Primary Key) — Unique thread identifier
* `user_id` (`uuid`, Foreign Key) — References `profiles.id` (cascade delete)
* `title` (`text`) — E.g. *"Play valorant"* or *"New Chat"*
* `created_at` (`timestamp`) — Thread creation timestamp

### 4.8 Chat Messages (`chat_messages`)
Syncs chat messages inside threads.
* `id` (`uuid`, Primary Key) — Unique message identifier
* `thread_id` (`uuid`, Foreign Key) — References `chat_threads.id` (cascade delete)
* `user_id` (`uuid`, Foreign Key) — References `profiles.id` (cascade delete)
* `sender` (`text`) — Message sender: *'user'* or *'agent'*
* `text` (`text`) — Message text body
* `token_usage` (`jsonb`) — JSON payload containing `input`, `output`, `reasoning`, and `total` tokens
* `created_at` (`timestamp`) — Message timestamp
