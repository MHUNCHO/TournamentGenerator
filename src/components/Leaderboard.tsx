import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardProps {
  matches: Array<{
    players: string[];
    team1Score: number;
    team2Score: number;
  }>;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-700" />;
    default:
      return <span className="h-4 w-4" />; // Empty span with same dimensions
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-yellow-50 font-bold';
    case 2:
      return 'bg-gray-50 font-semibold';
    case 3:
      return 'bg-amber-50 font-semibold';
    default:
      return '';
  }
};

export function Leaderboard({ matches }: LeaderboardProps) {
  const playerStats = matches.reduce((stats: Record<string, { wins: number; losses: number; pointsFor: number; pointsAgainst: number }>, match) => {
    // Skip matches without scores
    if (match.team1Score === 0 && match.team2Score === 0) return stats;

    // Get team 1 players (first two players)
    const team1Players = match.players.slice(0, 2);
    // Get team 2 players (last two players)
    const team2Players = match.players.slice(2, 4);

    // Determine if team 1 won
    const team1Won = match.team1Score > match.team2Score;

    // Update stats for team 1 players
    team1Players.forEach(player => {
      if (!stats[player]) {
        stats[player] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
      }
      if (team1Won) {
        stats[player].wins += 1;
      } else {
        stats[player].losses += 1;
      }
      stats[player].pointsFor += match.team1Score;
      stats[player].pointsAgainst += match.team2Score;
    });

    // Update stats for team 2 players
    team2Players.forEach(player => {
      if (!stats[player]) {
        stats[player] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
      }
      if (!team1Won) {
        stats[player].wins += 1;
      } else {
        stats[player].losses += 1;
      }
      stats[player].pointsFor += match.team2Score;
      stats[player].pointsAgainst += match.team1Score;
    });

    return stats;
  }, {});

  // Convert to array and sort
  const sortedPlayers = Object.entries(playerStats)
    .map(([name, stats]) => ({
      name,
      wins: stats.wins,
      losses: stats.losses,
      pointsFor: stats.pointsFor,
      pointsAgainst: stats.pointsAgainst
    }))
    .sort((a, b) => {
      // Sort by wins first
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Then by point difference
      const aPointDiff = a.pointsFor - a.pointsAgainst;
      const bPointDiff = b.pointsFor - b.pointsAgainst;
      return bPointDiff - aPointDiff;
    });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Leaderboard</CardTitle>
        <CardDescription>
          Player rankings and statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">#</TableHead>
                <TableHead className="w-40">Player</TableHead>
                <TableHead className="w-20 text-right">W/L</TableHead>
                <TableHead className="w-16 text-right">+/-</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player, index) => (
                <TableRow key={player.name} className={getRankStyle(index + 1)}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getRankIcon(index + 1)}
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell className="text-right">{player.wins}/{player.losses}</TableCell>
                  <TableCell className="text-right">{player.pointsFor - player.pointsAgainst}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 