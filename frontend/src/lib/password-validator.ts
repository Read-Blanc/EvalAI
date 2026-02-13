import { PasswordStrength } from "@/types/auth.types";

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("Password must be at least 8 characters");
  }

  if (password.length >= 12) {
    score++;
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Add at least one uppercase letter");
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("Add at least one lowercase letter");
  }

  // Number check
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push("Add at least one number");
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push("Add at least one special character");
  }

  // Common patterns check
  const commonPatterns = [/^123456/, /^password/i, /^qwerty/i, /^abc123/i];

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common patterns");
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(4, Math.floor(score / 1.5)) as
    | 0
    | 1
    | 2
    | 3
    | 4;

  return {
    score: normalizedScore,
    feedback,
    isValid: normalizedScore >= 2 && password.length >= 8,
  };
}

export function getPasswordStrengthLabel(score: number): string {
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  return labels[score] || "Very Weak";
}

export function getPasswordStrengthColor(score: number): string {
  const colors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];
  return colors[score] || "bg-gray-300";
}
