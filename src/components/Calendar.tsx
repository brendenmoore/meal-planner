import { useState } from "react";
import {
  add,
  addDays,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
  subDays,
} from "date-fns";
import { useGetCalendarEntriesByDateRange } from "~/queryHooks/calendarEntryHooks";
import { CalendarDay } from "./CalendarDay";
import { CalendarDayDialog } from "./CalendarDayDialog";

export function Calendar() {
  const currentDate = new Date();
  const startOfCurrentMonth = startOfMonth(currentDate);
  const endOfCurrentMonth = endOfMonth(currentDate);
  const startDate = subDays(startOfCurrentMonth, getDay(startOfCurrentMonth));
  const daysInMonth = endOfCurrentMonth.getDate();
  const weeksToShow = Math.ceil(
    (getDay(startOfCurrentMonth) + daysInMonth) / 7,
  );
  const totalDays = weeksToShow * 7;
  const endDate = addDays(startDate, totalDays - 1);

  const { data: calendarEntries } = useGetCalendarEntriesByDateRange(
    startDate,
    endDate,
  );

  const calendarDays = [];
  let day = startDate;

  for (let i = 0; i < totalDays; i++) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const getRecipesForDate = (date: Date) => {
    return calendarEntries?.filter((entry) => {
      return (
        format(
          add(entry.date, { minutes: date.getTimezoneOffset() }),
          "yyyy-MM-dd",
        ) === format(date, "yyyy-MM-dd")
      );
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="mb-4 text-2xl font-bold">
        {format(currentDate, "MMMM yyyy")}
      </h2>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}
        {calendarDays.map((date, index) => {
          const dayEntries = getRecipesForDate(date);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isCurrentDay = isToday(date);
          return (
            <CalendarDayDialog key={index} date={date} entries={dayEntries}>
              <CalendarDay
                date={date}
                entries={dayEntries}
                isCurrentMonth={isCurrentMonth}
                isCurrentDay={isCurrentDay}
                onClick={() => {}}
              />
            </CalendarDayDialog>
          );
        })}
      </div>
    </div>
  );
}
