import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const arcadeButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 pixel-font uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)] hover:scale-105",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_0_20px_hsl(var(--secondary)/0.5)] hover:shadow-[0_0_30px_hsl(var(--secondary)/0.8)] hover:scale-105",
        accent: "bg-accent text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.5)] hover:shadow-[0_0_30px_hsl(var(--accent)/0.8)] hover:scale-105",
        outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)]",
        ghost: "text-primary hover:bg-primary/10 hover:text-primary",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-16 rounded-md px-12 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ArcadeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof arcadeButtonVariants> {
  asChild?: boolean;
}

const ArcadeButton = React.forwardRef<HTMLButtonElement, ArcadeButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(arcadeButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
ArcadeButton.displayName = "ArcadeButton";

export { ArcadeButton, arcadeButtonVariants };
