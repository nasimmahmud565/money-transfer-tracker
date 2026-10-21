CREATE TYPE public.app_role AS ENUM ('admin', 'demo_admin', 'demo');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Admin overview: real admins see all users; demo admins only see demo accounts.
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS TABLE (user_id uuid, label text, is_demo boolean, transfers bigint, notes bigint, total_sent numeric, total_received numeric, last_date text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE full_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF NOT full_admin AND NOT public.has_role(auth.uid(), 'demo_admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  WITH users AS (
    SELECT DISTINCT t.user_id FROM public.transfers t
    UNION SELECT DISTINCT n.user_id FROM public.notes n
    UNION SELECT r.user_id FROM public.user_roles r WHERE r.role IN ('demo','demo_admin')
  )
  SELECT u.user_id,
    CASE WHEN public.has_role(u.user_id,'demo_admin') THEN 'Demo Admin'
         WHEN public.has_role(u.user_id,'demo') THEN 'Demo User'
         ELSE 'User ' || left(u.user_id::text, 8) END,
    (public.has_role(u.user_id,'demo') OR public.has_role(u.user_id,'demo_admin')),
    (SELECT count(*) FROM public.transfers t WHERE t.user_id = u.user_id),
    (SELECT count(*) FROM public.notes n WHERE n.user_id = u.user_id),
    COALESCE((SELECT sum(t.amount_sent) FROM public.transfers t WHERE t.user_id = u.user_id), 0),
    COALESCE((SELECT sum(t.amount_received) FROM public.transfers t WHERE t.user_id = u.user_id), 0),
    (SELECT max(t.date) FROM public.transfers t WHERE t.user_id = u.user_id)
  FROM users u
  WHERE full_admin OR public.has_role(u.user_id,'demo') OR public.has_role(u.user_id,'demo_admin');
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_overview() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;