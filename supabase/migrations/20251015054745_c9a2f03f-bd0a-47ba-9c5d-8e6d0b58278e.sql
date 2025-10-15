-- Add document fields to company_info table
ALTER TABLE public.company_info 
ADD COLUMN documents jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company documents
CREATE POLICY "Users can view their own company documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'company-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own company documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own company documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own company documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);