-- Enable real-time subscriptions for subject_events table
-- This allows the frontend to receive real-time updates when events are added/modified/deleted

-- Enable real-time for the subject_events table
ALTER PUBLICATION supabase_realtime ADD TABLE subject_events;

-- Verify the table is now in the realtime publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'subject_events';
