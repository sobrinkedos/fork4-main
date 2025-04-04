-- Remover políticas de communities

-- 2. Remover TODAS as políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "Visualizar comunidades" ON communities;

DROP POLICY IF EXISTS "Criar comunidades" ON communities;

DROP POLICY IF EXISTS "Atualizar comunidades" ON communities;

DROP POLICY IF EXISTS "Excluir comunidades" ON communities;

DROP POLICY IF EXISTS "communities_select_policy" ON communities;

DROP POLICY IF EXISTS "communities_update_policy" ON communities;

DROP POLICY IF EXISTS "communities_delete_policy" ON communities;

DROP POLICY IF EXISTS "communities_insert_policy" ON communities;