import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[12px] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] shadow-[var(--shadow-xs)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[color:var(--info-light)] text-[color:var(--brand-deep)]",
        success:
          "border-transparent bg-[color:var(--success-light)] text-[color:var(--success)]",
        warning:
          "border-transparent bg-[color:var(--warning-light)] text-[color:var(--warning)]",
        destructive:
          "border-transparent bg-[color:var(--error-light)] text-[color:var(--error)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline: "text-foreground border-border",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
