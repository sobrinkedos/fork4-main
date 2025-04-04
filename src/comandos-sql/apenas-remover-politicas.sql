-- Script para remover todas as políticas problemáticas sem tentar criar novas

-- 1. Desativar temporariamente RLS para facilitar as operações
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "Visualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Criar comunidades" ON communities;
DROP POLICY IF EXISTS "Atualizar comunidades" ON communities;
DROP POLICY IF EXISTS "Excluir comunidades" ON communities;
DROP POLICY IF EXISTS "communities_select_policy" ON communities;
DROP POLICY IF EXISTS "communities_update_policy" ON communities;
DROP POLICY IF EXISTS "communities_delete_policy" ON communities;
DROP POLICY IF EXISTS "communities_insert_policy" ON communities;

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

-- 3. Reativar RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
