-- Cria a tabela competitions caso ela não exista
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita RLS na tabela competitions
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Cria políticas de segurança para a tabela competitions
CREATE POLICY "competitions_select_policy"
ON competitions FOR SELECT
TO authenticated
USING (true);  -- Todos os usuários autenticados podem visualizar competições

CREATE POLICY "competitions_insert_policy"
ON competitions FOR INSERT
TO authenticated
WITH CHECK (
    -- Usuário é o criador da comunidade ou um organizador
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM community_organizers
        WHERE community_organizers.community_id = community_id
        AND community_organizers.user_id = auth.uid()
    )
);

CREATE POLICY "competitions_update_policy"
ON competitions FOR UPDATE
TO authenticated
USING (
    -- Usuário é o criador da competição, o criador da comunidade ou um organizador
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM community_organizers
        WHERE community_organizers.community_id = community_id
        AND community_organizers.user_id = auth.uid()
    )
);

CREATE POLICY "competitions_delete_policy"
ON competitions FOR DELETE
TO authenticated
USING (
    -- Usuário é o criador da competição, o criador da comunidade ou um organizador
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM community_organizers
        WHERE community_organizers.community_id = community_id
        AND community_organizers.user_id = auth.uid()
    )
);

-- Cria a tabela competition_members caso ela não exista
CREATE TABLE IF NOT EXISTS competition_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    UNIQUE(competition_id, player_id)
);

-- Habilita RLS na tabela competition_members
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;

-- Cria políticas de segurança para a tabela competition_members
CREATE POLICY "competition_members_select_policy"
ON competition_members FOR SELECT
TO authenticated
USING (true);  -- Todos os usuários autenticados podem visualizar membros de competições

CREATE POLICY "competition_members_insert_policy"
ON competition_members FOR INSERT
TO authenticated
WITH CHECK (
    -- Usuário é o criador da competição, o criador da comunidade ou um organizador
    EXISTS (
        SELECT 1 FROM competitions
        WHERE competitions.id = competition_id
        AND (
            competitions.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM communities
                WHERE communities.id = competitions.community_id
                AND communities.created_by = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM community_organizers
                WHERE community_organizers.community_id = competitions.community_id
                AND community_organizers.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "competition_members_update_policy"
ON competition_members FOR UPDATE
TO authenticated
USING (
    -- Usuário é o criador da competição, o criador da comunidade ou um organizador
    EXISTS (
        SELECT 1 FROM competitions
        WHERE competitions.id = competition_id
        AND (
            competitions.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM communities
                WHERE communities.id = competitions.community_id
                AND communities.created_by = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM community_organizers
                WHERE community_organizers.community_id = competitions.community_id
                AND community_organizers.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "competition_members_delete_policy"
ON competition_members FOR DELETE
TO authenticated
USING (
    -- Usuário é o criador da competição, o criador da comunidade ou um organizador
    EXISTS (
        SELECT 1 FROM competitions
        WHERE competitions.id = competition_id
        AND (
            competitions.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM communities
                WHERE communities.id = competitions.community_id
                AND communities.created_by = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM community_organizers
                WHERE community_organizers.community_id = competitions.community_id
                AND community_organizers.user_id = auth.uid()
            )
        )
    )
);
