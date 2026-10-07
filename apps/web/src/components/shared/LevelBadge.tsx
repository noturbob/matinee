import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  className?: string;
}

const levelColors: Record<number, string> = {
  1: "bg-zinc-500/20 text-zinc-400",
  2: "bg-green-500/20 text-green-400",
  3: "bg-green-500/20 text-green-400",
  4: "bg-blue-500/20 text-blue-400",
  5: "bg-blue-500/20 text-blue-400",
  6: "bg-purple-500/20 text-purple-400",
  7: "bg-purple-500/20 text-purple-400",
  8: "bg-amber-500/20 text-amber-400",
  9: "bg-amber-500/20 text-amber-400",
  10: "bg-red-500/20 text-red-400",
};

export function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
        levelColors[level] ?? levelColors[1],
        className
      )}
    >
      Lv.{level}
    </span>
  );
}