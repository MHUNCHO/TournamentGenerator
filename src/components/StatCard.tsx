import React from 'react';

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  trend?: string
  highlight?: boolean
}

export function StatCard({ icon, label, value, trend, highlight }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
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