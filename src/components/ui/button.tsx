import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-[hsl(var(--sky-blue))] to-[hsl(var(--deep-forest))] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0.5",
                destructive:
                    "bg-gradient-to-r from-[hsl(var(--destructive))] to-[hsl(0,_60%,_45%)] text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline:
                    "border-2 border-[hsl(var(--cloud-cream))] dark:border-gray-700 bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-[hsl(var(--cloud-cream))] text-secondary-foreground shadow-sm hover:bg-[hsl(var(--cloud-cream))]/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-[hsl(var(--sky-blue))] underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-5 py-2.5",
                sm: "h-9 rounded-lg px-3 text-xs",
                lg: "h-12 rounded-xl px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
