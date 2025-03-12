"use client"

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Zap, TrendingUp, TrendingDown } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlayerDetailsDialog } from "@/components/PlayerDetailsDialog"
import { Dialog } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import bronzeRank from '../assets/images/bronze_rank.WEBP';
import silverRank from '../assets/images/silver_rank.WEBP';
import goldRank from '../assets/images/gold_rank.WEBP';
import platinumRank from '../assets/images/platinum_rank.WEBP';
import diamondRank from '../assets/images/diamond_rank.WEBP';
import eliteRank from '../assets/images/elite_rank.WEBP';
import championRank from '../assets/images/champion_rank.WEBP';
import unrealRank from '../assets/images/unreal_rank.WEBP';
import bronzeBg from '../assets/images/bronze_bg.png';
import silverBg from '../assets/images/silver_bg.png';
import goldBg from '../assets/images/gold_bg.png';
import platinumBg from '../assets/images/platinum_bg.png';
import diamondBg from '../assets/images/diamond_bg.png';
import eliteBg from '../assets/images/elite_bg.png';
import championBg from '../assets/images/champion_bg.png';
import unrealBg from '../assets/images/unreal_bg.png';

interface PlayerProfile {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  current_rating: number;
  rating_deviation: number;
  wins: number;
  losses: number;
  win_rate: number;
  matches_played: number;
  average_mov?: number;
  average_mol?: number;
  win_streak?: number;
  loss_streak?: number;
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  trend?: string
  highlight?: boolean
}

function StatCard({ icon, label, value, trend, highlight }: StatCardProps) {
  return (
    <div className="flex items-center gap-4">
      {icon}
      <div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {trend && <span className="text-sm font-medium text-green-500">{trend}</span>}
        </div>
      </div>
    </div>
  )
}

interface RatingHistory {
  date: string;
  rating: number;
}

const ranks = [
  { 
    name: 'Bronze', 
    range: '<15', 
    icon: bronzeRank,
    background: bronzeBg
  },
  { 
    name: 'Silver', 
    range: '15 – 20', 
    icon: silverRank,
    background: silverBg
  },
  { 
    name: 'Gold', 
    range: '20 – 25', 
    icon: goldRank,
    background: goldBg
  },
  { 
    name: 'Platinum', 
    range: '25 – 30', 
    icon: platinumRank,
    background: platinumBg
  },
  { 
    name: 'Diamond', 
    range: '30 – 40', 
    icon: diamondRank,
    background: diamondBg
  },
  { 
    name: 'Elite', 
    range: '40 – 50', 
    icon: eliteRank,
    background: eliteBg
  },
  { 
    name: 'Champion', 
    range: '50 – 60', 
    icon: championRank,
    background: championBg
  },
  { 
    name: 'Unreal', 
    range: '60+', 
    icon: unrealRank,
    background: unrealBg
  },
];

const getRankTier = (rating: number) => {
  if (rating >= 60) return { name: 'Unreal', image: unrealRank };
  if (rating >= 50) return { name: 'Champion', image: championRank };
  if (rating >= 40) return { name: 'Elite', image: eliteRank };
  if (rating >= 30) return { name: 'Diamond', image: diamondRank };
  if (rating >= 25) return { name: 'Platinum', image: platinumRank };
  if (rating >= 20) return { name: 'Gold', image: goldRank };
  if (rating >= 15) return { name: 'Silver', image: silverRank };
  return { name: 'Bronze', image: bronzeRank };
};

