-- Habilita a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria a tabela de comunidades
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria a tabela de organizadores de comunidades
CREATE TABLE IF NOT EXISTS community_organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

-- Cria a tabela de membros de comunidades
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(community_id, player_id)
);

-- Cria a tabela de jogadores
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, community_id)
);

-- Cria a tabela de competições
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria a tabela de membros de competições
CREATE TABLE IF NOT EXISTS competition_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(competition_id, player_id)
);

-- Cria a tabela de jogos
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    team1_player1 UUID REFERENCES players(id) ON DELETE CASCADE,
    team1_player2 UUID REFERENCES players(id) ON DELETE CASCADE,
    team2_player1 UUID REFERENCES players(id) ON DELETE CASCADE,
    team2_player2 UUID REFERENCES players(id) ON DELETE CASCADE,
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    is_buchuda BOOLEAN DEFAULT FALSE,
    is_buchuda_de_re BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria a tabela de atividades
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('game', 'competition', 'community', 'player')),
    description TEXT NOT NULL,
    metadata JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita RLS para todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Cria políticas para a tabela profiles
CREATE POLICY "Permitir select para todos os usuários autenticados"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir insert para o próprio usuário"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Permitir update para o próprio usuário"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Cria políticas para a tabela communities
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "communities_insert_policy"
ON communities FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "communities_delete_policy"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Cria políticas para a tabela community_organizers
CREATE POLICY "community_organizers_select_policy"
ON community_organizers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "community_organizers_insert_policy"
ON community_organizers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

CREATE POLICY "community_organizers_update_policy"
ON community_organizers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

CREATE POLICY "community_organizers_delete_policy"
ON community_organizers FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

-- Cria políticas para a tabela community_members
CREATE POLICY "community_members_select_policy"
ON community_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "community_members_insert_policy"
ON community_members FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND (
            communities.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM community_organizers
                WHERE community_organizers.community_id = community_id
                AND community_organizers.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "community_members_delete_policy"
ON community_members FOR DELETE
TO authenticated
USING (
    player_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND (
            communities.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM community_organizers
                WHERE community_organizers.community_id = community_id
                AND community_organizers.user_id = auth.uid()
            )
        )
    )
);

-- Cria políticas para a tabela players
CREATE POLICY "players_select_policy"
ON players FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "players_insert_policy"
ON players FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "players_update_policy"
ON players FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "players_delete_policy"
ON players FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Cria políticas para a tabela competitions
CREATE POLICY "competitions_select_policy"
ON competitions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "competitions_insert_policy"
ON competitions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND (
            communities.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM community_organizers
                WHERE community_organizers.community_id = community_id
                AND community_organizers.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "competitions_update_policy"
ON competitions FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND (
            communities.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM community_organizers
                WHERE community_organizers.community_id = community_id
                AND community_organizers.user_id = auth.uid()
            )
        )
    )
)
WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND (
            communities.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM community_organizers
                WHERE community_organizers.community_id = community_id
                AND community_organizers.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "competitions_delete_policy"
ON competitions FOR DELETE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM communities
        WHERE communities.id = community_id
        AND communities.created_by = auth.uid()
    )
);

-- Cria políticas para a tabela competition_members
CREATE POLICY "competition_members_select_policy"
ON competition_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "competition_members_insert_policy"
ON competition_members FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM competitions
        WHERE competitions.id = competition_id
        AND (
            competitions.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM communities
                WHERE communities.id = competitions.community_id
                AND (
                    communities.created_by = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM community_organizers
                        WHERE community_organizers.community_id = communities.id
                        AND community_organizers.user_id = auth.uid()
                    )
                )
            )
        )
    )
);

CREATE POLICY "competition_members_delete_policy"
ON competition_members FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM competitions
        JOIN players ON competition_members.player_id = players.id
        WHERE competitions.id = competition_id
        AND (
            players.user_id = auth.uid()
            OR competitions.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM communities
                WHERE communities.id = competitions.community_id
                AND (
                    communities.created_by = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM community_organizers
                        WHERE community_organizers.community_id = communities.id
                        AND community_organizers.user_id = auth.uid()
                    )
                )
            )
        )
    )
);

