import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Users, TrendingUp, TrendingDown, ArrowUp, ArrowDown, User, Award, Medal, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PlayerProfile } from "@/types/player"
import { cn } from '@/lib/utils'
import { MatchResult } from "@/components/MatchResult"
import unrealBg from '../assets/images/unreal_bg.png';
import bronzeBg from '../assets/images/bronze_bg.png';
import championBg from '../assets/images/champion_bg.png';
import eliteBg from '../assets/images/elite_bg.png';
import diamondBg from '../assets/images/diamond_bg.png';
import platinumBg from '../assets/images/platinum_bg.png';
import goldBg from '../assets/images/gold_bg.png';
import silverBg from '../assets/images/silver_bg.png';
import bronzeRank from '../assets/images/bronze_rank.WEBP';
import silverRank from '../assets/images/silver_rank.WEBP';
import goldRank from '../assets/images/gold_rank.WEBP';
import platinumRank from '../assets/images/platinum_rank.WEBP';
import diamondRank from '../assets/images/diamond_rank.WEBP';
import eliteRank from '../assets/images/elite_rank.WEBP';
import championRank from '../assets/images/champion_rank.WEBP';
import unrealRank from '../assets/images/unreal_rank.WEBP';

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

const getRankBackground = (rating: number) => {
  if (rating >= 60) return unrealBg;
  if (rating >= 50) return championBg;
  if (rating >= 40) return eliteBg;
  if (rating >= 30) return diamondBg;
  if (rating >= 25) return platinumBg;
  if (rating >= 20) return goldBg;
  if (rating >= 15) return silverBg;
  return bronzeBg;
};

const StatItem = ({ icon: Icon, label, value }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number 
}) => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-card">
    <div className="p-3 bg-primary/10 rounded-xl">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  </div>
);

interface PlayerDetailsDialogProps {
  player: PlayerProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  ratingHistory: Array<{ date: string; rating: number }>
  getPlayerRank: (playerId: string) => number
  players: PlayerProfile[]
}

interface RecentMatch {
  match_date: string;
  player1_name: string;
  player2_name: string;
  player3_name: string;
  player4_name: string;
  team1_score: number;
  team2_score: number;
  player_team: 1 | 2;
}

