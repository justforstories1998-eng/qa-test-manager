"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ============================================================
   BUTTON (Base)
   ============================================================ */

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-primary-foreground hover:bg-destructive/90",
        cool: "dark:inset-shadow-2xs dark:inset-shadow-white/10 bg-linear-to-t border border-b-2 border-zinc-950/40 from-primary to-primary/85 shadow-md shadow-primary/20 ring-1 ring-inset ring-white/25 transition-[filter] duration-200 hover:brightness-110 active:brightness-90 dark:border-x-0 text-primary-foreground dark:text-primary-foreground dark:border-t-0 dark:border-primary/50 dark:ring-white/5",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

/* ============================================================
   LIQUID GLASS BUTTON
   ============================================================ */

const liquidbuttonVariants = cva(
  [
    "inline-flex items-center justify-center cursor-pointer gap-2",
    "whitespace-nowrap rounded-xl text-sm font-semibold",
    "transition-all duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400/50",
    "relative overflow-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-br from-indigo-500 via-indigo-500 to-indigo-600",
          "text-white",
          "shadow-[0_2px_10px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)]",
          "border border-indigo-400/30",
          "hover:shadow-[0_4px_16px_rgba(99,102,241,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "hover:from-indigo-400 hover:via-indigo-500 hover:to-indigo-500",
          "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_4px_rgba(99,102,241,0.2)]",
          "active:from-indigo-600 active:via-indigo-600 active:to-indigo-700",
          "focus-visible:ring-indigo-400/50",
        ].join(" "),
        destructive: [
          "bg-gradient-to-br from-red-500 via-red-500 to-red-600",
          "text-white",
          "shadow-[0_2px_10px_rgba(239,68,68,0.35),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)]",
          "border border-red-400/30",
          "hover:shadow-[0_4px_16px_rgba(239,68,68,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "hover:from-red-400 hover:via-red-500 hover:to-red-500",
          "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_4px_rgba(239,68,68,0.2)]",
          "active:from-red-600 active:via-red-600 active:to-red-700",
          "focus-visible:ring-red-400/50",
        ].join(" "),
        success: [
          "bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600",
          "text-white",
          "shadow-[0_2px_10px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)]",
          "border border-emerald-400/30",
          "hover:shadow-[0_4px_16px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "hover:from-emerald-400 hover:via-emerald-500 hover:to-emerald-500",
          "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_4px_rgba(16,185,129,0.2)]",
          "active:from-emerald-600 active:via-emerald-600 active:to-emerald-700",
          "focus-visible:ring-emerald-400/50",
        ].join(" "),
        warning: [
          "bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600",
          "text-white",
          "shadow-[0_2px_10px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)]",
          "border border-amber-400/30",
          "hover:shadow-[0_4px_16px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "hover:from-amber-400 hover:via-amber-500 hover:to-amber-500",
          "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_4px_rgba(245,158,11,0.2)]",
          "active:from-amber-600 active:via-amber-600 active:to-amber-700",
          "focus-visible:ring-amber-400/50",
        ].join(" "),
        outline: [
          "bg-white/70 backdrop-blur-md",
          "text-slate-700",
          "border-2 border-slate-200/80",
          "shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]",
          "hover:bg-white/90 hover:border-slate-300 hover:text-slate-800",
          "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)]",
          "active:bg-slate-50 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]",
          "focus-visible:ring-slate-400/50",
        ].join(" "),
        secondary: [
          "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/80",
          "text-slate-700",
          "border border-slate-200/60",
          "shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]",
          "hover:from-slate-50 hover:via-white hover:to-slate-100",
          "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)]",
          "hover:border-slate-300/80",
          "active:from-slate-200 active:to-slate-200 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
          "focus-visible:ring-slate-400/50",
        ].join(" "),
        ghost: [
          "bg-transparent",
          "text-slate-600",
          "hover:bg-white/60 hover:text-slate-800",
          "hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
          "active:bg-white/40 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]",
          "focus-visible:ring-slate-400/50",
        ].join(" "),
        link: [
          "text-indigo-600 bg-transparent",
          "underline-offset-4 hover:underline",
          "hover:text-indigo-700",
          "focus-visible:ring-indigo-400/50",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2.5 text-sm",
        sm: "h-8 px-3.5 py-1.5 text-xs rounded-lg",
        md: "h-10 px-5 py-2.5 text-sm rounded-xl",
        lg: "h-11 px-6 py-2.5 text-base rounded-xl",
        xl: "h-12 px-8 py-3 text-base rounded-xl",
        xxl: "h-14 px-10 py-4 text-lg rounded-2xl",
        icon: "h-10 w-10 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof liquidbuttonVariants> {
  asChild?: boolean
}

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: LiquidButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(liquidbuttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Comp>
  )
}

/* ============================================================
   METAL BUTTON
   ============================================================ */

type ColorVariant =
  | "default"
  | "primary"
  | "success"
  | "error"
  | "gold"
  | "bronze"

interface MetalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant
}

const colorVariants: Record<
  ColorVariant,
  {
    outer: string
    inner: string
    button: string
    textColor: string
    textShadow: string
  }
