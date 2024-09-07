import { format } from "date-fns";
import { useState } from "react";
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
  useDeleteCalendarEntry,
} from "~/queryHooks/calendarEntryHooks";
import { CalendarEntry, Recipe } from "@prisma/client";
import { X } from "lucide-react"; // Import the X icon from lucide-react

interface CalendarDayEntry extends CalendarEntry {
  recipe: Recipe;
  temp?: boolean;
}

interface CalendarDayDialogProps {
  date: Date;
  entries?: CalendarDayEntry[];
  children: React.ReactNode;
}

export function CalendarDayDialog({
  date,
  entries,
  children,
}: CalendarDayDialogProps) {
  const [newRecipe, setNewRecipe] = useState("");
  const addEntryWithNewRecipe = useCreateCalendarEntryWithNewRecipe();
  const deleteCalendarEntry = useDeleteCalendarEntry();

  const handleAddRecipe = () => {
    if (newRecipe) {
      addEntryWithNewRecipe.mutate({
        name: newRecipe,
        date: date,
      });
      setNewRecipe("");
    }
  };

  const handleRemoveRecipe = (entryId: number) => {
    deleteCalendarEntry.mutate({ id: entryId });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{format(date, "MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-[200px]">
            {entries && entries.length > 0 ? (
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{entry.recipe.name}</span>
                    <Button
                      disabled={entry.temp}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipe(entry.id)}
                    >
                      {entry.temp ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="sr-only">Remove recipe</span>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
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
            <Button onClick={handleAddRecipe}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
