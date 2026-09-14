-- Create allowed_admins table to replace hardcoded emails
CREATE TABLE IF NOT EXISTS public.allowed_admins (
    email TEXT PRIMARY KEY
);

-- Insert the two previously hardcoded emails
INSERT INTO public.allowed_admins (email) VALUES
    ('goagardenresort@gmail.com'),
    ('premsaldana0@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS on allowed_admins (Only authenticated admins can view it)
ALTER TABLE public.allowed_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read allowed_admins"
    ON public.allowed_admins FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create the payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Allow anyone to upload a proof (since guests upload them via public share links)
CREATE POLICY "Allow public uploads to payment-proofs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow authenticated users (Admins) to read/download proofs
CREATE POLICY "Allow authenticated users to view payment-proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');
