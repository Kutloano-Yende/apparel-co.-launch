
-- Admin notifications table for in-app realtime alerts
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications (created_at DESC);
CREATE INDEX idx_admin_notifications_unread ON public.admin_notifications (read, created_at DESC) WHERE read = false;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can mark as read / update
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Inserts come from edge functions using the service role key (bypasses RLS).
-- No public/authenticated INSERT policy on purpose.

-- Enable realtime
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
