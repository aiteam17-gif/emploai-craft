-- Create enum for employee level
CREATE TYPE public.employee_level AS ENUM ('junior', 'senior');

-- Create enum for employee role
CREATE TYPE public.employee_role AS ENUM ('employee', 'manager');

-- Add level column to employees table
ALTER TABLE public.employees 
ADD COLUMN level public.employee_level NOT NULL DEFAULT 'junior';

-- Add role column to employees table
ALTER TABLE public.employees 
ADD COLUMN role public.employee_role NOT NULL DEFAULT 'employee';

-- Create index for faster queries on managers
CREATE INDEX idx_employees_role ON public.employees(role) WHERE deleted_at IS NULL;