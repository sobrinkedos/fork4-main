-- Script para desfazer as migrações executadas em 02/04/2025
-- Este script reverte as alterações feitas nos arquivos:
-- 1. 20250402101718_whatsapp_integration.sql
-- 2. 20250402_fix_communities_update_policy.sql
-- Também corrige problemas de recursão infinita nas políticas RLS

-- 1. Desativar temporariamente RLS para facilitar as operações
ALTER TABLE IF EXISTS whatsapp_group_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas criadas em 02/04/2025 e políticas com recursão infinita

-- Remover políticas de WhatsApp criadas em 20250402101718_whatsapp_integration.sql
DROP POLICY IF EXISTS "Links de grupos do WhatsApp são visíveis para todos" ON whatsapp_group_links;
DROP POLICY IF EXISTS "Apenas organizadores podem adicionar links de grupos" ON whatsapp_group_links;
DROP POLICY IF EXISTS "Apenas organizadores podem atualizar links de grupos" ON whatsapp_group_links;
DROP POLICY IF EXISTS "Apenas organizadores podem excluir links de grupos" ON whatsapp_group_links;

-- Remover política de communities criada em 20250402_fix_communities_update_policy.sql
DROP POLICY IF EXISTS "communities_update_policy" ON communities;

-- Remover políticas problemáticas com recursão infinita
DROP POLICY IF EXISTS "Visualizar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Atualizar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Excluir organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Apenas criadores e organizadores podem gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Organizadores podem ver outros organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Criadores podem gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_select_policy" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_insert_policy" ON community_organizers;
DROP POLICY IF EXISTS "community_organizers_update_policy" ON community_organizers;

-- Remover políticas problemáticas de community_members
DROP POLICY IF EXISTS "community_members_select_policy" ON community_members;
DROP POLICY IF EXISTS "community_members_insert_policy" ON community_members;
DROP POLICY IF EXISTS "community_members_delete_policy" ON community_members;
DROP POLICY IF EXISTS "Permitir select para membros e organizadores" ON community_members;
DROP POLICY IF EXISTS "Permitir insert para organizadores" ON community_members;
DROP POLICY IF EXISTS "Permitir delete para organizadores" ON community_members;

-- 3. Remover tabela de integração com WhatsApp
DROP TABLE IF EXISTS whatsapp_group_links;

-- 4. Restaurar a política anterior de atualização de comunidades (baseado no estado anterior)
-- Nota: Esta política pode variar dependendo do estado anterior do banco de dados
-- A política abaixo é baseada no padrão observado em migrações anteriores
CREATE POLICY "update_communities"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- 5. Criar políticas simplificadas para community_organizers
CREATE POLICY "community_organizers_select_policy"
ON community_organizers FOR SELECT
TO authenticated
USING (true);

-- Política para inserção de community_organizers (apenas o criador da comunidade)
CREATE POLICY "community_organizers_insert_policy"
ON community_organizers FOR INSERT
TO authenticated
WITH CHECK (
    community_id IN (
        SELECT id FROM communities 
        WHERE created_by = auth.uid()
    )
);

-- 6. Criar políticas simplificadas para community_members
CREATE POLICY "community_members_select_policy"
ON community_members FOR SELECT
TO authenticated
USING (true);

-- 7. Reativar RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 8. Verificar se as políticas foram revertidas corretamente
SELECT
    schemaname,
    tablename,
    policyname
FROM
    pg_policies
WHERE
    tablename IN ('communities', 'community_organizers', 'community_members', 'whatsapp_group_links')
ORDER BY
    tablename, policyname;