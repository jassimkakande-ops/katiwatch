"use client";

import { ReactNode } from "react";

interface HoverCardProps {
  children: ReactNode;
  content: any;
}

// Hover card removed — renders children directly
export function StreamitHoverCard({ children }: HoverCardProps) {
  return <>{children}</>;
}
