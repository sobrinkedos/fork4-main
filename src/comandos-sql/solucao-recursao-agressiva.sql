-- Solução agressiva para o problema de recursão infinita nas políticas RLS

-- 1. Desativar RLS completamente para as tabelas problemáticas
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Remover todas as políticas da tabela communities
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'communities'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON communities', policy_record.policyname);
        RAISE NOTICE 'Removida política: % da tabela communities', policy_record.policyname;
    END LOOP;
    
    -- Remover todas as políticas da tabela community_organizers
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'community_organizers'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON community_organizers', policy_record.policyname);
        RAISE NOTICE 'Removida política: % da tabela community_organizers', policy_record.policyname;
    END LOOP;
END $$;

-- 3. Criar políticas extremamente simples (permissivas) para evitar recursão
-- Política para communities - permite todas as operações para usuários autenticados
CREATE POLICY "communities_all_operations" 
ON communities
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para community_organizers - permite todas as operações para usuários autenticados
CREATE POLICY "community_organizers_all_operations" 
ON community_organizers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Reativar RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas aplicadas
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('communities', 'community_organizers')
ORDER BY tablename, policyname;
