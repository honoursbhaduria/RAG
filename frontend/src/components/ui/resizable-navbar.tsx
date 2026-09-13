"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import React from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-4 z-50 w-full px-4 flex justify-center pointer-events-none",
        className,
      )}
    >
      <div className="w-full max-w-5xl pointer-events-auto">
        {children}
      </div>
    </header>
  );
};

export const NavBody = ({ children, className }: NavBodyProps) => {
  return (
    <div
      className={cn(
        "hidden lg:flex items-center justify-between h-14 w-full rounded-full px-6 select-none transition-all duration-200 overflow-hidden",
        "bg-black border border-neutral-800 shadow-2xl text-white",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  return (
    <nav
      className={cn(
        "flex items-center justify-center gap-1 text-sm font-medium whitespace-nowrap",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          key={`link-${idx}`}
          href={item.link}
          onClick={onItemClick}
          className="px-3.5 py-1.5 font-label text-xs font-semibold text-neutral-700 hover:text-black hover:bg-neutral-300/60 rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 active:scale-[0.98]"
        >
          {item.name}
        </a>
      ))}
    </nav>
  );
};

export const MobileNav = ({ children, className }: MobileNavProps) => {
  return (
    <div
      className={cn(
        "flex lg:hidden flex-col w-full rounded-3xl select-none transition-all overflow-hidden",
        "bg-black border border-neutral-800 shadow-2xl text-white",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between h-14 px-5 w-full",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={cn(
            "overflow-hidden flex flex-col gap-3 px-5 pb-5 pt-2 border-t border-neutral-800 text-white",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="p-1.5 cursor-pointer rounded-full hover:bg-white/10 transition-colors text-white"
      aria-label="Toggle navigation menu"
    >
      {isOpen ? (
        <IconX className="text-white w-5 h-5" />
      ) : (
        <IconMenu2 className="text-white w-5 h-5" />
      )}
    </button>
  );
};

export const NavbarLogo = ({
  logoText = "3AM DEVS",
  href = "#",
}: {
  logoText?: string;
  href?: string;
}) => {
  return (
    <a
      href={href}
      className="flex items-center space-x-2.5 py-1 text-white cursor-pointer shrink-0 select-none group"
    >
      <div className="px-2.5 h-[28px] rounded-lg bg-neutral-900 flex items-center justify-center shrink-0 border border-neutral-800 overflow-hidden relative group-hover:scale-105 transition-transform">
        <span className="text-white font-black text-xs tracking-tight">3AM</span>
      </div>
      <span className="font-bold text-base tracking-tight text-white">{logoText}</span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-1.5 rounded-lg text-xs font-semibold font-label relative cursor-pointer transition-all duration-150 inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 select-none active:scale-[0.98]";

  const variantStyles = {
    primary:
      "bg-white text-black hover:bg-neutral-200 border border-white font-medium",
    secondary:
      "bg-transparent text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent active:bg-white/15",
    dark: "bg-neutral-900 text-white hover:bg-black",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
