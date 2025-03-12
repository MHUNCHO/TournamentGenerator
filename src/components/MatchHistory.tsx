import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MatchResult } from "@/components/MatchResult";
import { MatchHistoryCard } from "@/components/MatchHistoryCard";

interface Match {
  match_date: string;
  player1_name: string;
  player2_name: string;
  player3_name: string;
  player4_name: string;
  player1_score: number;
  player2_score: number;
  player3_score: number;
  player4_score: number;
  team1_score: number;
  team2_score: number;
  player_team: 1 | 2;
  id: number;
  match_id: number;
}

export default function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/matches');
        if (!response.ok) throw new Error('Failed to fetch matches');
        const data = await response.json();
        // Sort matches by date and match_id before setting state
        const sortedMatches = data.sort((a: Match, b: Match) => {
          const [dayA, monthA, yearA] = a.match_date.split('/');
          const [dayB, monthB, yearB] = b.match_date.split('/');
          const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA));
          const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB));
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }
          // If dates are equal, sort by match_id in descending order
          return b.match_id - a.match_id;
        });
        setMatches(sortedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const filteredMatches = matches.filter((match) =>
    match.player1_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.player2_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.player3_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.player4_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container px-4 md:px-6 pt-8">
      <h1 className="text-2xl font-bold mb-4">Match History</h1>
      <Input
        type="search"
        placeholder="Search matches..."
        className="w-[200px] mb-4"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {isLoading ? (
        <div className="text-center py-4">Loading matches...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-4">No matches found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMatches.map((match, index) => (
            <MatchHistoryCard 
              key={index} 
              {...match} 
              match_date={match.match_date}
            />
          ))}
        </div>
      )}
    </div>
  );
}