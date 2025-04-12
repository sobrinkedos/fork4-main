-- Script completo para resolver o problema de recursão infinita nas políticas RLS

-- Habilita a extensão uuid-ossp caso ela não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Desativar temporariamente RLS para facilitar as operações
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "Visualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Criar comunidades" ON communities;
DROP POLICY IF EXISTS "Atualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Excluir comunidades" ON communities;
DROP POLICY IF EXISTS "communities_select_policy" ON communities;
DROP POLICY IF EXISTS "communities_update_policy" ON communities;
DROP POLICY IF EXISTS "communities_delete_policy" ON communities;
DROP POLICY IF EXISTS "communities_insert_policy" ON communities;
DROP POLICY IF EXISTS "Apenas criadores podem atualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Criadores podem atualizar comunidades" ON communities;

DROP POLICY IF EXISTS "Visualizar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Atualizar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Excluir organizadores" ON community_organizers;
DROP POLICY IF EXISTS "select_community_organizers" ON community_organizers;
DROP POLICY IF EXISTS "insert_community_organizers" ON community_organizers;
DROP POLICY IF EXISTS "update_community_organizers" ON community_organizers;
DROP POLICY IF EXISTS "delete_community_organizers" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_select_policy" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_insert_policy" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_update_policy" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_delete_policy" ON community_organizers;
DROP POLICY IF EXISTS "Apenas criadores e organizadores podem gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Organizadores podem ver outros organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Criadores podem gerenciar organizadores" ON community_organizers;

-- 3. Criar políticas extremamente simples para communities sem recursão
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (true);  -- Permite visualizar todas as comunidades (sem restrição)

CREATE POLICY "communities_insert_policy"
ON communities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());  -- Apenas o próprio usuário pode criar

CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())  -- Apenas o criador pode atualizar
WITH CHECK (created_by = auth.uid());

CREATE POLICY "communities_delete_policy"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());  -- Apenas o criador pode excluir

-- 4. Criar políticas extremamente simples para community_organizers sem recursão
CREATE POLICY "community_organizers_select_policy"
ON community_organizers FOR SELECT
TO authenticated
USING (true);  -- Permite visualizar todos os organizadores (sem restrição)

-- Política de inserção simplificada sem recursão
CREATE POLICY "community_organizers_insert_policy"
ON community_organizers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

-- Política de atualização simplificada sem recursão
CREATE POLICY "community_organizers_update_policy"
ON community_organizers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

-- Política de exclusão simplificada sem recursão
CREATE POLICY "community_organizers_delete_policy"
ON community_organizers FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

-- 5. Criar políticas simplificadas para community_members
CREATE POLICY "community_members_select_policy"
ON community_members FOR SELECT
TO authenticated
USING (true);  -- Permite visualizar todos os membros

CREATE POLICY "community_members_insert_policy"
ON community_members FOR INSERT
TO authenticated
WITH CHECK (
    -- Usuário é o criador da comunidade ou um organizador
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM community_organizers
        WHERE community_organizers.community_id = community_id
        AND community_organizers.user_id = auth.uid()
    )
);

CREATE POLICY "community_members_update_policy"
ON community_members FOR UPDATE
TO authenticated
USING (
    -- Usuário é o criador da comunidade ou um organizador
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM community_organizers
        WHERE community_organizers.community_id = community_id
        AND community_organizers.user_id = auth.uid()
    )
);

CREATE POLICY "community_members_delete_policy"
ON community_members FOR DELETE
TO authenticated
USING (
    -- Usuário é o criador da comunidade ou um organizador
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM community_organizers
        WHERE community_organizers.community_id = community_id
        AND community_organizers.user_id = auth.uid()
    )
);

-- 6. Reativar RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
