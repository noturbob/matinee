import { getXpProgress, getXpForLevel } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface XpBarProps {
  xp: number;
  level: number;
  className?: string;
  showLabel?: boolean;
}

export function XpBar({ xp, level, className, showLabel }: XpBarProps) {
  const progress = getXpProgress(xp, level);
  const nextLevelXp = getXpForLevel(level + 1);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{xp.toLocaleString()} XP</span>
          {nextLevelXp ? (
            <span>{nextLevelXp.toLocaleString()} XP</span>
          ) : (
            <span>MAX</span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}