import * as React from "react"
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "./scroll-area"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
}

const weekDays = ['wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'monday', 'tuesday']
const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 }, (_, i) => i)

export function TimePicker({ date, setDate, className }: TimePickerProps) {
  const { t } = useTranslation()
  const [selectedDay, setSelectedDay] = React.useState<string | undefined>(
    date ? weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1] : undefined
  )
  const [selectedHour, setSelectedHour] = React.useState<number | undefined>(
    date ? date.getHours() : undefined
  )
  const [selectedMinute, setSelectedMinute] = React.useState<number | undefined>(
    date ? date.getMinutes() : undefined
  )

  const handleSelect = (day?: string, hour?: number, minute?: number) => {
    const newDay = day ?? selectedDay
    const newHour = hour ?? selectedHour ?? 0
    const newMinute = minute ?? selectedMinute ?? 0

    if (day !== undefined) setSelectedDay(day)
    if (hour !== undefined) setSelectedHour(hour)
    if (minute !== undefined) setSelectedMinute(minute)

    if (newDay) {
      const now = new Date()
      const dayIndex = weekDays.indexOf(newDay)
      const targetDay = dayIndex < 5 ? dayIndex + 3 : dayIndex - 4
      const newDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + (targetDay - now.getDay()),
        newHour,
        newMinute
      )
      setDate(newDate)
    }
  }

  const getDisplayDay = (date: Date) => {
    // 将 JavaScript 的星期日（0）到星期六（6）转换为我们的顺序
    const day = date.getDay()
    // 根据我们的顺序（星期三是第一天）计算索引
    const index = (day + 4) % 7  // +4 是因为我们要让星期三（3）变成 0
    return weekDays[index]
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-6 px-2 text-xs", className)}
        >
          {date ? (
            `${t(`calculator.calculator.weekDays.${getDisplayDay(date)}`)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          ) : (
            t('calculator.calculator.startTime')
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-2 p-2">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium px-2 py-1.5">{t('calculator.calculator.weekDay')}</div>
            <ScrollArea className="h-[180px] w-[100px]">
              <div className="flex flex-col p-2 gap-1">
                {weekDays.map((day) => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? "default" : "ghost"}
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => handleSelect(day)}
                  >
                    {t(`calculator.calculator.weekDays.${day}`)}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium px-2 py-1.5">{t('calculator.calculator.hour')}</div>
            <ScrollArea className="h-[180px] w-[60px]">
              <div className="flex flex-col p-2 gap-1">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    variant={selectedHour === hour ? "default" : "ghost"}
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => handleSelect(undefined, hour)}
                  >
                    {hour.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium px-2 py-1.5">{t('calculator.calculator.minute')}</div>
            <ScrollArea className="h-[180px] w-[60px]">
              <div className="flex flex-col p-2 gap-1">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    variant={selectedMinute === minute ? "default" : "ghost"}
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => handleSelect(undefined, undefined, minute)}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
