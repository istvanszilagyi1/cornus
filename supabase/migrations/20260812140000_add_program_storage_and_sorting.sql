-- 1. Oszlopok hozzáadása (ha még nem léteznek)
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- 2. Frissítő funkció létrehozása
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Trigger létrehozása (CREATE OR REPLACE-szel)
CREATE OR REPLACE TRIGGER programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS bekapcsolása
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- 5. "programs" tábla policy-k frissítése (régi törlése, majd új létrehozása)
DROP POLICY IF EXISTS "programs are public" ON public.programs;
CREATE POLICY "programs are public" ON public.programs
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins manage programs" ON public.programs;
CREATE POLICY "admins manage programs" ON public.programs
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. "storage.objects" policy-k frissítése
DROP POLICY IF EXISTS "admins read cornus images" ON storage.objects;
CREATE POLICY "admins read cornus images" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'cornus' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins upload cornus images" ON storage.objects;
CREATE POLICY "admins upload cornus images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cornus' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins update cornus images" ON storage.objects;
CREATE POLICY "admins update cornus images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'cornus' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete cornus images" ON storage.objects;
CREATE POLICY "admins delete cornus images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'cornus' AND public.has_role(auth.uid(), 'admin'));