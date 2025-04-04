-- Desativar RLS

-- Corrige o problema de recursão infinita nas políticas RLS das tabelas communities e community_organizers

-- 1. Desativar temporariamente RLS para facilitar as operações
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;

ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;