-- Criar novas políticas para communities

-- 3. Criar políticas simplificadas para communities sem recursão
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (true);

-- Permite visualizar todas as comunidades

CREATE POLICY "communities_insert_policy"
ON communities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Apenas o próprio usuário pode criar

CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())  -- Apenas o criador pode atualizar
WITH CHECK (created_by = auth.uid());

CREATE POLICY "communities_delete_policy"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());