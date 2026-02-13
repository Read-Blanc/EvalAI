import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  score: number;
  maxScore: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ScoreCircle({
  score,
  maxScore,
  size = "md",
  showLabel = true,
  label,
  className,
}: ScoreCircleProps) {
  const percentage = (score / maxScore) * 100;
  
  const sizeConfig = {
    sm: { size: 60, strokeWidth: 4, fontSize: "text-lg", labelSize: "text-xs" },
    md: { size: 100, strokeWidth: 6, fontSize: "text-2xl", labelSize: "text-sm" },
    lg: { size: 140, strokeWidth: 8, fontSize: "text-4xl", labelSize: "text-base" },
    xl: { size: 180, strokeWidth: 10, fontSize: "text-5xl", labelSize: "text-lg" },
  };

  const config = sizeConfig[size];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreColor = () => {
    if (percentage >= 80) return "stroke-success";
    if (percentage >= 60) return "stroke-primary";
    if (percentage >= 40) return "stroke-warning";
    return "stroke-destructive";
  };

  const getScoreLabel = () => {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 80) return "Very Good";
    if (percentage >= 70) return "Good";
    if (percentage >= 60) return "Satisfactory";
    if (percentage >= 50) return "Pass";
    return "Needs Improvement";
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
          />
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            className={getScoreColor()}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={cn("font-bold text-foreground", config.fontSize)}
          >
            {score}
          </motion.span>
          <span className={cn("text-muted-foreground", config.labelSize)}>/ {maxScore}</span>
        </div>
      </div>
      {showLabel && (
        <div className="mt-2 text-center">
          <p className="font-semibold text-foreground">{label || getScoreLabel()}</p>
          <p className="text-sm text-muted-foreground">{percentage.toFixed(0)}% Score</p>
        </div>
      )}
    </div>
  );
}
