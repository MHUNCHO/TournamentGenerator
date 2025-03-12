import { cn } from "@/lib/utils"
import drawWinnerDot from '@/assets/images/draw-winner-dot.svg';

interface MatchHistoryCardProps {
  match_date: string;
  player1_name: string;
  player2_name: string;
  player3_name: string;
  player4_name: string;
  player1_score: number;
  player2_score: number;
  player3_score: number;
  player4_score: number;
}

export function MatchHistoryCard({
  match_date,
  player1_name,
  player2_name,
  player3_name,
  player4_name,
  player1_score,
  player2_score,
  player3_score,
  player4_score,
}: MatchHistoryCardProps) {
  // Calculate team scores
  const team1_score = player1_score || player2_score; // They should be the same
  const team2_score = player3_score || player4_score; // They should be the same

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
            {team1_score > team2_score && (
              <div className="relative w-6 h-6 flex items-center justify-center">
                <img 
                  src={drawWinnerDot}
                  alt="Winner indicator"
                  className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                />
              </div>
            )}
            {team1_score === team2_score && (
              <div className="relative w-6 h-6 flex items-center justify-center">
                <img 
                  src={drawWinnerDot}
                  alt="Draw indicator"
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
            {team2_score > team1_score && (
              <div className="relative w-6 h-6 flex items-center justify-center">
                <img 
                  src={drawWinnerDot}
                  alt="Winner indicator"
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
        {match_date || 'No date available'}
      </div>
    </div>
  )
} 