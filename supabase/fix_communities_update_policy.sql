-- Script para corrigir a política de atualização de comunidades
-- Este script deve ser executado diretamente no console SQL do Supabase

-- Primeiro, verifica se a política existe e a remove
DROP POLICY IF EXISTS "communities_update_policy" ON communities;

-- Recria a política de atualização para comunidades
-- Esta política permite que o criador da comunidade possa atualizá-la
CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Verifica se a política foi criada corretamente
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
    tablename = 'communities'
    AND policyname = 'communities_update_policy';