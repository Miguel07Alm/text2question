import type React from "react";
import { cn } from "@/lib/utils";

interface ThemedSectionTitleProps {
    children: React.ReactNode;
    className?: string;
}

export function ThemedSectionTitle({
    children,
    className,
}: ThemedSectionTitleProps) {
    return (
        <div className={cn("relative mb-6", className)}>
            <h3 className="text-lg font-medium relative z-10">{children}</h3>
            <div className="absolute bottom-0 left-0 h-3 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
        </div>
    );
}
