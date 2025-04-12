-- Desativa temporariamente RLS para as tabelas communities e community_organizers
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;

-- Remove as políticas existentes das tabelas communities e community_organizers
DROP POLICY IF EXISTS "Permitir select para todos os usuários autenticados" ON communities;
DROP POLICY IF EXISTS "Permitir insert para usuários autenticados" ON communities;
DROP POLICY IF EXISTS "Permitir update para criadores e organizadores" ON communities;
DROP POLICY IF EXISTS "Permitir delete para criadores" ON communities;

DROP POLICY IF EXISTS "Permitir select para membros da comunidade" ON community_organizers;
DROP POLICY IF EXISTS "Permitir insert para criadores da comunidade" ON community_organizers;
DROP POLICY IF EXISTS "Permitir update para criadores da comunidade" ON community_organizers;
DROP POLICY IF EXISTS "Permitir delete para criadores da comunidade" ON community_organizers;

-- Cria novas políticas simplificadas para a tabela communities
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "communities_insert_policy"
ON communities FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "communities_delete_policy"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Cria novas políticas simplificadas para a tabela community_organizers
CREATE POLICY "community_organizers_select_policy"
ON community_organizers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "community_organizers_insert_policy"
ON community_organizers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

CREATE POLICY "community_organizers_update_policy"
ON community_organizers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

CREATE POLICY "community_organizers_delete_policy"
ON community_organizers FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

-- Reativa RLS para as tabelas communities e community_organizers
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
