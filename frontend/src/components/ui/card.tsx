import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "dark" | "light";
  children?: React.ReactNode;
}

export const Card = ({
  variant = "dark",
  children,
  className,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        variant === "dark" ? "card-dark text-white" : "card-light text-neutral-900",
        "relative overflow-hidden transition-all duration-300",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
