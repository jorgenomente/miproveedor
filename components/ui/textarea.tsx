import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-24 w-full rounded-xl border bg-card px-3 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] transition-[color,box-shadow,border-color] outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:shadow-[var(--shadow-sm)] dark:bg-secondary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
