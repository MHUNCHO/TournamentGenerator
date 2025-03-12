import { cn } from "@/lib/utils"
import drawWinnerDot from '@/assets/images/draw-winner-dot.svg';
import loserDot from '@/assets/images/loser_dot.svg';
import { format, parse } from "date-fns";

interface MatchResultProps {
  match_date: string;
  player1_name: string;
  player2_name: string;
  player3_name: string;
  player4_name: string;
  team1_score: number;
  team2_score: number;
  player_team: 1 | 2;
}

export function MatchResult({
  match_date,
  player1_name,
  player2_name,
  player3_name,
  player4_name,
  team1_score,
  team2_score,
  player_team,
}: MatchResultProps) {
  const formatDate = (dateString: string) => {
    try {
      const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
      return format(parsedDate, "EEEE, do MMMM, yyyy");
    } catch (error) {
      console.error("Invalid date:", dateString);
      return "Date unavailable";
    }
  };

  return (
    <div className="rounded-lg border">
      <div className="bg-gray-100 px-3 py-1 text-sm text-gray-500 rounded-t-lg">
        Match
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className={cn(
            "text-sm flex-1",
            team1_score > team2_score ? "font-bold" : "text-gray-500"
          )}>
            {player1_name}<br/>{player2_name}
          </div>
          <div className="flex items-center gap-2">
            {player_team === 1 && (
              <div className="relative w-6 h-6 flex items-center justify-center">
                <img 
                  src={team1_score > team2_score ? drawWinnerDot : loserDot}
                  alt="Team indicator"
                  className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                />
              </div>
            )}
            <div className={cn(
              "text-sm px-4",
              team1_score > team2_score ? "font-bold" : "text-gray-500"
            )}>
              {team1_score}
            </div>
          </div>
        </div>
        
        <div className="border-t my-2"></div>
        
        <div className="flex justify-between items-center">
          <div className={cn(
            "text-sm flex-1",
            team2_score > team1_score ? "font-bold" : "text-gray-500"
          )}>
            {player3_name}<br/>{player4_name}
          </div>
          <div className="flex items-center gap-2">
            {player_team === 2 && (
              <div className="relative w-6 h-6 flex items-center justify-center">
                <img 
                  src={team2_score > team1_score ? drawWinnerDot : loserDot}
                  alt="Team indicator"
                  className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                />
              </div>
            )}
            <div className={cn(
              "text-sm px-4",
              team2_score > team1_score ? "font-bold" : "text-gray-500"
            )}>
              {team2_score}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 rounded-b-lg">
        <span className="font-bold">Date: </span>
        {formatDate(match_date)}
      </div>
    </div>
  )
} 