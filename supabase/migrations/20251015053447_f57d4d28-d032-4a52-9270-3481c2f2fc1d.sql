-- Add offer letter URL to employees table
ALTER TABLE public.employees 
ADD COLUMN offer_letter_url text;

-- Create storage bucket for offer letters
INSERT INTO storage.buckets (id, name, public) 
VALUES ('offer-letters', 'offer-letters', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for offer letter storage
CREATE POLICY "Users can view their own offer letters"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'offer-letters' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Managers can upload offer letters"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'offer-letters' 
  AND EXISTS (
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() 
    AND role = 'manager'
    AND deleted_at IS NULL
  )
);

CREATE POLICY "Managers can update offer letters"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'offer-letters'
  AND EXISTS (
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() 
    AND role = 'manager'
    AND deleted_at IS NULL
  )
);

CREATE POLICY "Managers can delete offer letters"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'offer-letters'
  AND EXISTS (
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() 
    AND role = 'manager'
    AND deleted_at IS NULL
  )
);