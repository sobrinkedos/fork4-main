-- Corrige o problema de recursão infinita nas políticas RLS das tabelas communities e community_organizers

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

-- 3. Criar políticas simplificadas para communities sem recursão
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'communities_select_policy') THEN
        EXECUTE 'CREATE POLICY "communities_select_policy"
                ON communities FOR SELECT
                TO authenticated
                USING (true)';  -- Permite visualizar todas as comunidades
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'communities_insert_policy') THEN
        EXECUTE 'CREATE POLICY "communities_insert_policy"
                ON communities FOR INSERT
                TO authenticated
                WITH CHECK (created_by = auth.uid())';  -- Apenas o próprio usuário pode criar
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'communities_update_policy') THEN
        EXECUTE 'CREATE POLICY "communities_update_policy"
                ON communities FOR UPDATE
                TO authenticated
                USING (created_by = auth.uid())
                WITH CHECK (created_by = auth.uid())';  -- Apenas o criador pode atualizar
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'communities_delete_policy') THEN
        EXECUTE 'CREATE POLICY "communities_delete_policy"
                ON communities FOR DELETE
                TO authenticated
                USING (created_by = auth.uid())';  -- Apenas o criador pode excluir
    END IF;
END $$;

-- 4. Criar políticas simplificadas para community_organizers sem recursão
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_organizers' AND policyname = 'community_organizers_select_policy') THEN
        EXECUTE 'CREATE POLICY "community_organizers_select_policy"
                ON community_organizers FOR SELECT
                TO authenticated
                USING (true)';  -- Permite visualizar todos os organizadores
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_organizers' AND policyname = 'community_organizers_insert_policy') THEN
        EXECUTE 'CREATE POLICY "community_organizers_insert_policy"
                ON community_organizers FOR INSERT
                TO authenticated
                WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM communities
                        WHERE communities.id = community_id
                        AND communities.created_by = auth.uid()
                    )
                )';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_organizers' AND policyname = 'community_organizers_update_policy') THEN
        EXECUTE 'CREATE POLICY "community_organizers_update_policy"
                ON community_organizers FOR UPDATE
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM communities
                        WHERE communities.id = community_id
                        AND communities.created_by = auth.uid()
                    )
                )';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_organizers' AND policyname = 'community_organizers_delete_policy') THEN
        EXECUTE 'CREATE POLICY "community_organizers_delete_policy"
                ON community_organizers FOR DELETE
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM communities
                        WHERE communities.id = community_id
                        AND communities.created_by = auth.uid()
                    )
                )';
    END IF;
END $$;

-- 5. Reativar RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
