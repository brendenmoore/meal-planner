import { useState } from "react";
import {
  add,
  addDays,
  endOfMonth,
  format,
  getDay,
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
  useGetCalendarEntriesByMonth,
} from "~/queryHooks/calendarEntryHooks";

type Recipe = {
  name: string;
  date: Date;
};

export function CustomRecipeCalendar() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [newRecipe, setNewRecipe] = useState("");

  const currentDate = new Date();
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const startDayOfWeek = getDay(startDate);
  const totalDays = endDate.getDate();

  const { data: calendarEntries } = useGetCalendarEntriesByMonth(
    currentDate.getMonth(),
    currentDate.getFullYear(),
  );
  const addEntryWithNewRecipe = useCreateCalendarEntryWithNewRecipe();

  const calendarDays = [];
  let day = subDays(startDate, startDayOfWeek);

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
      setSelectedDate(undefined);
    }
  };

  const getRecipesForDate = (date: Date) => {
    return calendarEntries?.filter((entry) => {      return (
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
          return (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <div
                  className={`aspect-square cursor-pointer rounded-lg border p-2 ${
                    isCurrentMonth ? "bg-white" : "bg-gray-100"
                  }`}
                >
                  <div className="mb-1 text-sm font-semibold">
                    {format(date, "d")}
                  </div>
                  <ScrollArea className="h-full">
                    {dayEntries?.map((entry) => (
                      <div key={entry.id} className="mb-1 truncate text-xs">
                        {entry.recipe.name}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
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
