-- Adiciona a coluna is_active à tabela communities
ALTER TABLE communities
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Atualiza as políticas para considerar o campo is_active
DROP POLICY IF EXISTS "communities_select_policy" ON communities;

-- Policy for viewing communities (everyone can view active communities)
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR is_active = TRUE);