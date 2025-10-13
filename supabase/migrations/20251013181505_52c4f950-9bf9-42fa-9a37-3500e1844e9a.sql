-- Function to create default manager employee for new users
CREATE OR REPLACE FUNCTION public.create_default_manager()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a default manager employee for the new user
  INSERT INTO public.employees (
    user_id,
    name,
    gender,
    expertise,
    level,
    role,
    avatar_url
  )
  VALUES (
    NEW.id,
    'Alex Morgan',
    'neutral',
    'Operations',
    'senior',
    'manager',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=Alex-Morgan-Operations&radius=50'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create default manager when a new user signs up
CREATE TRIGGER on_auth_user_created_manager
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_manager();