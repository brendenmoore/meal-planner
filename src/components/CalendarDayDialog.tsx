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
import { useCreateCalendarEntryWithNewRecipe } from "~/queryHooks/calendarEntryHooks";
import { CalendarEntry, Recipe } from "@prisma/client";

interface CalendarDayEntry extends CalendarEntry {
  recipe: Recipe;
}

interface CalendarDayDialogProps {
  date: Date;
  entries?: CalendarDayEntry[];
  children: React.ReactNode;
}

export function CalendarDayDialog({ date, entries, children }: CalendarDayDialogProps) {
  const [newRecipe, setNewRecipe] = useState("");
  const addEntryWithNewRecipe = useCreateCalendarEntryWithNewRecipe();

  const handleAddRecipe = () => {
    if (newRecipe) {
      addEntryWithNewRecipe.mutate({
        name: newRecipe,
        date: date,
      });
      setNewRecipe("");
    }
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
                  <li key={entry.id} className="text-sm">
                    {entry.recipe.name}
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