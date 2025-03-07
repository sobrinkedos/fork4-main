import { supabase } from '@/lib/supabase';
import { activityService } from './activityService';

export interface Player {
    id: string;
    name: string;
    phone: string;
    created_at: string;
    nickname?: string;
    created_by: string;
    isLinkedUser?: boolean;
    isMine?: boolean;
    stats?: PlayerStats;
    user_player_relations?: Array<{
        is_primary_user: boolean;
        user_id: string;
    }>;
}

export interface PlayerStats {
    total_games: number;
    wins: number;
    losses: number;
    buchudas: number;
}

interface CreatePlayerDTO {
    name: string;
    phone: string;
}

class PlayerService {
    private players: Player[] = [];

    async getByPhone(phone: string) {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('phone', phone)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
                console.error('Erro ao buscar jogador por telefone:', error);
                throw new Error('Erro ao buscar jogador por telefone');
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar jogador por telefone:', error);
            throw error;
        }
    }

    async create(data: CreatePlayerDTO) {
        try {
            // Verifica se já existe jogador com este telefone
            const existingPlayer = await this.getByPhone(data.phone);
            if (existingPlayer) {
                throw new Error('Já existe um jogador cadastrado com este telefone');
            }

            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            const { data: newPlayer, error } = await supabase
                .from('players')
                .insert([{
                    ...data,
                    created_by: userData.user.id
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Código do PostgreSQL para violação de UNIQUE
                    throw new Error('Já existe um jogador cadastrado com este telefone');
                }
                console.error('Erro ao criar jogador:', error);
                throw new Error('Erro ao criar jogador');
            }

            // Registrar a atividade de criação do jogador com sistema de retry
            if (newPlayer) {
                const maxRetries = 3;
                const baseDelay = 1000; // 1 segundo

                const createActivityWithRetry = async (attempt: number) => {
                    try {
                        console.log(`Tentativa ${attempt} de criar atividade...`);
                        await activityService.createActivity({
                            type: 'player',
                            description: `Novo jogador "${data.name}" foi criado`,
                            metadata: {
                                player_id: newPlayer.id,
                                name: newPlayer.name
                            }
                        });
                        console.log('Atividade criada com sucesso!');
                        return true;
                    } catch (activityError) {
                        console.error(`Erro na tentativa ${attempt}:`, activityError);
                        
                        if (attempt < maxRetries) {
                            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                            console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            return createActivityWithRetry(attempt + 1);
                        }
                        
                        console.error('Todas as tentativas de criar atividade falharam');
                        return false;
                    }
                };

                // Inicia o processo de retry em background
                createActivityWithRetry(1).catch(error => {
                    console.error('Erro no processo de retry:', error);
                });
            }

            // Atualiza a lista de jogadores em memória
            await this.list();

            return newPlayer;
        } catch (error) {
            console.error('Erro ao criar jogador:', error);
            throw error;
        }
    }

    async getPlayerStats(playerId: string): Promise<PlayerStats> {
        try {
            // Buscar total de jogos
            const { count: totalGames } = await supabase
                .from('game_players')
                .select('*', { count: 'exact' })
                .eq('player_id', playerId);

            // Buscar vitórias (quando o jogador está no time vencedor)
            const { data: wins } = await supabase
                .from('game_players')
                .select(`
                    id,
                    games!inner (id, team1_score, team2_score)
                `)
                .eq('player_id', playerId)
                .or(`and(team.eq.1,games.team1_score.gt.games.team2_score),and(team.eq.2,games.team2_score.gt.games.team1_score)`);


            // Buscar buchudas dadas
            const { data: buchudas } = await supabase
                .from('game_players')
                .select(`
                    games!inner (
                        is_buchuda
                    )
                `)
                .eq('player_id', playerId)
                .eq('games.is_buchuda', true);

            return {
                total_games: totalGames || 0,
                wins: wins?.length || 0,
                losses: (totalGames || 0) - (wins?.length || 0),
                buchudas: buchudas?.length || 0
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas do jogador:', error);
            return {
                total_games: 0,
                wins: 0,
                losses: 0,
                buchudas: 0
            };
        }
    }

    async list() {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Buscar jogadores criados pelo usuário
            const { data: myPlayers, error: myPlayersError } = await supabase
                .from('players')
                .select('*, user_player_relations(user_id, is_primary_user)')
                .eq('created_by', userData.user.id)
                .order('name');

            if (myPlayersError) {
                console.error('Erro ao buscar jogadores criados:', myPlayersError);
                throw new Error('Erro ao listar jogadores');
            }

            // Buscar jogadores das comunidades onde sou organizador
            const { data: communityPlayers, error: communityPlayersError } = await supabase
                .from('players')
                .select(`
                    *,
                    user_player_relations(user_id, is_primary_user),
                    community_members!inner (
                        community_id,
                        communities!inner (
                            id,
                            community_organizers!inner (
                                user_id
                            )
                        )
                    )
                `)
                .eq('community_members.communities.community_organizers.user_id', userData.user.id)
                .neq('created_by', userData.user.id) // Excluir jogadores que já estão em myPlayers
                .order('name');

            if (communityPlayersError) {
                console.error('Erro ao buscar jogadores da comunidade:', communityPlayersError);
                throw new Error('Erro ao listar jogadores');
            }

            // Adicionar estatísticas aos jogadores
            const myPlayersWithStats = await Promise.all((myPlayers || []).map(async (player) => {
                const stats = await this.getPlayerStats(player.id);
                return {
                    ...player,
                    stats,
                    isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary_user),
                    isMine: true
                };
            }));

            const communityPlayersWithStats = await Promise.all((communityPlayers || []).map(async (player) => {
                const stats = await this.getPlayerStats(player.id);
                return {
                    ...player,
                    stats,
                    isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary_user),
                    isMine: false
                };
            }));

            return {
                myPlayers: myPlayersWithStats,
                communityPlayers: communityPlayersWithStats
            };
        } catch (error) {
            console.error('Erro ao listar jogadores:', error);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Erro ao buscar jogador:', error);
                throw new Error('Erro ao buscar jogador');
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            throw error;
        }
    }

    async update(id: string, data: Partial<CreatePlayerDTO>) {
        try {
            const { data: updatedPlayer, error } = await supabase
                .from('players')
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar jogador:', error);
                throw new Error('Erro ao atualizar jogador');
            }

            // Atualiza a lista de jogadores em memória
            await this.list();

            return updatedPlayer;
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            throw error;
        }
    }

    async delete(id: string) {
        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Erro ao excluir jogador:', error);
                throw new Error('Erro ao excluir jogador');
            }

            // Atualiza a lista de jogadores em memória
            await this.list();
        } catch (error) {
            console.error('Erro ao excluir jogador:', error);
            throw error;
        }
    }

    async listCompetitionMembers(competitionId: string) {
        try {
            const { data, error } = await supabase
                .from('competition_members')
                .select(`
                    id,
                    player_id,
                    players (id, name)
                `)
                .eq('competition_id', competitionId);

            if (error) {
                console.error('Error fetching competition members:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in listCompetitionMembers:', error);
            throw error;
        }
    }
}

export const playerService = new PlayerService();
