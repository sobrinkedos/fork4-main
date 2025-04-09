-- Script para criar tabelas de desenvolvimento com prefixo dev_
-- Execute este script no Supabase Studio ou em uma conexão com privilégios de escrita

-- Tabela _migrations_log
DROP TABLE IF EXISTS dev__migrations_log CASCADE;
CREATE TABLE dev__migrations_log (LIKE _migrations_log INCLUDING ALL);
INSERT INTO dev__migrations_log SELECT * FROM _migrations_log;

-- Tabela activities
DROP TABLE IF EXISTS dev_activities CASCADE;
CREATE TABLE dev_activities (LIKE activities INCLUDING ALL);
INSERT INTO dev_activities SELECT * FROM activities;

-- Tabela communities
DROP TABLE IF EXISTS dev_communities CASCADE;
CREATE TABLE dev_communities (LIKE communities INCLUDING ALL);
INSERT INTO dev_communities SELECT * FROM communities;

-- Tabela community_members
DROP TABLE IF EXISTS dev_community_members CASCADE;
CREATE TABLE dev_community_members (LIKE community_members INCLUDING ALL);
INSERT INTO dev_community_members SELECT * FROM community_members;

-- Tabela community_organizers
DROP TABLE IF EXISTS dev_community_organizers CASCADE;
CREATE TABLE dev_community_organizers (LIKE community_organizers INCLUDING ALL);
INSERT INTO dev_community_organizers SELECT * FROM community_organizers;

-- Tabela competition_members
DROP TABLE IF EXISTS dev_competition_members CASCADE;
CREATE TABLE dev_competition_members (LIKE competition_members INCLUDING ALL);
INSERT INTO dev_competition_members SELECT * FROM competition_members;

-- Tabela competitions
DROP TABLE IF EXISTS dev_competitions CASCADE;
CREATE TABLE dev_competitions (LIKE competitions INCLUDING ALL);
INSERT INTO dev_competitions SELECT * FROM competitions;

-- Tabela game_players
DROP TABLE IF EXISTS dev_game_players CASCADE;
CREATE TABLE dev_game_players (LIKE game_players INCLUDING ALL);
INSERT INTO dev_game_players SELECT * FROM game_players;

-- Tabela games
DROP TABLE IF EXISTS dev_games CASCADE;
CREATE TABLE dev_games (LIKE games INCLUDING ALL);
INSERT INTO dev_games SELECT * FROM games;

-- Tabela matches
DROP TABLE IF EXISTS dev_matches CASCADE;
CREATE TABLE dev_matches (LIKE matches INCLUDING ALL);
INSERT INTO dev_matches SELECT * FROM matches;

-- Tabela players
DROP TABLE IF EXISTS dev_players CASCADE;
CREATE TABLE dev_players (LIKE players INCLUDING ALL);
INSERT INTO dev_players SELECT * FROM players;

-- Tabela profiles
DROP TABLE IF EXISTS dev_profiles CASCADE;
CREATE TABLE dev_profiles (LIKE profiles INCLUDING ALL);
INSERT INTO dev_profiles SELECT * FROM profiles;

-- Tabela user_player_relations
DROP TABLE IF EXISTS dev_user_player_relations CASCADE;
CREATE TABLE dev_user_player_relations (LIKE user_player_relations INCLUDING ALL);
INSERT INTO dev_user_player_relations SELECT * FROM user_player_relations;

-- Tabela user_profiles
DROP TABLE IF EXISTS dev_user_profiles CASCADE;
CREATE TABLE dev_user_profiles (LIKE user_profiles INCLUDING ALL);
INSERT INTO dev_user_profiles SELECT * FROM user_profiles;

-- Tabela user_roles
DROP TABLE IF EXISTS dev_user_roles CASCADE;
CREATE TABLE dev_user_roles (LIKE user_roles INCLUDING ALL);
INSERT INTO dev_user_roles SELECT * FROM user_roles;

-- Tabela whatsapp_group_links
DROP TABLE IF EXISTS dev_whatsapp_group_links CASCADE;
CREATE TABLE dev_whatsapp_group_links (LIKE whatsapp_group_links INCLUDING ALL);
INSERT INTO dev_whatsapp_group_links SELECT * FROM whatsapp_group_links;

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
