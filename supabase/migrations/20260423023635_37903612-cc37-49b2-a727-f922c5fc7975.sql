ALTER TABLE public.contact_messages
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;

-- Backfill existing replied messages so they show a timestamp
UPDATE public.contact_messages
SET replied_at = COALESCE(replied_at, created_at)
WHERE status = 'replied' AND replied_at IS NULL;