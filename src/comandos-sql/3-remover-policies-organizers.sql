-- Remover políticas de community_organizers

DROP POLICY IF EXISTS "Visualizar organizadores" ON community_organizers;

DROP POLICY IF EXISTS "Gerenciar organizadores" ON community_organizers;

DROP POLICY IF EXISTS "Atualizar organizadores" ON community_organizers;

DROP POLICY IF EXISTS "Excluir organizadores" ON community_organizers;

DROP POLICY IF EXISTS "select_community_organizers" ON community_organizers;

DROP POLICY IF EXISTS "insert_community_organizers" ON community_organizers;

DROP POLICY IF EXISTS "update_community_organizers" ON community_organizers;

DROP POLICY IF EXISTS "delete_community_organizers" ON community_organizers;