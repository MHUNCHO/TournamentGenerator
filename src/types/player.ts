export interface PlayerProfile {
  id: string
  name: string
  role: string
  avatar_url?: string
  current_rating: number
  rating_deviation: number
  matches_played: number
  wins: number
  losses: number
  win_rate: number
  average_mov?: number
  average_mol?: number
  win_streak?: number
  loss_streak?: number
} 