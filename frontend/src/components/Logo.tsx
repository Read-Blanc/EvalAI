import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`${sizeClasses[size]} rounded-lg gradient-accent flex items-center justify-center shadow-md group-hover:shadow-accent-glow transition-all duration-300`}>
        <Brain className="h-5 w-5 text-accent-foreground" />
      </div>
      {showText && (
        <span className={`${textClasses[size]} font-bold text-foreground tracking-tight`}>
          EvalAI
        </span>
      )}
    </Link>
  );
}
