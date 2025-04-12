-- Script para corrigir definitivamente o problema de recursão infinita nas políticas RLS
-- Este script remove todas as políticas conflitantes e recria políticas simplificadas
-- sem referências circulares entre as tabelas communities, community_organizers e community_members

-- 1. Desativar temporariamente RLS para facilitar as operações
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes que podem estar causando conflitos
-- Políticas da tabela communities
DROP POLICY IF EXISTS "communities_update_policy" ON communities;
DROP POLICY IF EXISTS "Atualizar comunidades" ON communities;
DROP POLICY IF EXISTS "update_communities" ON communities;
DROP POLICY IF EXISTS "Apenas criadores podem atualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Criadores podem atualizar comunidades" ON communities;
DROP POLICY IF EXISTS "communities_select_policy" ON communities;
DROP POLICY IF EXISTS "select_communities" ON communities;
DROP POLICY IF EXISTS "Visualizar comunidades" ON communities;
DROP POLICY IF EXISTS "communities_insert_policy" ON communities;
DROP POLICY IF EXISTS "communities_delete_policy" ON communities;

-- Políticas da tabela community_organizers
DROP POLICY IF EXISTS "Gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Visualizar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Atualizar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Excluir organizadores" ON community_organizers;
DROP POLICY IF EXISTS "insert_community_organizers" ON community_organizers;
DROP POLICY IF EXISTS "update_community_organizers" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_select_policy" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_update_policy" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_insert_policy" ON community_organizers;
DROP POLICY IF EXISTS "select_community_organizers" ON community_organizers;
DROP POLICY IF EXISTS "Apenas criadores e organizadores podem gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Organizadores podem ver outros organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Criadores podem gerenciar organizadores" ON community_organizers;

-- Políticas da tabela community_members
DROP POLICY IF EXISTS "community_members_select_policy" ON community_members;
DROP POLICY IF EXISTS "community_members_insert_policy" ON community_members;
DROP POLICY IF EXISTS "community_members_delete_policy" ON community_members;
DROP POLICY IF EXISTS "Permitir select para membros e organizadores" ON community_members;
DROP POLICY IF EXISTS "Permitir insert para organizadores" ON community_members;
DROP POLICY IF EXISTS "Permitir delete para organizadores" ON community_members;
DROP POLICY IF EXISTS "Permitir insert para organizadores e donos" ON community_members;
DROP POLICY IF EXISTS "Permitir delete para organizadores e donos" ON community_members;

-- 3. Criar políticas simplificadas para communities
-- Política para visualização de communities (todos podem ver comunidades ativas)
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR is_active = true);

-- Política para inserção de communities (qualquer usuário autenticado pode criar)
CREATE POLICY "communities_insert_policy"
ON communities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Política para atualização de communities (apenas o criador pode atualizar)
CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Política para exclusão de communities (apenas o criador pode excluir)
CREATE POLICY "communities_delete_policy"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 4. Criar políticas simplificadas para community_organizers
-- Política para visualização de community_organizers (todos podem ver)
CREATE POLICY "community_organizers_select_policy"
ON community_organizers FOR SELECT
TO authenticated
USING (true);

-- Política para inserção de community_organizers (apenas o criador da comunidade)
-- Evita recursão usando subconsulta direta em vez de EXISTS
CREATE POLICY "community_organizers_insert_policy"
ON community_organizers FOR INSERT
TO authenticated
WITH CHECK (
    community_id IN (
        SELECT id FROM communities 
        WHERE created_by = auth.uid()
    )
);

-- Política para atualização de community_organizers (apenas o criador da comunidade)
-- Evita recursão usando subconsulta direta em vez de EXISTS
CREATE POLICY "community_organizers_update_policy"
ON community_organizers FOR UPDATE
TO authenticated
USING (
    community_id IN (
        SELECT id FROM communities 
        WHERE created_by = auth.uid()
    )
);

-- Política para exclusão de community_organizers (apenas o criador da comunidade)
-- Evita recursão usando subconsulta direta em vez de EXISTS
CREATE POLICY "community_organizers_delete_policy"
ON community_organizers FOR DELETE
TO authenticated
USING (
    community_id IN (
        SELECT id FROM communities 
        WHERE created_by = auth.uid()
    )
);

-- 5. Criar políticas simplificadas para community_members
-- Política para visualização de community_members (todos podem ver)
CREATE POLICY "community_members_select_policy"
ON community_members FOR SELECT
TO authenticated
USING (true);

-- Política para inserção de community_members (apenas organizadores ou criador da comunidade)
-- Evita recursão usando subconsultas diretas em vez de EXISTS
CREATE POLICY "community_members_insert_policy"
ON community_members FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM community_organizers 
        WHERE community_id = community_members.community_id
    )
    OR 
    community_id IN (
        SELECT id FROM communities 
        WHERE created_by = auth.uid()
    )
);

-- Política para exclusão de community_members (apenas organizadores ou criador da comunidade)
-- Evita recursão usando subconsultas diretas em vez de EXISTS
CREATE POLICY "community_members_delete_policy"
ON community_members FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT user_id FROM community_organizers 
        WHERE community_id = community_members.community_id
    )
    OR 
    community_id IN (
        SELECT id FROM communities 
        WHERE created_by = auth.uid()
    )
);

-- 6. Reativar RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 7. Verificar se as políticas foram criadas corretamente
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename IN ('communities', 'community_organizers', 'community_members');