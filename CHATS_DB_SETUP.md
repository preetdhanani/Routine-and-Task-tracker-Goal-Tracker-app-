# Supabase Setup for AI Chat Synchronization

To synchronize your AI Assistant chat history across platforms, you need to create two new tables in your Supabase database. 

Please copy the SQL below and run it in the **SQL Editor** of your Supabase Dashboard:

```sql
-- 1. Create Chat Threads Table
CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Chat Threads
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

-- Create Policies for Chat Threads
CREATE POLICY "Users can insert their own chat threads" 
ON public.chat_threads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chat threads" 
ON public.chat_threads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat threads" 
ON public.chat_threads FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat threads" 
ON public.chat_threads FOR DELETE 
USING (auth.uid() = user_id);


-- 2. Create Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'agent')),
    text TEXT NOT NULL,
    token_usage JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Chat Messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create Policies for Chat Messages
CREATE POLICY "Users can insert their own chat messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chat messages" 
ON public.chat_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" 
ON public.chat_messages FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
ON public.chat_messages FOR DELETE 
USING (auth.uid() = user_id);
```

### Steps to Run:
1. Log in to your **Supabase Console** (https://supabase.com/dashboard).
2. Click on your project.
3. Select **SQL Editor** from the left navigation panel.
4. Click **New Query**, paste the code above, and click **Run**.

Once the SQL executes successfully, your chats will automatically sync across devices whenever you log in!
