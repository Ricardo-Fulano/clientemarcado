-- Somente Storage; não altera perfis, pagamentos, planos, assinaturas ou comissões.
BEGIN;
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('mp-smart-import-private','mp-smart-import-private',false,8388608,ARRAY['image/jpeg','image/png','image/webp','application/json'])
ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='mp-smart-import-private' AND public=false AND name='mp-smart-import-private') THEN
    RAISE EXCEPTION 'Bucket Smart Import ausente ou público';
  END IF;
END $$;
DROP POLICY IF EXISTS mp12_private_isolation ON storage.objects;
-- Restritiva inclusive se uma política antiga permissiva tiver escopo excessivo.
CREATE POLICY mp12_private_isolation ON storage.objects AS RESTRICTIVE FOR ALL TO public
USING (bucket_id <> 'mp-smart-import-private' OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]=auth.uid()::text))
WITH CHECK (bucket_id <> 'mp-smart-import-private' OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]=auth.uid()::text));
DROP POLICY IF EXISTS mp12_private_owner ON storage.objects;
CREATE POLICY mp12_private_owner ON storage.objects FOR ALL TO authenticated
USING (bucket_id='mp-smart-import-private' AND (storage.foldername(name))[1]=auth.uid()::text)
WITH CHECK (bucket_id='mp-smart-import-private' AND (storage.foldername(name))[1]=auth.uid()::text);
COMMIT;
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='mp-smart-import-private';
