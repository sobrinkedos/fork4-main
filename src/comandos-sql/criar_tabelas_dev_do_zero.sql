-- Script para criar tabelas de desenvolvimento com prefixo dev_ do zero
-- Execute este script no Supabase Studio ou em uma conexão com privilégios de escrita

-- Tabela dev__migrations_log
CREATE TABLE IF NOT EXISTS dev__migrations_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hash TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Tabela dev_activities
CREATE TABLE IF NOT EXISTS dev_activities (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    created_by UUID NOT NULL
);

-- Tabela dev_communities
CREATE TABLE IF NOT EXISTS dev_communities (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Tabela dev_community_members
CREATE TABLE IF NOT EXISTS dev_community_members (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    community_id UUID NOT NULL,
    player_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Tabela dev_community_organizers
CREATE TABLE IF NOT EXISTS dev_community_organizers (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    community_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Tabela dev_competition_members
CREATE TABLE IF NOT EXISTS dev_competition_members (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    competition_id UUID NOT NULL,
    player_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Tabela dev_competitions
CREATE TABLE IF NOT EXISTS dev_competitions (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    community_id UUID NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    prize_pool NUMERIC(10,2),
    status TEXT DEFAULT 'pending'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    created_by UUID DEFAULT auth.uid() NOT NULL,
    CONSTRAINT dev_competitions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'finished'::text, 'cancelled'::text])))
);

-- Tabela dev_game_players
CREATE TABLE IF NOT EXISTS dev_game_players (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    game_id UUID NOT NULL,
    player_id UUID NOT NULL,
    player_name TEXT NOT NULL,
    team INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    CONSTRAINT dev_game_players_team_check CHECK ((team = ANY (ARRAY[1, 2])))
);

-- Tabela dev_games
CREATE TABLE IF NOT EXISTS dev_games (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    competition_id UUID NOT NULL,
    team1 UUID[] DEFAULT '{}'::uuid[],
    team2 UUID[] DEFAULT '{}'::uuid[],
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending'::text,
    rounds JSONB[] DEFAULT '{}'::jsonb[],
    last_round_was_tie BOOLEAN DEFAULT false,
    team1_was_losing_5_0 BOOLEAN DEFAULT false,
    team2_was_losing_5_0 BOOLEAN DEFAULT false,
    is_buchuda BOOLEAN DEFAULT false,
    is_buchuda_de_re BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    CONSTRAINT dev_games_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'finished'::text, 'annulled'::text])))
);

-- Tabela dev_matches
CREATE TABLE IF NOT EXISTS dev_matches (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    game_id UUID,
    winner_team INTEGER,
    points INTEGER DEFAULT 1 NOT NULL,
    victory_type TEXT DEFAULT 'simple'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    CONSTRAINT dev_matches_winner_team_check CHECK ((winner_team = ANY (ARRAY[1, 2])))
);

-- Tabela dev_players
CREATE TABLE IF NOT EXISTS dev_players (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    nickname TEXT,
    phone TEXT,
    created_by UUID DEFAULT auth.uid() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    avatar_url TEXT
);

-- Tabela dev_profiles
CREATE TABLE IF NOT EXISTS dev_profiles (
    id UUID NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Tabela dev_user_player_relations
CREATE TABLE IF NOT EXISTS dev_user_player_relations (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    player_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    is_primary_user BOOLEAN DEFAULT false
);

-- Tabela dev_user_profiles
CREATE TABLE IF NOT EXISTS dev_user_profiles (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    full_name TEXT,
    nickname TEXT,
    phone_number TEXT
);

-- Tabela dev_user_roles
CREATE TABLE IF NOT EXISTS dev_user_roles (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'player'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Tabela dev_whatsapp_group_links
CREATE TABLE IF NOT EXISTS dev_whatsapp_group_links (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    community_id UUID NOT NULL,
    group_name TEXT NOT NULL,
    invite_link TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID DEFAULT auth.uid()
);

-- Habilitar RLS (Row Level Security) para todas as tabelas
ALTER TABLE dev_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_community_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_competition_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_user_player_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_whatsapp_group_links ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança básicas para permitir acesso a usuários autenticados
-- Estas políticas são simplificadas e devem ser ajustadas conforme necessário

-- Políticas para dev_players
CREATE POLICY "Usuários autenticados podem ver jogadores" 
    ON dev_players FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem criar seus próprios jogadores" 
    ON dev_players FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários podem atualizar seus próprios jogadores" 
    ON dev_players FOR UPDATE 
    USING (auth.uid() = created_by);

-- Políticas para dev_communities
CREATE POLICY "Usuários autenticados podem ver comunidades" 
    ON dev_communities FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem criar suas próprias comunidades" 
    ON dev_communities FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários podem atualizar suas próprias comunidades" 
    ON dev_communities FOR UPDATE 
    USING (auth.uid() = created_by);

-- Políticas para dev_competitions
CREATE POLICY "Usuários autenticados podem ver competições" 
    ON dev_competitions FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem criar suas próprias competições" 
    ON dev_competitions FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários podem atualizar suas próprias competições" 
    ON dev_competitions FOR UPDATE 
    USING (auth.uid() = created_by);

-- Políticas para dev_games
CREATE POLICY "Usuários autenticados podem ver jogos" 
    ON dev_games FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar jogos" 
    ON dev_games FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar jogos" 
    ON dev_games FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Verificação final
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name LIKE 'dev_%' 
ORDER BY 
    table_name;