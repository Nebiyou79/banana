import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/social/ui/Button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 text-slate-100 shadow-xl",
        className
      )}
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        className="p-4"
        classNames={{
          /* LAYOUT (NO FLEX – FIXES DISTORTION) */
          months: "space-y-4",
          month: "space-y-4",
          caption: "relative flex justify-center items-center",
          caption_label: "text-sm font-semibold tracking-wide",

          nav: "absolute right-1 top-1 flex gap-1",
          table: "w-full border-collapse",
          head_row: "",
          head_cell:
            "text-center text-xs font-medium text-slate-400 pb-2",

          row: "",
          cell:
            "h-9 w-9 text-center p-0 relative focus-within:z-10",

          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 rounded-md text-slate-200 hover:bg-white/10"
          ),

          /* STATES */
          day_selected:
            "bg-white text-slate-900 hover:bg-white focus:bg-white",
          day_today:
            "bg-indigo-700 text-white font-semibold",
          day_outside:
            "text-slate-500 opacity-40",
          day_disabled:
            "text-slate-500 opacity-30 cursor-not-allowed",

          /* RANGE */
          day_range_middle:
            "aria-selected:bg-white/10 aria-selected:text-white",
          day_range_start:
            "aria-selected:bg-white aria-selected:text-slate-900",
          day_range_end:
            "aria-selected:bg-white aria-selected:text-slate-900",

          day_hidden: "invisible",

          ...classNames,
        }}
        components={{
          Button: ({ name, ...buttonProps }) => {
            if (name === "previous-month" || name === "next-month") {
              return (
                <button
                  {...buttonProps}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-white/5 border-white/10 text-white hover:bg-white/15"
                  )}
                >
                  {name === "previous-month" ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )
            }

            return (
              <button {...buttonProps} className={buttonProps.className} />
            )
          },
        }}
        {...props}
      />
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
