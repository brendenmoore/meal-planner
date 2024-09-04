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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  useCreateCalendarEntryWithNewRecipe,
  useGetCalendarEntriesByDateRange,
} from "~/queryHooks/calendarEntryHooks";
import { CalendarDay } from "./CalendarDay";

export function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [newRecipe, setNewRecipe] = useState("");

  const currentDate = new Date(2024, 5, 1);
  const startOfCurrentMonth = startOfMonth(currentDate);
  const endOfCurrentMonth = endOfMonth(currentDate);
  const startDate = subDays(startOfCurrentMonth, getDay(startOfCurrentMonth));
  const daysInMonth = endOfCurrentMonth.getDate();
  const weeksToShow = Math.ceil((getDay(startOfCurrentMonth) + daysInMonth) / 7);
  const totalDays = weeksToShow * 7;
  const endDate = addDays(startDate, totalDays - 1);

  const { data: calendarEntries } = useGetCalendarEntriesByDateRange(
    startDate,
    endDate,
  );
  const addEntryWithNewRecipe = useCreateCalendarEntryWithNewRecipe();

  const calendarDays = [];
  let day = startDate;

  for (let i = 0; i < totalDays; i++) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const handleAddRecipe = () => {
    if (selectedDate && newRecipe) {
      addEntryWithNewRecipe.mutate({
        name: newRecipe,
        date: selectedDate,
      });
      setNewRecipe("");
    }
  };

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
            <Dialog key={index}>
              <DialogTrigger asChild>
                <CalendarDay
                  date={date}
                  entries={dayEntries}
                  isCurrentMonth={isCurrentMonth}
                  isCurrentDay={isCurrentDay}
                  onClick={() => {
                    setSelectedDate(date);
                    handleAddRecipe();
                  }}
                />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{format(date, "MMMM d, yyyy")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <ScrollArea className="h-[200px]">
                    {dayEntries && dayEntries.length > 0 ? (
                      <ul className="space-y-2">
                        {dayEntries.map((entry) => (
                          <li key={entry.id} className="text-sm">
                            {entry.recipe.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No recipes for this day.
                      </p>
                    )}
                  </ScrollArea>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a recipe"
                      value={newRecipe}
                      onChange={(e) => setNewRecipe(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        setSelectedDate(date);
                        handleAddRecipe();
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
}
