-- Corrige a política de atualização de comunidades para permitir que o criador edite suas próprias comunidades

-- Primeiro, verifica se a política existe e a remove
DROP POLICY IF EXISTS "communities_update_policy" ON communities;

-- Recria a política de atualização para comunidades (apenas o criador pode atualizar)
CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Verifica se há outras políticas que possam estar interferindo
DROP POLICY IF EXISTS "Apenas criadores podem atualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Criadores podem atualizar comunidades" ON communities;

-- Garante que a RLS está habilitada
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
