-- ==========================================
-- Arquivo: 20250307_add_get_competition_by_id.sql
-- ==========================================

-- Create a function to get competition details by ID with proper authorization
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
BEGIN
    SELECT c.*
    INTO v_competition
    FROM competitions c
    WHERE c.id = p_competition_id
    AND (
        -- User is the creator of the competition
        c.created_by = p_user_id
        OR
        -- User is the creator of the community
        EXISTS (
            SELECT 1
            FROM communities comm
            WHERE comm.id = c.community_id
            AND comm.created_by = p_user_id
        )
        OR
        -- User is an organizer of the community
        EXISTS (
            SELECT 1
            FROM community_organizers co
            WHERE co.community_id = c.community_id
            AND co.user_id = p_user_id
        )
        OR
        -- User has a player in the competition
        EXISTS (
            SELECT 1
            FROM competition_members cm
            JOIN players p ON p.id = cm.player_id
            WHERE cm.competition_id = c.id
            AND p.created_by = p_user_id
        )
    );

    RETURN v_competition;
END;
$$;

-- ==========================================
-- Arquivo: 20250308_fix_competition_members_policies.sql
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Criador tem acesso total aos membros" ON competition_members;

-- Enable RLS
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;

-- Create new policy for competition_members
CREATE POLICY "Gerenciar membros da competição"
    ON competition_members FOR ALL
    TO authenticated
    USING (
        -- User is the creator of the competition
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        )
        OR
        -- User is the creator of the community
        EXISTS (
            SELECT 1 FROM competitions c
            JOIN communities comm ON comm.id = c.community_id
            WHERE c.id = competition_id
            AND comm.created_by = auth.uid()
        )
        OR
        -- User is an organizer of the community
        EXISTS (
            SELECT 1 FROM competitions c
            JOIN community_organizers co ON co.community_id = c.community_id
            WHERE c.id = competition_id
            AND co.user_id = auth.uid()
        )
        OR
        -- User is the owner of the player being added/viewed
        EXISTS (
            SELECT 1 FROM players p
            WHERE p.id = player_id
            AND p.created_by = auth.uid()
        )
    )
    WITH CHECK (
        -- User is the creator of the competition
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        )
        OR
        -- User is the creator of the community
        EXISTS (
            SELECT 1 FROM competitions c
            JOIN communities comm ON comm.id = c.community_id
            WHERE c.id = competition_id
            AND comm.created_by = auth.uid()
        )
        OR
        -- User is an organizer of the community
        EXISTS (
            SELECT 1 FROM competitions c
            JOIN community_organizers co ON co.community_id = c.community_id
            WHERE c.id = competition_id
            AND co.user_id = auth.uid()
        )
        OR
        -- User is the owner of the player being added
        EXISTS (
            SELECT 1 FROM players p
            WHERE p.id = player_id
            AND p.created_by = auth.uid()
        )
    );

-- ==========================================
-- Arquivo: 20250401_add_is_active_to_communities.sql
-- ==========================================

-- Adiciona a coluna is_active à tabela communities
ALTER TABLE communities
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Atualiza as políticas para considerar o campo is_active
DROP POLICY IF EXISTS "communities_select_policy" ON communities;

-- Policy for viewing communities (everyone can view active communities)
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR is_active = TRUE);

-- ==========================================
-- Arquivo: 20250402101718_whatsapp_integration.sql
-- ==========================================

-- Migração para adicionar suporte a integração com WhatsApp

-- Criar tabela para armazenar links de grupos do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_group_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    invite_link TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por community_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_links_community_id ON whatsapp_group_links(community_id);

-- Adicionar permissões RLS (Row Level Security)
ALTER TABLE whatsapp_group_links ENABLE ROW LEVEL SECURITY;

-- Política para visualização de links (qualquer pessoa pode ver)
CREATE POLICY "Links de grupos do WhatsApp são visíveis para todos" 
    ON whatsapp_group_links FOR SELECT 
    USING (true);

-- Política para inserção de links (apenas organizadores da comunidade)
CREATE POLICY "Apenas organizadores podem adicionar links de grupos" 
    ON whatsapp_group_links FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM community_organizers 
            WHERE community_organizers.community_id = whatsapp_group_links.community_id 
            AND community_organizers.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = whatsapp_group_links.community_id 
            AND communities.created_by = auth.uid()
        )
    );

-- Política para atualização de links (apenas organizadores da comunidade)
CREATE POLICY "Apenas organizadores podem atualizar links de grupos" 
    ON whatsapp_group_links FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM community_organizers 
            WHERE community_organizers.community_id = whatsapp_group_links.community_id 
            AND community_organizers.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = whatsapp_group_links.community_id 
            AND communities.created_by = auth.uid()
        )
    );

-- Política para exclusão de links (apenas organizadores da comunidade)
CREATE POLICY "Apenas organizadores podem excluir links de grupos" 
    ON whatsapp_group_links FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM community_organizers 
            WHERE community_organizers.community_id = whatsapp_group_links.community_id 
            AND community_organizers.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = whatsapp_group_links.community_id 
            AND communities.created_by = auth.uid()
        )
    );

-- ==========================================
-- Arquivo: 20250402_fix_communities_update_policy.sql
-- ==========================================

-- Corrige a política de atualização de comunidades para permitir que o criador edite suas próprias comunidades

-- Primeiro, verifica se a política existe e a remove
DROP POLICY IF EXISTS "communities_update_policy" ON communities;

-- Recria a política de atualização para comunidades (apenas o criador pode atualizar)
CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

