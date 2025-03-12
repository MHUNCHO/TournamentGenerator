import { Users, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Player {
  player_id: number;
  name: string;
  avatar_url: string;
  role: string;
}

export default function PlayerRoster() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPlayerDialog, setShowNewPlayerDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }
        const data = await response.json();
        console.log('Player data:', data);
        setPlayers(data);
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 2xl:p-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Player Roster</h1>

        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={() => setShowNewPlayerDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Team Members</CardTitle>
            </div>
            <CardDescription>Active tournament players</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {players.map((player) => (
                <div
                  key={player.player_id}
                  className="flex flex-col items-center text-center"
                >
                  <Avatar className="h-64 w-64 mb-4">
                    <AvatarImage 
                      src={`http://localhost:5000${player.avatar_url}`}
                      alt={player.name} 
                      className="object-cover"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: '50% 25%',
                        imageRendering: 'crisp-edges'
                      }}
                    />
                    <AvatarFallback>
                      {player.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold">{player.name}</h4>
                    <p className="text-sm text-muted-foreground">{player.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs and other components */}
    </div>
  );
}