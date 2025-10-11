"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DateRangePickerProps {
  dateRange: { from: Date; to: Date }
  onChange: (range: { from: Date; to: Date }) => void
  className?: string
}

export function DateRangePicker({
  dateRange,
  onChange,
  className,
}: DateRangePickerProps) {
  // Format Date to YYYY-MM-DD for native input
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Parse YYYY-MM-DD string to Date
  const parseDate = (dateString: string): Date => {
    return new Date(dateString)
  }

  const [fromDate, setFromDate] = React.useState(formatDate(dateRange.from))
  const [toDate, setToDate] = React.useState(formatDate(dateRange.to))

  // Update local state when props change
  React.useEffect(() => {
    setFromDate(formatDate(dateRange.from))
    setToDate(formatDate(dateRange.to))
  }, [dateRange])

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFromDate = e.target.value
    setFromDate(newFromDate)

    if (newFromDate) {
      onChange({
        from: parseDate(newFromDate),
        to: parseDate(toDate),
      })
    }
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToDate = e.target.value
    setToDate(newToDate)

    if (newToDate) {
      onChange({
        from: parseDate(fromDate),
        to: parseDate(newToDate),
      })
    }
  }

  // Preset button handlers
  const setLast7Days = () => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 7)

    setFromDate(formatDate(from))
    setToDate(formatDate(to))
    onChange({ from, to })
  }

  const setLast30Days = () => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)

    setFromDate(formatDate(from))
    setToDate(formatDate(to))
    onChange({ from, to })
  }

  const setLast60Days = () => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 60)

    setFromDate(formatDate(from))
    setToDate(formatDate(to))
    onChange({ from, to })
  }

  return (
    <div className={cn("flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2", className)}>
      {/* Preset Quick Select Buttons */}
      <div className="flex items-center gap-1 justify-center sm:justify-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLast7Days}
          className="h-10 sm:h-8 px-2 text-xs flex-1 sm:flex-initial"
        >
          7d
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLast30Days}
          className="h-10 sm:h-8 px-2 text-xs flex-1 sm:flex-initial"
        >
          30d
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLast60Days}
          className="h-10 sm:h-8 px-2 text-xs flex-1 sm:flex-initial"
        >
          60d
        </Button>
      </div>

      {/* Date Range Inputs */}
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          type="date"
          value={fromDate}
          onChange={handleFromChange}
          className="h-10 sm:h-8 w-full sm:w-[140px]"
        />
        <span className="text-sm text-muted-foreground shrink-0">to</span>
        <Input
          type="date"
          value={toDate}
          onChange={handleToChange}
          className="h-10 sm:h-8 w-full sm:w-[140px]"
        />
      </div>
    </div>
  )
}