> = {
  default: {
    outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
    inner: "bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]",
    button: "bg-gradient-to-b from-[#B9B9B9] to-[#969696]",
    textColor: "text-white",
    textShadow: "[text-shadow:_0_-1px_0_rgb(80_80_80_/_100%)]",
  },
  primary: {
    outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
    inner: "bg-gradient-to-b from-primary via-secondary to-muted",
    button: "bg-gradient-to-b from-primary to-primary/40",
    textColor: "text-white",
    textShadow: "[text-shadow:_0_-1px_0_rgb(30_58_138_/_100%)]",
  },
  success: {
    outer: "bg-gradient-to-b from-[#005A43] to-[#7CCB9B]",
    inner: "bg-gradient-to-b from-[#E5F8F0] via-[#00352F] to-[#D1F0E6]",
    button: "bg-gradient-to-b from-[#9ADBC8] to-[#3E8F7C]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(6_78_59_/_100%)]",
  },
  error: {
    outer: "bg-gradient-to-b from-[#5A0000] to-[#FFAEB0]",
    inner: "bg-gradient-to-b from-[#FFDEDE] via-[#680002] to-[#FFE9E9]",
    button: "bg-gradient-to-b from-[#F08D8F] to-[#A45253]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(146_64_14_/_100%)]",
  },
  gold: {
    outer: "bg-gradient-to-b from-[#917100] to-[#EAD98F]",
    inner: "bg-gradient-to-b from-[#FFFDDD] via-[#856807] to-[#FFF1B3]",
    button: "bg-gradient-to-b from-[#FFEBA1] to-[#9B873F]",
    textColor: "text-[#FFFDE5]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(178_140_2_/_100%)]",
  },
  bronze: {
    outer: "bg-gradient-to-b from-[#864813] to-[#E9B486]",
    inner: "bg-gradient-to-b from-[#EDC5A1] via-[#5F2D01] to-[#FFDEC1]",
    button: "bg-gradient-to-b from-[#FFE3C9] to-[#A36F3D]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(124_45_18_/_100%)]",
  },
}

const metalButtonVariants = (
  variant: ColorVariant = "default",
  isPressed: boolean,
  isHovered: boolean,
  isTouchDevice: boolean,
) => {
  const colors = colorVariants[variant]
  const transitionStyle = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)"

  return {
    wrapper: cn(
      "relative inline-flex transform-gpu rounded-md p-[1.25px] will-change-transform",
      colors.outer,
    ),
    wrapperStyle: {
      transform: isPressed
        ? "translateY(2.5px) scale(0.99)"
        : "translateY(0) scale(1)",
      boxShadow: isPressed
        ? "0 1px 2px rgba(0, 0, 0, 0.15)"
        : isHovered && !isTouchDevice
          ? "0 4px 12px rgba(0, 0, 0, 0.12)"
          : "0 3px 8px rgba(0, 0, 0, 0.08)",
      transition: transitionStyle,
      transformOrigin: "center center",
    },
    inner: cn(
      "absolute inset-[1px] transform-gpu rounded-lg will-change-transform",
      colors.inner,
    ),
    innerStyle: {
      transition: transitionStyle,
      transformOrigin: "center center",
      filter:
        isHovered && !isPressed && !isTouchDevice ? "brightness(1.05)" : "none",
    },
    button: cn(
      "relative z-10 m-[1px] rounded-md inline-flex h-11 transform-gpu cursor-pointer items-center justify-center overflow-hidden rounded-md px-6 py-2 text-sm leading-none font-semibold will-change-transform outline-none",
      colors.button,
      colors.textColor,
      colors.textShadow,
    ),
    buttonStyle: {
      transform: isPressed ? "scale(0.97)" : "scale(1)",
      transition: transitionStyle,
      transformOrigin: "center center",
      filter:
        isHovered && !isPressed && !isTouchDevice ? "brightness(1.02)" : "none",
    },
  }
}

const ShineEffect = ({ isPressed }: { isPressed: boolean }) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-300",
        isPressed ? "opacity-20" : "opacity-0",
      )}
    >
      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
    </div>
  )
}

const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(
  ({ children, className, variant = "default", ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isTouchDevice, setIsTouchDevice] = React.useState(false)

    React.useEffect(() => {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
    }, [])

    const buttonText = children || "Button"
    const variants = metalButtonVariants(
      variant,
      isPressed,
      isHovered,
      isTouchDevice,
    )

    const handleInternalMouseDown = () => setIsPressed(true)
    const handleInternalMouseUp = () => setIsPressed(false)
    const handleInternalMouseLeave = () => {
      setIsPressed(false)
      setIsHovered(false)
    }
    const handleInternalMouseEnter = () => {
      if (!isTouchDevice) setIsHovered(true)
    }
    const handleInternalTouchStart = () => setIsPressed(true)
    const handleInternalTouchEnd = () => setIsPressed(false)
    const handleInternalTouchCancel = () => setIsPressed(false)

    return (
      <div className={variants.wrapper} style={variants.wrapperStyle}>
        <div className={variants.inner} style={variants.innerStyle}></div>
        <button
          ref={ref}
          className={cn(variants.button, className)}
          style={variants.buttonStyle}
          {...props}
          onMouseDown={handleInternalMouseDown}
          onMouseUp={handleInternalMouseUp}
          onMouseLeave={handleInternalMouseLeave}
          onMouseEnter={handleInternalMouseEnter}
          onTouchStart={handleInternalTouchStart}
          onTouchEnd={handleInternalTouchEnd}
          onTouchCancel={handleInternalTouchCancel}
        >
          <ShineEffect isPressed={isPressed} />
          {buttonText}
          {isHovered && !isPressed && !isTouchDevice && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t rounded-lg from-transparent to-white/5" />
          )}
        </button>
      </div>
    )
  },
)

MetalButton.displayName = "MetalButton"

export { Button, buttonVariants, liquidbuttonVariants, LiquidButton, MetalButton }
