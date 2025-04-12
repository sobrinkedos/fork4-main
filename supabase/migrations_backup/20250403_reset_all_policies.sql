-- Script para resetar e simplificar todas as políticas de segurança relacionadas às comunidades

-- 1. Desativar temporariamente RLS para facilitar as operações
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE competition_members DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Visualizar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Atualizar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Excluir organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Apenas criadores e organizadores podem gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Organizadores podem ver outros organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Criadores podem gerenciar organizadores" ON community_organizers;

DROP POLICY IF EXISTS "Visualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Criar comunidades" ON communities;
DROP POLICY IF EXISTS "Atualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Excluir comunidades" ON communities;
DROP POLICY IF EXISTS "communities_select_policy" ON communities;
DROP POLICY IF EXISTS "communities_update_policy" ON communities;
DROP POLICY IF EXISTS "communities_delete_policy" ON communities;
DROP POLICY IF EXISTS "communities_insert_policy" ON communities;

-- 3. Criar políticas extremamente simples para community_organizers
CREATE POLICY "select_community_organizers"
ON community_organizers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "insert_community_organizers"
ON community_organizers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM communities
        WHERE id = community_id
        AND created_by = auth.uid()
    )
);

CREATE POLICY "update_community_organizers"
ON community_organizers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities
        WHERE id = community_id
        AND created_by = auth.uid()
    )
);

CREATE POLICY "delete_community_organizers"
ON community_organizers FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities
        WHERE id = community_id
        AND created_by = auth.uid()
    )
);

-- 4. Criar políticas extremamente simples para communities
CREATE POLICY "select_communities"
ON communities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "insert_communities"
ON communities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "update_communities"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "delete_communities"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 5. Reativar RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;
