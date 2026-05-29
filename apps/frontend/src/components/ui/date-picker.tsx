"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { parseDate } from "chrono-node"
import { CalendarIcon } from "lucide-react"
import { format, parse, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

function formatDateDisplay(date: Date | undefined) {
  if (!date) return ""
  return format(date, "PPP", { locale: fr })
}

export interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ date, setDate, placeholder = "31-12-1990", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(date ? format(date, "dd-MM-yyyy") : "")

  // Sync internal input value with external date prop
  React.useEffect(() => {
    if (date) {
      const formatted = format(date, "dd-MM-yyyy")
      if (formatted !== inputValue) {
        setInputValue(formatted)
      }
    } else if (!date && inputValue !== "") {
      setInputValue("")
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replaceAll(/\D/g, "") // remove non-digits
    
    // Auto-insert dashes
    if (val.length > 2 && val.length <= 4) {
      val = val.slice(0, 2) + "-" + val.slice(2)
    } else if (val.length > 4) {
      val = val.slice(0, 2) + "-" + val.slice(2, 4) + "-" + val.slice(4, 8)
    }
    
    setInputValue(val)

    // Try parsing as DD-MM-YYYY
    if (val.length === 10) {
      const parsed = parse(val, "dd-MM-yyyy", new Date())
      if (isValid(parsed)) {
        setDate(parsed)
        return
      }
    }

    // Fallback to chrono-node for natural language
    const naturalParsed = parseDate(e.target.value)
    if (naturalParsed) {
      setDate(naturalParsed)
    } else if (val === "") {
      setDate(undefined)
    }
  }

  return (
    <div className={cn("w-full space-y-1", className)}>
      <InputGroup>
        <InputGroupInput
          value={inputValue}
          placeholder={placeholder}
          onChange={handleInputChange}
          maxLength={10}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id="date-picker-trigger"
                variant="ghost"
                size="icon-xs"
                aria-label="Sélectionner une date"
              >
                <CalendarIcon className="size-4" />
                <span className="sr-only">Sélectionner une date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              sideOffset={8}
              // Prevent closing when clicking on calendar dropdowns or internal elements
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
                captionLayout="dropdown"
                defaultMonth={date || new Date()}
                locale={fr}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate)
                    setInputValue(format(newDate, "dd-MM-yyyy"))
                    setOpen(false)
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {date && (
        <div className="text-muted-foreground px-1 text-xs">
          Date sélectionnée :{" "}
          <span className="font-medium">{formatDateDisplay(date)}</span>
        </div>
      )}
    </div>
  )
}
