-- BLOCO 17: configurações opcionais da slug. Executar antes de publicar.
BEGIN;
CREATE TABLE IF NOT EXISTS public.minipage_slug_config (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 lead_ativo boolean NOT NULL DEFAULT false
);
ALTER TABLE public.minipage_slug_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.minipage_slug_config FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.minipage_slug_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.minipage_slug_config TO service_role;
DROP POLICY IF EXISTS mp17_config_owner ON public.minipage_slug_config;
CREATE POLICY mp17_config_owner ON public.minipage_slug_config FOR ALL TO authenticated
 USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Usa a mesma tabela existente de leads. Não altera leads do catálogo nem seus dados.
-- A decisão de acesso usa o plano efetivo da view pública, nunca o valor enviado pelo navegador.
CREATE OR REPLACE FUNCTION public.mp17_registrar_inscricao_slug(p_slug text,p_email text,p_consentimento text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_uid uuid; v_plano text; v_ativo boolean;
BEGIN
 IF p_slug IS NULL OR p_slug !~ '^[a-zA-Z0-9_-]{1,100}$' OR p_email IS NULL OR length(p_email)>254 OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_consentimento IS NULL OR length(p_consentimento) NOT BETWEEN 1 AND 500 THEN RETURN 'invalid'; END IF;
 p_email := lower(trim(p_email));
 SELECT user_id,plano_tipo::text INTO v_uid,v_plano FROM public.perfis_publicos WHERE slug=p_slug LIMIT 1;
 IF v_uid IS NULL THEN RETURN 'not_found'; END IF;
 IF COALESCE(lower(trim(v_plano)),'') NOT IN ('loja','essencial','pro','equipe') THEN RETURN 'disabled'; END IF;
 SELECT lead_ativo INTO v_ativo FROM public.minipage_slug_config WHERE user_id=v_uid FOR SHARE;
 IF v_ativo IS DISTINCT FROM true THEN RETURN 'disabled'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || '|' || p_email,0));
 IF EXISTS (SELECT 1 FROM public.minipage_leads WHERE user_id=v_uid AND lower(trim(email))=p_email) THEN RETURN 'ok'; END IF;
 INSERT INTO public.minipage_leads(perfil_id,user_id,email,origem,item_tipo,item_id,item_titulo,slug,consentimento,consentimento_texto,user_agent)
 VALUES(v_uid,v_uid,p_email,'pagina_publica',NULL,NULL,NULL,p_slug,true,p_consentimento,NULL);
 RETURN 'ok';
END;
$$;
REVOKE ALL ON FUNCTION public.mp17_registrar_inscricao_slug(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp17_registrar_inscricao_slug(text,text,text) TO service_role;
COMMIT;
SELECT to_regclass('public.minipage_slug_config') AS tabela_config,
       to_regprocedure('public.mp17_registrar_inscricao_slug(text,text,text)') AS funcao_inscricao,
       to_regprocedure('public.checar_rate_limit(text,integer,integer)') AS limitador_existente,
       (SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.minipage_slug_config')) AS rls_ativa;