-- Cria políticas para a tabela games
CREATE POLICY "games_select_policy"
ON games FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "games_insert_policy"
ON games FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM competitions
        WHERE competitions.id = competition_id
        AND (
            competitions.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM communities
                WHERE communities.id = competitions.community_id
                AND (
                    communities.created_by = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM community_organizers
                        WHERE community_organizers.community_id = communities.id
                        AND community_organizers.user_id = auth.uid()
                    )
                )
            )
        )
    )
);

CREATE POLICY "games_update_policy"
ON games FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM competitions
        WHERE competitions.id = competition_id
        AND (
            competitions.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM communities
                WHERE communities.id = competitions.community_id
                AND (
                    communities.created_by = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM community_organizers
                        WHERE community_organizers.community_id = communities.id
                        AND community_organizers.user_id = auth.uid()
                    )
                )
            )
        )
    )
)
WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM competitions
        WHERE competitions.id = competition_id
        AND (
            competitions.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM communities
                WHERE communities.id = competitions.community_id
                AND (
                    communities.created_by = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM community_organizers
                        WHERE community_organizers.community_id = communities.id
                        AND community_organizers.user_id = auth.uid()
                    )
                )
            )
        )
    )
);

CREATE POLICY "games_delete_policy"
ON games FOR DELETE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM competitions
        WHERE competitions.id = competition_id
        AND (
            competitions.created_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM communities
                WHERE communities.id = competitions.community_id
                AND communities.created_by = auth.uid()
            )
        )
    )
);

-- Cria políticas para a tabela activities
CREATE POLICY "activities_select_policy"
ON activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "activities_insert_policy"
ON activities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Cria funções para gerenciar competições
CREATE OR REPLACE FUNCTION create_competition(
    p_name TEXT,
    p_description TEXT,
    p_community_id UUID,
    p_created_by UUID
)
RETURNS competitions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_authorized BOOLEAN;
    v_competition competitions;
BEGIN
    -- Verifica se o usuário é criador da comunidade ou organizador
    SELECT EXISTS (
        SELECT 1
        FROM communities c
        WHERE c.id = p_community_id
        AND c.created_by = p_created_by
    ) OR EXISTS (
        SELECT 1
        FROM community_organizers co
        WHERE co.community_id = p_community_id
        AND co.user_id = p_created_by
    ) INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Usuário não tem permissão para criar competições nesta comunidade';
    END IF;

    -- Cria a competição
    INSERT INTO competitions (
        name,
        description,
        community_id,
        created_by,
        start_date,
        status
    ) VALUES (
        p_name,
        p_description,
        p_community_id,
        p_created_by,
        NOW(),
        'pending'
    )
    RETURNING * INTO v_competition;

    RETURN v_competition;
END;
$$;

-- Função para buscar competições de uma comunidade
CREATE OR REPLACE FUNCTION get_community_competitions(
    p_community_id UUID,
    p_user_id UUID
)
RETURNS SETOF competitions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifica se o usuário tem acesso à comunidade
    IF EXISTS (
        SELECT 1
        FROM communities c
        WHERE c.id = p_community_id
        AND c.created_by = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM community_organizers co
        WHERE co.community_id = p_community_id
        AND co.user_id = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM community_members cm
        WHERE cm.community_id = p_community_id
        AND cm.player_id = p_user_id
    ) THEN
        RETURN QUERY
        SELECT c.*
        FROM competitions c
        WHERE c.community_id = p_community_id
        ORDER BY c.start_date DESC;
    END IF;

    RETURN;
END;
$$;

-- Função para buscar uma competição específica
CREATE OR REPLACE FUNCTION get_competition_by_id(
    p_competition_id UUID,
    p_user_id UUID
)
RETURNS competitions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_competition competitions;
    v_community_id UUID;
BEGIN
    -- Obtém o ID da comunidade da competição
    SELECT community_id INTO v_community_id
    FROM competitions
    WHERE id = p_competition_id;

    -- Verifica se o usuário tem acesso à comunidade
    IF EXISTS (
        SELECT 1
        FROM communities c
        WHERE c.id = v_community_id
        AND c.created_by = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM community_organizers co
        WHERE co.community_id = v_community_id
        AND co.user_id = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM community_members cm
        WHERE cm.community_id = v_community_id
        AND cm.player_id = p_user_id
    ) THEN
        SELECT c.*
        INTO v_competition
        FROM competitions c
        WHERE c.id = p_competition_id;

        RETURN v_competition;
    END IF;

    RETURN NULL;
END;
$$;
