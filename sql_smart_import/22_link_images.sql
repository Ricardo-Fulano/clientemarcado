BEGIN;
ALTER TABLE public.pagina_links ADD COLUMN IF NOT EXISTS imagem_path text;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mp22_link_image_path_owner' AND conrelid='public.pagina_links'::regclass) THEN
  ALTER TABLE public.pagina_links ADD CONSTRAINT mp22_link_image_path_owner CHECK (imagem_path IS NULL OR (user_id IS NOT NULL AND split_part(imagem_path,'/',1)=user_id::text AND imagem_path ~ '^[a-fA-F0-9-]{36}/[a-fA-F0-9-]{36}\.webp$'));
 END IF;
END $$;
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES ('mp-link-images','mp-link-images',true,1048576,ARRAY['image/webp']) ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='mp-link-images' AND public AND file_size_limit=1048576 AND allowed_mime_types=ARRAY['image/webp']) THEN RAISE EXCEPTION 'Bucket mp-link-images incompatível'; END IF;
END $$;
DROP POLICY IF EXISTS mp22_link_image_isolation ON storage.objects;
CREATE POLICY mp22_link_image_isolation ON storage.objects AS RESTRICTIVE FOR ALL TO public USING (bucket_id <> 'mp-link-images' OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]=auth.uid()::text)) WITH CHECK (bucket_id <> 'mp-link-images' OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]=auth.uid()::text AND name ~ '^[a-fA-F0-9-]{36}/[a-fA-F0-9-]{36}\.webp$'));
DROP POLICY IF EXISTS mp22_link_image_owner ON storage.objects;
CREATE POLICY mp22_link_image_owner ON storage.objects FOR ALL TO authenticated USING (bucket_id='mp-link-images' AND (storage.foldername(name))[1]=auth.uid()::text) WITH CHECK (bucket_id='mp-link-images' AND (storage.foldername(name))[1]=auth.uid()::text);
COMMIT;
NOTIFY pgrst, 'reload schema';
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='mp-link-images';
