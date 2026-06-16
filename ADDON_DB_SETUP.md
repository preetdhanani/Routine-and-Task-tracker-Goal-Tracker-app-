# Supabase Database Migration – Phase 2 Improvements

To support the new Goal entity, task deadlines, priority levels, and task dependencies on your Supabase backend, please copy the SQL queries below and run them in the **SQL Editor** of your Supabase dashboard:

```sql
-- 1. Extend Tasks Table with Phase 2 fields
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
ADD COLUMN IF NOT EXISTS depends_on_task_id TEXT REFERENCES public.tasks(id) ON DELETE SET NULL;

-- 2. Create Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for Goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create Policies for Goals Table
CREATE POLICY "Users can insert their own goals" 
ON public.goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own goals" 
ON public.goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Extend Routines Table with schedule column
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS schedule INTEGER[] DEFAULT '{0,1,2,3,4,5,6}';
```

### Steps to Run:
1. Log in to your **Supabase Console** (https://supabase.com/dashboard).
2. Go to your project.
3. Click on the **SQL Editor** in the left menu.
4. Click **New Query**, paste the code block above, and click **Run**.
