import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import bronzeRank from '@/assets/images/bronze_rank.WEBP';
import silverRank from '@/assets/images/silver_rank.WEBP';
import goldRank from '@/assets/images/gold_rank.WEBP';
import platinumRank from '@/assets/images/platinum_rank.WEBP';
import diamondRank from '@/assets/images/diamond_rank.WEBP';
import eliteRank from '@/assets/images/elite_rank.WEBP';
import championRank from '@/assets/images/champion_rank.WEBP';
import unrealRank from '@/assets/images/unreal_rank.WEBP';
import { PlayerProfile } from '../types/players';

interface RankTier {
  name: string;
  image: string;
  minRating: number;
  maxRating: number | null;
  players: PlayerProfile[];
}

const rankTiers: RankTier[] = [
  { name: 'Unreal', image: unrealRank, minRating: 60, maxRating: null, players: [] },
  { name: 'Champion', image: championRank, minRating: 50, maxRating: 60, players: [] },
  { name: 'Elite', image: eliteRank, minRating: 40, maxRating: 50, players: [] },
  { name: 'Diamond', image: diamondRank, minRating: 30, maxRating: 40, players: [] },
  { name: 'Platinum', image: platinumRank, minRating: 25, maxRating: 30, players: [] },
  { name: 'Gold', image: goldRank, minRating: 20, maxRating: 25, players: [] },
  { name: 'Silver', image: silverRank, minRating: 15, maxRating: 20, players: [] },
  { name: 'Bronze', image: bronzeRank, minRating: 0, maxRating: 15, players: [] },
];

export function Ranks() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [ranksWithPlayers, setRanksWithPlayers] = useState<RankTier[]>(rankTiers);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/players/stats');
        if (!response.ok) throw new Error('Failed to fetch players');
        const data = await response.json();
        setPlayers(data);
        
        // Distribute players into ranks
        const updatedRanks = rankTiers.map(rank => ({
          ...rank,
          players: data.filter((player: PlayerProfile) => 
            player.current_rating >= rank.minRating && 
            (rank.maxRating === null || player.current_rating < rank.maxRating)
          )
        }));
        
        setRanksWithPlayers(updatedRanks);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Rank Divisions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ranksWithPlayers.map((rank) => (
          <Card key={rank.name} className="overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2">
                <img 
                  src={rank.image} 
                  alt={`${rank.name} rank`} 
                  className="w-8 h-8"
                />
                {rank.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm text-muted-foreground mb-2">
                Rating: {rank.minRating}{rank.maxRating ? ` - ${rank.maxRating}` : '+'}
              </div>
              <div className="space-y-1">
                {rank.players.map((player) => (
                  <div key={player.id} className="flex justify-between items-center">
                    <span>{player.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {player.current_rating.toFixed(1)}
                    </span>
                  </div>
                ))}
                {rank.players.length === 0 && (
                  <div className="text-sm text-muted-foreground italic">
                    No players in this rank
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 