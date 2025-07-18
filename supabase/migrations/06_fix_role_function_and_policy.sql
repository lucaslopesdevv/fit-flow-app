-- Remove policies antigas de INSERT na tabela exercises
DROP POLICY IF EXISTS "Only instructors can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can insert exercises" ON public.exercises;

-- Cria função public.role() para buscar o role do usuário logado
CREATE OR REPLACE FUNCTION public.role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Cria nova policy de INSERT usando public.role()
CREATE POLICY "Only instructors can insert exercises (public.role)"
ON public.exercises
FOR INSERT
TO authenticated
WITH CHECK (public.role() = 'instructor'); 