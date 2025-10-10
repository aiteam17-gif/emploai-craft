-- Add first_name and last_name to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks
CREATE POLICY "Users can view own tasks"
ON public.tasks
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create own tasks"
ON public.tasks
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own tasks"
ON public.tasks
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own tasks"
ON public.tasks
FOR DELETE
USING (auth.uid() = created_by);

-- Add trigger for tasks updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();