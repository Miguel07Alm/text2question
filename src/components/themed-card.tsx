import type React from "react";
import { cn } from "@/lib/utils";

interface ThemedCardProps {
    children: React.ReactNode;
    className?: string;
}

export function ThemedCard({ children, className }: ThemedCardProps) {
    return <div className={cn("themed-card p-6", className)}>{children}</div>;
}
