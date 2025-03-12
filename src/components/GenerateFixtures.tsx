import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Leaderboard } from './Leaderboard';

interface Player {
  player_id: number;
  name: string;
  rank?: number;  // Optional if you don't have rank in your table
}

interface Match {
  id: string;
  date: string;
  gameMode: 'Melee' | 'Elimination' | 'Swiss' | 'Luxembourg';
  matchType: 'Singles' | 'Doubles';
  players: string[];
  team1Score: number;
  team2Score: number;
  round: number;
  court: number;
}

export default function GenerateFixtures() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [gameMode, setGameMode] = useState<'Melee' | 'Elimination' | 'Swiss' | 'Luxembourg'>('Melee');
  const [matchType, setMatchType] = useState<'Singles' | 'Doubles'>('Singles');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [numCourts, setNumCourts] = useState('2');
  const [numRounds, setNumRounds] = useState('3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<string, { team1Score: string; team2Score: string }>>({});
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [feasibleRounds, setFeasibleRounds] = useState<number[]>([]);

  // Fetch players from your API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
  }, []);

  // Filter players based on search
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add useEffect to fetch feasible rounds when courts or players change
  useEffect(() => {
    const fetchFeasibleRounds = async () => {
      if (selectedPlayers.length === 0 || !numCourts) return;
      
      try {
        const response = await fetch(`/api/feasible-rounds?courts=${numCourts}&players=${selectedPlayers.length}`);
        if (!response.ok) throw new Error('Failed to fetch feasible rounds');
        const data = await response.json();
        setFeasibleRounds(data.map((r: { round: number }) => r.round));
      } catch (error) {
        console.error('Error fetching feasible rounds:', error);
        toast({
          title: "Error",
          description: "Failed to fetch feasible rounds",
          variant: "destructive",
        });
      }
    };

    fetchFeasibleRounds();
  }, [numCourts, selectedPlayers.length]);

  const handleScoreChange = (matchId: string, team: 'team1Score' | 'team2Score', value: string) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value,
      },
    }));
  };

  const handleUpdateScore = async (match: Match) => {
    const matchScores = scores[match.id];
    if (!matchScores?.team1Score || !matchScores?.team2Score) {
      toast({
        title: "Missing Scores",
        description: "Please enter scores for both teams",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format date from YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = match.date.split('-');
      const formattedDate = `${day}/${month}/${year}`;

      const formData = new FormData();
      formData.append('match_date', formattedDate);  // Using formatted date
      formData.append('match_type', match.matchType);
      formData.append('game_mode', match.gameMode);
      formData.append('team1_score_1', matchScores.team1Score);
      formData.append('team2_score_1', matchScores.team2Score);
      formData.append('player1_1', match.players[0]);
      formData.append('player2_1', match.players[1]);
      formData.append('player3_1', match.players[2]);
      formData.append('player4_1', match.players[3]);

      const response = await fetch('http://localhost:5000/api/update-scores', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.status === 'error') throw new Error(result.message);

      setMatches((prev) =>
        prev.map((m) =>
          m.id === match.id
            ? { ...m, team1Score: parseInt(matchScores.team1Score), team2Score: parseInt(matchScores.team2Score) }
            : m
        )
      );

      toast({
        title: "Score Updated",
        description: "Match scores have been saved",
      });

      setScores((prev) => {
        const newScores = { ...prev };
        delete newScores[match.id];
        return newScores;
      });
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save match scores",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    if (selectedPlayers.length === 0) {
      toast({
        title: "Invalid Player Selection",
        description: "Please select at least 2 players",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // First get the schedule_id
      const scheduleResponse = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          num_courts: parseInt(numCourts),
          num_players: selectedPlayers.length,
          num_rounds: parseInt(numRounds)
        }),
      });

      if (!scheduleResponse.ok) throw new Error('Failed to fetch schedule');
      const scheduleData = await scheduleResponse.json();
      console.log('Schedule data:', scheduleData);

      // Then fetch the rounds using the schedule_id
      const roundsResponse = await fetch(`/api/schedule-rounds/${scheduleData.schedule_id}`);
      if (!roundsResponse.ok) throw new Error('Failed to fetch rounds');
      const roundsData = await roundsResponse.json();
      console.log('Rounds data:', roundsData);

      // Create matches from the rounds data
      const newMatches = roundsData.map((match: any) => {
        console.log('Processing match:', match);
        return {
          id: Date.now().toString() + Math.random(),
          date: date.toISOString().split('T')[0],
          gameMode,
          matchType,
          round: match.round,
          court: match.court,
          players: [
            ...match.team1,
            ...match.team2
          ].map(playerNum => selectedPlayers[parseInt(playerNum)]),
          team1Score: 0,
          team2Score: 0
        };
      });

      console.log('New matches:', newMatches);
      setMatches((prev) => [...prev, ...newMatches]);
      setSelectedPlayers([]);

      toast({
        title: "Matches Generated",
        description: "New matches have been added to the schedule",
      });
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({
        title: "Error",
        description: "Failed to generate matches",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayer = (playerName: string) => {
    setSelectedPlayers((current) => {
      if (current.includes(playerName)) {
        return current.filter((name) => name !== playerName);
      } else {
        return [...current, playerName];
      }
    });
  };

  return (
    <div className="container px-4 md:px-6 pt-8 space-y-6">
      <h1 className="text-2xl font-bold">Generate Fixtures</h1>
      
      <div className="grid gap-6 md:grid-cols-[3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Generate Match</CardTitle>
            <CardDescription>
              Schedule a new match and track scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameMode">Game Mode</Label>
                <Select value={gameMode} onValueChange={(value) => setGameMode(value as 'Melee' | 'Elimination' | 'Swiss' | 'Luxembourg')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select game mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Melee">Melee</SelectItem>
                    <SelectItem value="Elimination">Elimination</SelectItem>
                    <SelectItem value="Swiss">Swiss</SelectItem>
                    <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="matchType">Match Type</Label>
                <Select value={matchType} onValueChange={(value) => setMatchType(value as 'Singles' | 'Doubles')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select match type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Singles">Singles</SelectItem>
                    <SelectItem value="Doubles">Doubles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Players</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedPlayers.length > 0
                        ? `${selectedPlayers.length} player${selectedPlayers.length === 1 ? '' : 's'} selected`
                        : "Select players"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-4" align="start">
                    <div className="space-y-4">
                      <Input
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {filteredPlayers.map((player) => (
                          <div
                            key={player.player_id}
                            onClick={() => togglePlayer(player.name)}
                            className={cn(
                              "flex items-center justify-between rounded-md px-2 py-2 cursor-pointer hover:bg-accent",
                              selectedPlayers.includes(player.name) && "bg-accent"
                            )}
                          >
                            <span>{player.name}</span>
                            {selectedPlayers.includes(player.name) && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPlayers.map((player) => (
                      <Badge
                        key={player}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => togglePlayer(player)}
                      >
                        {player}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numCourts">Available Courts</Label>
                <Input
                  id="numCourts"
                  type="number"
                  min="1"
                  value={numCourts}
                  onChange={(e) => setNumCourts(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numRounds">Number of Rounds</Label>
                <Select 
                  value={numRounds} 
                  onValueChange={(value) => setNumRounds(value)}
                  disabled={feasibleRounds.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of rounds" />
                  </SelectTrigger>
                  <SelectContent>
                    {feasibleRounds.map((round) => (
                      <SelectItem key={round} value={round.toString()}>
                        {round} {round === 1 ? 'Round' : 'Rounds'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {feasibleRounds.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Select courts and players first
                  </p>
                )}
              </div>
            </div>
            <Button
              className="mt-6"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Match
            </Button>
          </CardContent>
        </Card>

        <Leaderboard matches={matches} />
      </div>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Match Schedule</CardTitle>
            <CardDescription>
              Track and update match scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Game Mode</TableHead>
                    <TableHead>Match Type</TableHead>
                    <TableHead>Player 1</TableHead>
                    <TableHead>Player 2</TableHead>
                    <TableHead>Player 3</TableHead>
                    <TableHead>Player 4</TableHead>
                    <TableHead>Team 1 Score</TableHead>
                    <TableHead>Team 2 Score</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        {format(new Date(match.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>Round {match.round + 1}</TableCell>
                      <TableCell>{match.gameMode}</TableCell>
                      <TableCell>{match.matchType}</TableCell>
                      <TableCell>{match.players[0] || '-'}</TableCell>
                      <TableCell>{match.players[1] || '-'}</TableCell>
                      <TableCell>{match.players[2] || '-'}</TableCell>
                      <TableCell>{match.players[3] || '-'}</TableCell>
                      <TableCell>
                        {match.team1Score > 0 ? (
                          match.team1Score
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            placeholder="Score"
                            value={scores[match.id]?.team1Score || ''}
                            onChange={(e) =>
                              handleScoreChange(match.id, 'team1Score', e.target.value)
                            }
                            className="h-8 w-20"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {match.team2Score > 0 ? (
                          match.team2Score
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            placeholder="Score"
                            value={scores[match.id]?.team2Score || ''}
                            onChange={(e) =>
                              handleScoreChange(match.id, 'team2Score', e.target.value)
                            }
                            className="h-8 w-20"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {match.team1Score === 0 && match.team2Score === 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateScore(match)}
                            disabled={
                              !scores[match.id]?.team1Score || !scores[match.id]?.team2Score
                            }
                          >
                            Update
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}