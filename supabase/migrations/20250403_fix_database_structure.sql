-- Habilita a extensão uuid-ossp caso ela não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela communities se ela não existir (para garantir que as referências funcionem)
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Cria a tabela community_organizers se ela não existir
CREATE TABLE IF NOT EXISTS community_organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

-- Cria a tabela community_members se ela não existir
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    UNIQUE(community_id, player_id)
);

-- Cria a tabela competitions se ela não existir
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria a tabela competition_members se ela não existir
CREATE TABLE IF NOT EXISTS competition_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    UNIQUE(competition_id, player_id)
);

-- Desativa temporariamente RLS para facilitar as operações
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE competition_members DISABLE ROW LEVEL SECURITY;

-- Remove todas as políticas existentes que podem estar causando recursão
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

-- Cria políticas simplificadas para communities sem recursão
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (true);  -- Permite visualizar todas as comunidades

CREATE POLICY "communities_insert_policy"
ON communities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());  -- Apenas o próprio usuário pode criar

CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())  -- Apenas o criador pode atualizar
WITH CHECK (created_by = auth.uid());

CREATE POLICY "communities_delete_policy"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());  -- Apenas o criador pode excluir

-- Cria políticas simplificadas para community_organizers sem recursão
CREATE POLICY "community_organizers_select_policy"
ON community_organizers FOR SELECT
TO authenticated
USING (true);  -- Permite visualizar todos os organizadores

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

-- Cria políticas simplificadas para competitions
CREATE POLICY "competitions_select_policy"
ON competitions FOR SELECT
TO authenticated
USING (true);  -- Todos podem visualizar competições

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

-- Reativa RLS nas tabelas
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;
