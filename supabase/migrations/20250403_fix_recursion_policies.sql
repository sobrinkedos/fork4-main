-- Corrige o problema de recursão infinita nas políticas RLS

-- 1. Corrigir políticas da tabela community_organizers
DROP POLICY IF EXISTS "Apenas criadores e organizadores podem gerenciar organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Organizadores podem ver outros organizadores" ON community_organizers;
DROP POLICY IF EXISTS "Criadores podem gerenciar organizadores" ON community_organizers;

-- Criar políticas simplificadas para community_organizers
CREATE POLICY "Visualizar organizadores"
ON community_organizers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerenciar organizadores"
ON community_organizers FOR INSERT
TO authenticated
WITH CHECK (
    -- Usuário é o criador da comunidade
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

CREATE POLICY "Atualizar organizadores"
ON community_organizers FOR UPDATE
TO authenticated
USING (
    -- Usuário é o criador da comunidade
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

CREATE POLICY "Excluir organizadores"
ON community_organizers FOR DELETE
TO authenticated
USING (
    -- Usuário é o criador da comunidade
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

-- 2. Corrigir políticas da tabela communities
DROP POLICY IF EXISTS "communities_select_policy" ON communities;
DROP POLICY IF EXISTS "communities_update_policy" ON communities;
DROP POLICY IF EXISTS "communities_delete_policy" ON communities;
DROP POLICY IF EXISTS "communities_insert_policy" ON communities;

-- Criar políticas simplificadas para communities
CREATE POLICY "Visualizar comunidades"
ON communities FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR is_active = true);

CREATE POLICY "Criar comunidades"
ON communities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Atualizar comunidades"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Excluir comunidades"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Garantir que RLS está habilitado nas tabelas
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
