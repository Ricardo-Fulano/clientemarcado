SELECT public.mp_asaas_recurring_ready_v3() AS pronto,
 has_function_privilege('authenticated','public.mp_asaas_expire_access_v3(uuid,timestamptz)','EXECUTE') AS authenticated_expira,
 has_function_privilege('authenticated','public.mp_asaas_downgrade_recurring_v3(uuid,text,date,timestamptz)','EXECUTE') AS authenticated_rebaixa,
 has_function_privilege('service_role','public.mp_asaas_expire_access_v3(uuid,timestamptz)','EXECUTE') AS servidor_expira,
 has_function_privilege('service_role','public.mp_asaas_downgrade_recurring_v3(uuid,text,date,timestamptz)','EXECUTE') AS servidor_rebaixa;