export function PlayerDetailsDialog({
  player,
  open,
  onOpenChange,
  ratingHistory,
  getPlayerRank,
  players,
}: PlayerDetailsDialogProps) {
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);

  useEffect(() => {
    if (player) {
      fetch(`http://localhost:5000/api/players/${player.id}/recent-matches`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setRecentMatches(data);
          } else {
            console.error('Received non-array data:', data);
            setRecentMatches([]);
          }
        })
        .catch(err => {
          console.error('Error fetching recent matches:', err);
          setRecentMatches([]);
        });
    }
  }, [player]);

  if (!player) return null

  const rank = getPlayerRank(player.id);
  const rankColor = 'bg-zinc-900';
  const maxMatchesPlayed = Math.max(...players.map(p => p.matches_played || 0));

  const nonZeroMOLs = players
    .filter(p => p.average_mol && p.average_mol > 0)
    .map(p => p.average_mol!)
    .sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-1 overflow-hidden border-none bg-white max-h-[90vh]">
        <DialogTitle className="sr-only">
          Player Details for {player?.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detailed statistics and match history for {player?.name}
        </DialogDescription>

        <div className={cn(
          "h-[240px] w-full px-8 flex flex-col justify-center relative",
          rankColor,
        )}>
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {player.avatar_url ? (
              <img
                src={`http://localhost:5000${player.avatar_url}`}
                alt={`${player.name}'s avatar`}
                className="absolute w-full h-full object-cover"
                style={{ 
                  filter: 'blur(0px) brightness(0.6)',
                  objectFit: 'cover',
                  objectPosition: 'center center'
                }}
              />
            ) : (
              <div
                className="absolute w-full h-full"
                style={{ 
                  backgroundImage: `url(${getRankBackground(player.current_rating)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'brightness(0.6)'
                }}
              />
            )}
          </div>
          <div className="relative z-10 flex flex-col">
            <h2 className="text-3xl font-bold text-white mb-1">{player.name}</h2>
            <div className="space-y-1 text-white">
              <div className="text-2x1 text-white/80 mb-8">{player.role}</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Rank:</span>
                <span>#{rank}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Rating:</span>
                <span>{player.current_rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Tier:</span>
                <div className="flex items-center gap-2">

                  <span>{getRankTier(player.current_rating).name}</span>
                  <img 
                    src={getRankTier(player.current_rating).image} 
                    alt="Rank" 
                    className="w-6 h-6" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="w-full mb-1">
            <TabsTrigger value="simple" className="flex-1">Simple Stats</TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1">Advanced Stats</TabsTrigger>
          </TabsList>

          <div 
            className="p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent" 
            style={{ 
              maxHeight: 'calc(90vh - 300px)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(209 213 219) transparent'
            }}
          >
            <TabsContent value="simple">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="rounded-lg p-4"
                    style={{
                      background: `linear-gradient(to right, 
                        rgb(187, 247, 208) 0%,
                        rgb(187, 247, 208) ${(player.matches_played / maxMatchesPlayed * 100) - 10}%, 
                        rgb(254, 202, 202) ${(player.matches_played / maxMatchesPlayed * 100) + 10}%,
                        rgb(254, 202, 202) 100%
                      )`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${(player.matches_played / maxMatchesPlayed * 100) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {player.matches_played}
                        </div>
                        <div className="text-sm text-muted-foreground">Matches Played</div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-lg p-4"
                    style={{
                      background: `linear-gradient(to right, 
                        rgb(187, 247, 208) 0%,
                        rgb(187, 247, 208) ${(player.wins / (player.wins + player.losses) * 100 - 10)}%, 
                        rgb(254, 202, 202) ${(player.wins / (player.wins + player.losses) * 100 + 10)}%,
                        rgb(254, 202, 202) 100%
                      )`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Medal className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <div className="text-xl font-bold text-green-600">{player.wins}</div>
                          <div className="mx-2 text-gray-400">/</div>
                          <div className="text-xl font-bold text-red-600">{player.losses}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">Wins / Losses</div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-lg p-4"
                    style={{
                      background: `linear-gradient(to right, 
                        rgb(187, 247, 208) 0%,
                        rgb(187, 247, 208) ${player.win_rate - 10}%, 
                        rgb(254, 202, 202) ${player.win_rate + 10}%,
                        rgb(254, 202, 202) 100%
                      )`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${player.win_rate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {player.win_rate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-lg p-4"
                    style={{
                      background: `linear-gradient(to right, 
                        rgb(187, 247, 208) 0%,
                        rgb(187, 247, 208) ${((player.average_mov || 0) / Math.max(...players.map(p => p.average_mov || 0)) * 100) - 10}%, 
                        rgb(254, 202, 202) ${((player.average_mov || 0) / Math.max(...players.map(p => p.average_mov || 0)) * 100) + 10}%,
                        rgb(254, 202, 202) 100%
                      )`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <ArrowUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${
                          ((player.average_mov || 0) / Math.max(...players.map(p => p.average_mov || 0)) * 100) >= 50 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {player.average_mov ? player.average_mov.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Average Margin of Victory</div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-lg p-4"
                    style={{
                      background: `linear-gradient(to left, 
                        rgb(254, 202, 202) 0%,
                        rgb(254, 202, 202) ${((player.average_mol || 0) / Math.max(...players.filter(p => p.average_mol && p.average_mol > 0).map(p => p.average_mol!)) * 100) - 10}%, 
                        rgb(187, 247, 208) ${((player.average_mol || 0) / Math.max(...players.filter(p => p.average_mol && p.average_mol > 0).map(p => p.average_mol!)) * 100) + 10}%,
                        rgb(187, 247, 208) 100%
                      )`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <ArrowDown className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${
                          (() => {
                            const median = nonZeroMOLs.length ? nonZeroMOLs[Math.floor(nonZeroMOLs.length / 2)] : 0;
                            return !player.average_mol || player.average_mol <= median
                              ? 'text-green-600'
                              : 'text-red-600';
                          })()
                        }`}>
                          {player.average_mol ? player.average_mol.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Average Margin of Loss</div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-lg p-4"
                    style={{
                      background: `linear-gradient(to right, 
                        rgb(187, 247, 208) 0%,
                        rgb(187, 247, 208) ${((player.win_streak || 0) / Math.max(...players.map(p => p.win_streak || 0)) * 100) - 10}%, 
                        rgb(254, 202, 202) ${((player.win_streak || 0) / Math.max(...players.map(p => p.win_streak || 0)) * 100) + 10}%,
                        rgb(254, 202, 202) 100%
                      )`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Activity className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${
                          (() => {
                            const streaks = players.map(p => p.win_streak || 0).sort((a, b) => a - b);
                            const median = streaks[Math.ceil(streaks.length / 2)] + 1;
                            return (player.win_streak || 0) >= median ? 'text-green-600' : 'text-red-600';
                          })()
                        }`}>
                          {player.win_streak || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Highest Win Streak</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Recent Matches</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.isArray(recentMatches) && recentMatches.map((match, index) => (
                      <MatchResult key={index} {...match} />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="space-y-6">
                <div className="p-4 bg-card rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Rating History</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={ratingHistory}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value: number) => value.toFixed(2)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatItem 
                    icon={Users} 
                    label="Rating Deviation" 
                    value={`±${player.rating_deviation.toFixed(1)}`} 
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 