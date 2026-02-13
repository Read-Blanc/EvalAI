import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/* ===========================
   Custom API Error Class
   =========================== */

export class ApiError<T = any> extends Error {
  status?: number;
  data?: T;

  constructor(message: string, status?: number, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}
