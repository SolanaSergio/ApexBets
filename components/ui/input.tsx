import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input/50 backdrop-blur-sm border-border flex h-12 w-full min-w-0 rounded-xl border-2 px-4 py-3 text-base shadow-lg transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-[4px] focus-visible:shadow-xl focus-visible:scale-[1.02]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "hover:border-primary/50 hover:shadow-xl hover:scale-[1.01]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
