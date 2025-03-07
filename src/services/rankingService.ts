import { supabase } from '@/lib/supabase';

export interface PlayerRanking {
    id: string;
    name: string;
    wins: number;
    totalGames: number;
    buchudas: number;
    buchudasDeRe: number;
    winRate: number;
}

export interface PairRanking {
    id: string;
    player1: {
        id: string;
        name: string;
    };
    player2: {
        id: string;
        name: string;
    };
    wins: number;
    totalGames: number;
    buchudas: number;
    buchudasDeRe: number;
    winRate: number;
}

export const rankingService = {
    async getTopPlayers(communityId?: string): Promise<PlayerRanking[]> {
        console.log('RankingService: Iniciando busca de jogadores...');
        const userId = (await supabase.auth.getUser()).data.user?.id;

        if (!userId) {
            console.error('RankingService: Usuário não autenticado');
            return [];
        }

        let communityIds: string[] = [];
        
        if (communityId) {
            // Se um ID de comunidade específico foi fornecido, use apenas ele
            communityIds = [communityId];
        } else {
            // Caso contrário, busque todas as comunidades do usuário
            const { data: memberCommunities } = await supabase
                .from('community_members')
                .select('community_id')
                .eq('player_id', userId);

            const { data: organizerCommunities } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', userId);

            communityIds = [
                ...(memberCommunities?.map(c => c.community_id) || []),
                ...(organizerCommunities?.map(c => c.community_id) || [])
            ];
        }

        if (communityIds.length === 0) {
            console.log('RankingService: Usuário não pertence a nenhuma comunidade');
            return [];
        }

        // Buscar jogadores das comunidades
        const { data: communityMembers } = await supabase
            .from('community_members')
            .select(`
                player_id,
                players (id, name)
            `)
            .in('community_id', communityIds);

        if (!communityMembers || communityMembers.length === 0) {
            console.log('RankingService: Nenhum jogador encontrado nas comunidades');
            return [];
        }

        // Extrair IDs únicos dos jogadores
        const playerIds = [...new Set(communityMembers
            .filter(member => member.players)
            .map(member => member.players.id))];

        // Buscar estatísticas dos jogadores
        console.log('PlayerIds para busca:', playerIds);
        
        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('*')
            .neq('status', 'pending')
            .order('created_at', { ascending: false });

        if (gamesError) {
            console.error('Erro ao buscar jogos:', gamesError);
            return [];
        }

        console.log('Jogos encontrados:', games);

        console.log('Todos os jogos:', games?.map(g => ({
            id: g.id,
            team1: g.team1,
            team2: g.team2,
            winner_team: g.winner_team,
            winner_team_raw: JSON.stringify(g.winner_team),
            is_buchuda: g.is_buchuda,
            is_buchuda_raw: JSON.stringify(g.is_buchuda),
            is_buchuda_de_re: g.is_buchuda_de_re,
            is_buchuda_de_re_raw: JSON.stringify(g.is_buchuda_de_re)
        })));

        // Calcular estatísticas para cada jogador
        const playerStats = playerIds.map(playerId => {
            const playerGames = games?.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                return team1.includes(playerId) || team2.includes(playerId);
            }) || [];

            console.log(`Jogos do jogador ${playerId}:`, playerGames.map(g => ({
                id: g.id,
                team1: g.team1,
                team2: g.team2,
                winner_team: g.winner_team,
                winner_team_raw: JSON.stringify(g.winner_team),
                is_buchuda: g.is_buchuda,
                is_buchuda_raw: JSON.stringify(g.is_buchuda),
                is_buchuda_de_re: g.is_buchuda_de_re,
                is_buchuda_de_re_raw: JSON.stringify(g.is_buchuda_de_re)
            })));

            const wins = playerGames.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                const isTeam1 = team1.includes(playerId);
                const isTeam2 = team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                
                console.log(`Calculando vitória para jogo ${game.id}:`, {
                    playerId,
                    team1,
                    team2,
                    isTeam1,
                    isTeam2,
                    team1_score: game.team1_score,
                    team2_score: game.team2_score,
                    isWinner
                });
                
                return isWinner;
            }).length;
            
            const totalGames = playerGames.length;

            const buchudas = playerGames.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                const isTeam1 = team1.includes(playerId);
                const isTeam2 = team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                const isBuchuda = game.is_buchuda === true && 
                                ((isTeam1 && game.team2_score === 0) || 
                                 (isTeam2 && game.team1_score === 0));
                
                console.log(`Calculando buchuda para jogo ${game.id}:`, {
                    playerId,
                    team1,
                    team2,
                    isTeam1,
                    isTeam2,
                    team1_score: game.team1_score,
                    team2_score: game.team2_score,
                    is_buchuda: game.is_buchuda,
                    isWinner,
                    isBuchuda
                });
                
                return isWinner && isBuchuda;
            }).length;
            
            const buchudasDeRe = playerGames.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                const isTeam1 = team1.includes(playerId);
                const isTeam2 = team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                const isBuchudaRe = game.is_buchuda_de_re === true;
                
                console.log(`Calculando buchuda de ré para jogo ${game.id}:`, {
                    playerId,
                    team1,
                    team2,
                    isTeam1,
                    isTeam2,
                    team1_score: game.team1_score,
                    team2_score: game.team2_score,
                    is_buchuda_de_re: game.is_buchuda_de_re,
                    isWinner,
                    isBuchudaRe
                });
                
                return isWinner && isBuchudaRe;
            }).length;

            console.log(`Estatísticas finais para jogador ${playerId}:`, {
                totalGames,
                wins,
                buchudas,
                buchudasDeRe,
                winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0
            });

            const player = communityMembers.find(member => 
                member.players && member.players.id === playerId
            )?.players;

            return {
                id: playerId,
                name: player?.name || 'Jogador Desconhecido',
                wins,
                totalGames,
                buchudas,
                buchudasDeRe,
                winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0
            };
        });

        console.log('Estatísticas finais:', playerStats);

        // Ordenar por vitórias e taxa de vitória
        return playerStats.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.winRate - a.winRate;
        });
    },

    async getTopPairs(communityId?: string): Promise<PairRanking[]> {
        try {
            console.log('RankingService: Iniciando busca de duplas...');
            const userId = (await supabase.auth.getUser()).data.user?.id;

            if (!userId) {
                console.error('RankingService: Usuário não autenticado');
                return [];
            }

            let communityIds: string[] = [];
            
            if (communityId) {
                // Se um ID de comunidade específico foi fornecido, use apenas ele
                communityIds = [communityId];
            } else {
                // Caso contrário, busque todas as comunidades do usuário
                const { data: memberCommunities } = await supabase
                    .from('community_members')
                    .select('community_id')
                    .eq('player_id', userId);

                const { data: organizerCommunities } = await supabase
                    .from('community_organizers')
                    .select('community_id')
                    .eq('user_id', userId);

                communityIds = [
                    ...(memberCommunities?.map(c => c.community_id) || []),
                    ...(organizerCommunities?.map(c => c.community_id) || [])
                ];
            }

            if (communityIds.length === 0) {
                console.log('RankingService: Usuário não pertence a nenhuma comunidade');
                return [];
            }

            // Buscar jogadores das comunidades
            const { data: communityMembers } = await supabase
                .from('community_members')
                .select(`
                    player_id,
                    players (id, name)
                `)
                .in('community_id', communityIds);

            if (!communityMembers || communityMembers.length === 0) {
                console.log('RankingService: Nenhum jogador encontrado nas comunidades');
                return [];
            }

            // Extrair IDs únicos dos jogadores
            const playerIds = [...new Set(communityMembers
                .filter(member => member.players)
                .map(member => member.players.id))];

            // Buscar todos os jogos
            const { data: games, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .neq('status', 'pending');

            if (gamesError) {
                console.error('RankingService: Erro ao buscar jogos:', gamesError.message);
                throw gamesError;
            }

            if (!games || games.length === 0) {
                console.log('RankingService: Nenhum jogo encontrado');
                return [];
            }

            // Processar estatísticas por dupla
            const pairStats = new Map<string, {
                id: string;
                player1: { id: string; name: string; };
                player2: { id: string; name: string; };
                wins: number;
                totalGames: number;
                buchudas: number;
                buchudasDeRe: number;
            }>();

            // Processar jogos
            games.forEach(game => {
                const team1Players = game.team1 || [];
                const team2Players = game.team2 || [];

                // Verificar se os jogadores pertencem às comunidades do usuário
                const processTeam = (teamPlayers: string[]) => {
                    if (teamPlayers.length === 2 && 
                        teamPlayers.every(playerId => playerIds.includes(playerId))) {
                        const [player1Id, player2Id] = teamPlayers;
                        const player1 = communityMembers.find(m => m.players?.id === player1Id)?.players;
                        const player2 = communityMembers.find(m => m.players?.id === player2Id)?.players;

                        if (player1 && player2) {
                            const pairId = [player1Id, player2Id].sort().join('-');
                            const stats = pairStats.get(pairId) || {
                                id: pairId,
                                player1: { id: player1.id, name: player1.name },
                                player2: { id: player2.id, name: player2.name },
                                wins: 0,
                                totalGames: 0,
                                buchudas: 0,
                                buchudasDeRe: 0
                            };
                            return { pairId, stats };
                        }
                    }
                    return null;
                };

                // Processar time 1
                const team1Result = processTeam(team1Players);
                if (team1Result) {
                    const { pairId, stats } = team1Result;
                    stats.totalGames++;
                    if (game.team1_score > game.team2_score) {
                        stats.wins++;
                        if (game.is_buchuda && game.team2_score === 0) {
                            stats.buchudas++;
                        }
                        if (game.is_buchuda_de_re) {
                            stats.buchudasDeRe++;
                        }
                    }
                    pairStats.set(pairId, stats);
                }

                // Processar time 2
                const team2Result = processTeam(team2Players);
                if (team2Result) {
                    const { pairId, stats } = team2Result;
                    stats.totalGames++;
                    if (game.team2_score > game.team1_score) {
                        stats.wins++;
                        if (game.is_buchuda && game.team1_score === 0) {
                            stats.buchudas++;
                        }
                        if (game.is_buchuda_de_re) {
                            stats.buchudasDeRe++;
                        }
                    }
                    pairStats.set(pairId, stats);
                }
            });

            // Calcular ranking final
            const rankings = Array.from(pairStats.values())
                .filter(stats => stats.totalGames > 0)
                .map(stats => ({
                    ...stats,
                    winRate: (stats.wins / stats.totalGames) * 100
                }))
                .sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return b.winRate - a.winRate;
                });

            console.log('RankingService: Rankings de duplas calculados:', rankings.length);
            return rankings;
        } catch (error) {
            console.error('RankingService: Erro ao buscar ranking de duplas:', error);
            throw error;
        }
    }
};
