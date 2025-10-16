-- Fix the create_default_manager function to use valid expertise type
CREATE OR REPLACE FUNCTION public.create_default_manager()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    'HR',
    'senior',
    'manager',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=Alex-Morgan-HR&radius=50'
  );
  
  RETURN NEW;
END;
$function$;