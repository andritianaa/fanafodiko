"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface DateBirthPickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
}

export function DateBirthPicker({ date, setDate, placeholder = "Sélectionner une date", className }: DateBirthPickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date-birth-picker"
          className={cn(
            "w-full justify-start text-left font-normal h-10 shadow-none",
            !date && "text-muted-foreground",
            className
          )}
        >
          {date ? format(date, "dd MMMM yyyy", { locale: fr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto overflow-hidden p-0" 
        align="start"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('select') || target.closest('[data-slot="calendar"]')) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('select') || target.closest('[data-slot="calendar"]')) {
            e.preventDefault();
          }
        }}
      >
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date || new Date()}
          captionLayout="dropdown"
          locale={fr}
          onSelect={(newDate) => {
            if (newDate) {
              setDate(newDate)
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
