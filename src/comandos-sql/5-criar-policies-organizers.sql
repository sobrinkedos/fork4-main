-- Criar novas políticas para community_organizers

-- Apenas o criador pode excluir

-- 4. Criar políticas simplificadas para community_organizers sem recursão
CREATE POLICY "community_organizers_select_policy"
ON community_organizers FOR SELECT
TO authenticated
USING (true);

-- Permite visualizar todos os organizadores

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