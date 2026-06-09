-- Drop existing tables to recreate them with TEXT IDs (fully compatible with t-, r-, st- prefixes)
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_threads;
DROP TABLE IF EXISTS public.task_time_logs;
DROP TABLE IF EXISTS public.task_subtasks;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.routine_logs;
DROP TABLE IF EXISTS public.routines;
DROP TABLE IF EXISTS public.goals;
DROP TABLE IF EXISTS public.profiles;

-- 1. Create Profiles Table & Sync Triggers
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Create Goals Table (using TEXT primary key to match client g-prefix IDs)
CREATE TABLE public.goals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- 3. Create Routines Table (using TEXT primary key to match client r-prefix IDs)
CREATE TABLE public.routines (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own routines" ON public.routines FOR ALL USING (auth.uid() = user_id);

-- 4. Create Routine Logs Table (using TEXT primary key to match client rl-prefix IDs)
CREATE TABLE public.routine_logs (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own routine logs" ON public.routine_logs FOR ALL USING (auth.uid() = user_id);

-- 5. Create Tasks Table (using TEXT primary key to match client t-prefix IDs)
CREATE TABLE public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    status TEXT DEFAULT 'todo' NOT NULL CHECK (status IN ('todo', 'in_progress', 'completed')),
    due_date DATE,
    priority TEXT DEFAULT 'MEDIUM' NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- 6. Create Task Subtasks Table (using TEXT primary key to match client st-prefix IDs)
CREATE TABLE public.task_subtasks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage subtasks of their own tasks" ON public.task_subtasks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.tasks 
        WHERE tasks.id = task_subtasks.task_id AND tasks.user_id = auth.uid()
    )
);

-- 7. Create Task Time Logs Table (using TEXT primary key to match client tl-prefix IDs)
CREATE TABLE public.task_time_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.task_time_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own task time logs" ON public.task_time_logs FOR ALL USING (auth.uid() = user_id);

-- 8. Create Chat Threads Table (using TEXT primary key to match welcome-thread and ch-prefix IDs)
CREATE TABLE public.chat_threads (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chat threads" ON public.chat_threads FOR ALL USING (auth.uid() = user_id);

-- 9. Create Chat Messages Table (using TEXT primary key to match welcome-msg and prefix IDs)
CREATE TABLE public.chat_messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'agent')),
    text TEXT NOT NULL,
    token_usage JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);