export default function Analytics() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [activeTab, setActiveTab] = useState("simple");
  const [ratingHistory, setRatingHistory] = useState<RatingHistory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPlayerStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/players/stats');
      if (!response.ok) throw new Error('Failed to fetch player stats');
      const data = await response.json();
      console.log('API Response:', data);
      console.log('First player avatar_url:', data[0]?.avatar_url);
      setPlayers(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch player statistics.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPlayerStats();
  }, []);

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stats/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to update stats');
      
      // Refresh the player data after updating stats
      fetchPlayerStats();
      
      toast({
        title: "Success",
        description: "Player statistics updated successfully",
      });
    } catch (error) {
      console.error('Error updating stats:', error);
      toast({
        title: "Error",
        description: "Failed to update player statistics",
        variant: "destructive",
      });
    }
  };

  const fetchRatingHistory = async (playerId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/players/${playerId}/rating-history`);
      if (!response.ok) throw new Error('Failed to fetch rating history');
      const data = await response.json();
      setRatingHistory(data);
    } catch (error) {
      console.error('Error fetching rating history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rating history.",
        variant: "destructive",
      });
    }
  };

  const handlePlayerClick = (player: PlayerProfile) => {
    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer(null);
      setRatingHistory([]);
      setDialogOpen(false);
    } else {
      setSelectedPlayer(player);
      fetchRatingHistory(player.id);
      setDialogOpen(true);
    }
  };

  useEffect(() => {
    if (selectedPlayer) {
      console.log('Selected player state:', selectedPlayer);
      console.log('Selected player avatar URL:', `http://localhost:5000${selectedPlayer.avatar_url}`);
    }
  }, [selectedPlayer]);

  const getPlayerRank = (playerId: string) => {
    // Sort players by rating in descending order
    const sortedPlayers = [...players].sort((a, b) => b.current_rating - a.current_rating);
    // Find the index of the player and add 1 for human-readable rank
    return sortedPlayers.findIndex(p => p.id === playerId) + 1;
  };

  return (
    <div className="container px-4 md:px-6 pt-8 space-y-4">
      <h2 className="text-2xl font-bold">Rank Tier</h2>

      <div className="relative">
        <div className="flex justify-between items-center gap-4 relative">
          {ranks.map((rank) => (
            <Card key={rank.name} className="flex-1 group">
              <div className="relative min-w-[100px] rounded-xl overflow-hidden">
                <div className="absolute inset-0 z-0 rounded-xl" />
                <div className="p-3 rounded-xl relative z-10 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 relative mb-1">
                    <img 
                      src={rank.icon} 
                      alt={`${rank.name} rank`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <h2 className="text-base font-bold text-black">{rank.name}</h2>
                    <p className="text-sm text-gray-600">Rating: {rank.range}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <h2 className="text-2xl font-bold">Player Rankings</h2>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          onClick={updateStats}
          className="relative overflow-hidden whitespace-nowrap"
          style={{
            backgroundImage: `url(${unrealBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          Update Stats
        </Button>
      </div>

      <PlayerDetailsDialog 
        player={selectedPlayer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ratingHistory={ratingHistory}
        getPlayerRank={getPlayerRank}
        players={players}
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers.map((player) => (
          <Card
            key={player.id}
            className="cursor-pointer transition-all hover:shadow-lg overflow-hidden h-48"
            onClick={() => handlePlayerClick(player)}
          >
            <div className="flex h-full">
              <div className="w-1/2 relative bg-muted flex items-center justify-center"
                style={{ 
                  background: `url(${getRankTier(player.current_rating).name === 'Unreal' ? unrealBg :
                              getRankTier(player.current_rating).name === 'Champion' ? championBg :
                              getRankTier(player.current_rating).name === 'Elite' ? eliteBg :
                              getRankTier(player.current_rating).name === 'Diamond' ? diamondBg :
                              getRankTier(player.current_rating).name === 'Platinum' ? platinumBg :
                              getRankTier(player.current_rating).name === 'Gold' ? goldBg :
                              getRankTier(player.current_rating).name === 'Silver' ? silverBg :
                              bronzeBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {player.avatar_url ? (
                  <img
                    src={`http://localhost:5000${player.avatar_url}`}
                    alt={player.name}
                    className="h-full w-full object-cover"
                    style={{ 
                      imageRendering: 'crisp-edges',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                    onError={() => {
                      console.log('Image failed to load for:', player.name);
                    }}
                  />
                ) : (
                  <span className="text-3xl font-semibold text-white">
                    {player.name.charAt(0)}
                  </span>
                )}
              </div>
              <CardContent className="flex-1 p-4">
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-lg truncate">{player.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{player.role}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-black   w-14">Tier:</span>
                      <Badge variant="outline" className="text-sm text-black border-none bg-transparent hover:bg-transparent w-fit flex items-center gap-2">
                      <span className="text-sm font-normal">
                        {getRankTier(player.current_rating).name}
                      </span>
                        <img 
                          src={getRankTier(player.current_rating).image} 
                          alt="Rank" 
                          className="w-6 h-6" 
                        />                      


                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-black  w-14">Rating:</span>
                      <span className="text-sm">{player.current_rating.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-black  w-14">Rank:</span>
                      <span className="text-sm">#{getPlayerRank(player.id)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}