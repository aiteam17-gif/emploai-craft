-- Create company_info table to store company details
CREATE TABLE public.company_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  mission text,
  vision text,
  values text,
  industry text,
  founded_year integer,
  company_size text,
  headquarters text,
  policies text,
  benefits text,
  culture text,
  products_services text,
  additional_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own company info"
ON public.company_info FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company info"
ON public.company_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company info"
ON public.company_info FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company info"
ON public.company_info FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_company_info_updated_at
BEFORE UPDATE ON public.company_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();