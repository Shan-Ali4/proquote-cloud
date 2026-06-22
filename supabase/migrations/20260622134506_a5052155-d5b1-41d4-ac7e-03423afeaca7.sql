-- Convert next_document_number to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.next_document_number(_doc_type doc_type, _year integer, _prefix text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner UUID := auth.uid();
  v_n INT;
BEGIN
  IF v_owner IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  INSERT INTO public.document_sequences (owner_id, doc_type, year, last_number)
  VALUES (v_owner, _doc_type, _year, 1)
  ON CONFLICT (owner_id, doc_type, year)
  DO UPDATE SET last_number = public.document_sequences.last_number + 1
  RETURNING last_number INTO v_n;
  RETURN _prefix || '-' || _year::text || '-' || lpad(v_n::text, 4, '0');
END; $function$;

-- Ensure authenticated users can still call it (RLS on document_sequences enforces ownership)
GRANT EXECUTE ON FUNCTION public.next_document_number(doc_type, integer, text) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.document_sequences TO authenticated;

-- Trigger-only functions should not be directly callable by API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
