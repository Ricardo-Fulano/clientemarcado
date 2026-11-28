BEGIN;
-- MP27: instalar primeiro em homologacao. Nenhum usuario existente e alterado.
DO $check$ BEGIN
 IF EXISTS(SELECT 1 FROM auth.identities WHERE provider='google') THEN
  RAISE EXCEPTION 'MP27: identidades Google existentes requerem auditoria antes da instalacao';
 END IF;
END $check$;
CREATE TABLE IF NOT EXISTS public.mp27_email_challenges (
 id uuid PRIMARY KEY, email text NOT NULL, code_hash text NOT NULL CHECK (code_hash ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz NOT NULL DEFAULT (now()+interval '10 minutes'), attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS mp27_email_challenges_expiry_idx ON public.mp27_email_challenges(expires_at);
ALTER TABLE public.mp27_email_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mp27_email_challenges FROM PUBLIC,anon,authenticated;
GRANT INSERT,SELECT,DELETE ON public.mp27_email_challenges TO service_role;
CREATE OR REPLACE FUNCTION public.mp27_consumir_codigo(p_id uuid,p_email text,p_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE r public.mp27_email_challenges%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.mp27_email_challenges WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR r.email IS DISTINCT FROM p_email OR r.consumed_at IS NOT NULL OR r.expires_at<=now() OR r.attempts>=5 OR p_hash IS NULL THEN RETURN false; END IF;
 IF r.code_hash IS DISTINCT FROM p_hash THEN UPDATE public.mp27_email_challenges SET attempts=attempts+1 WHERE id=p_id; RETURN false; END IF;
 UPDATE public.mp27_email_challenges SET consumed_at=now() WHERE id=p_id;
 RETURN true;
END $f$;
REVOKE ALL ON FUNCTION public.mp27_consumir_codigo(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp27_consumir_codigo(uuid,text,text) TO service_role;
-- Registro privado de elegibilidade, criado apenas na insercao de auth.users.
-- Nao usa email_confirmed_at de contas antigas como prova, nem user_metadata.
CREATE TABLE IF NOT EXISTS public.mp27_google_eligible (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 email text NOT NULL, source text NOT NULL CHECK(source IN ('google_new','signup_otp')), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mp27_google_eligible ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mp27_google_eligible FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.mp27_registrar_elegibilidade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE e text:=lower(btrim(NEW.email));
BEGIN
 IF e IS NULL OR e='' THEN RETURN NEW; END IF;
 IF NEW.raw_app_meta_data->>'provider'='google' AND coalesce(NEW.encrypted_password,'')='' THEN
  INSERT INTO public.mp27_google_eligible(user_id,email,source) VALUES(NEW.id,e,'google_new');
 ELSIF NEW.raw_app_meta_data->>'mp27_email_verified'=e THEN
  INSERT INTO public.mp27_google_eligible(user_id,email,source) VALUES(NEW.id,e,'signup_otp');
 END IF;
 RETURN NEW;
END $f$;
REVOKE ALL ON FUNCTION public.mp27_registrar_elegibilidade() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.mp27_guard_google_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE e text:=lower(btrim(NEW.identity_data->>'email'));
BEGIN
 IF NEW.provider IS DISTINCT FROM 'google' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.provider='google' AND OLD.user_id=NEW.user_id AND OLD.provider_id=NEW.provider_id THEN RETURN NEW; END IF;
 END IF;
 IF e IS NULL OR e='' OR NEW.identity_data->>'email_verified' IS DISTINCT FROM 'true' OR NOT EXISTS(
  SELECT 1 FROM public.mp27_google_eligible g JOIN auth.users u ON u.id=g.user_id
  WHERE g.user_id=NEW.user_id AND g.email=e AND lower(btrim(u.email))=e
  AND (g.source='google_new' OR split_part(e,'@',2) IN ('gmail.com','googlemail.com') OR (nullif(NEW.identity_data->>'hd','') IS NOT NULL AND lower(NEW.identity_data->>'hd')=split_part(e,'@',2)))
  AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id=NEW.user_id AND i.provider='google')
 ) THEN RAISE EXCEPTION 'MP27_GOOGLE_LINK_REQUIRES_VERIFICATION' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $f$;
REVOKE ALL ON FUNCTION public.mp27_guard_google_identity() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS mp27_registrar_elegibilidade ON auth.users;
CREATE TRIGGER mp27_registrar_elegibilidade AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.mp27_registrar_elegibilidade();
DROP TRIGGER IF EXISTS mp27_guard_google_identity ON auth.identities;
CREATE TRIGGER mp27_guard_google_identity BEFORE INSERT OR UPDATE OF user_id,provider,provider_id ON auth.identities FOR EACH ROW EXECUTE FUNCTION public.mp27_guard_google_identity();
COMMIT;
