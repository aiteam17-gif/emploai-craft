-- Create storage bucket for conversation files
INSERT INTO storage.buckets (id, name, public)
VALUES ('conversation_files', 'conversation_files', false);

-- Create table to track file attachments in conversations
CREATE TABLE public.conversation_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on conversation_attachments
ALTER TABLE public.conversation_attachments ENABLE ROW LEVEL SECURITY;

-- Users can upload files to their own conversations
CREATE POLICY "Users can create attachments in own conversations"
ON public.conversation_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN employees e ON e.id = c.employee_id
    WHERE c.id = conversation_attachments.conversation_id 
    AND e.user_id = auth.uid()
  )
);

-- Users can view files from their own conversations
CREATE POLICY "Users can view attachments in own conversations"
ON public.conversation_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN employees e ON e.id = c.employee_id
    WHERE c.id = conversation_attachments.conversation_id 
    AND e.user_id = auth.uid()
    AND e.deleted_at IS NULL
  )
);

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete own attachments"
ON public.conversation_attachments
FOR DELETE
USING (auth.uid() = uploaded_by);

-- Storage policies for conversation_files bucket
CREATE POLICY "Users can upload files to own conversations"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'conversation_files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own conversation files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'conversation_files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own conversation files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'conversation_files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);