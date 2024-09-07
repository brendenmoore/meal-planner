import { CalendarEntry, Recipe } from "@prisma/client";
import { format } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "~/lib/utils";

interface CalendarDayEntry extends CalendarEntry {
  recipe?: Recipe;
}

interface CalendarDayProps {
  date: Date;
  isLoading: boolean;
  entries?: CalendarDayEntry[];
  isCurrentMonth: boolean;
  isCurrentDay: boolean;
  onClick: () => void;
}

export const CalendarDay = ({
  isLoading,
  date,
  entries,
  isCurrentMonth,
  isCurrentDay,
  onClick,
}: CalendarDayProps) => {
  return (
    <div
      className={cn(
        "aspect-square cursor-pointer border p-2",
        isCurrentMonth ? "bg-white" : "bg-gray-100",
        isCurrentDay ? "border-secondary border-2" : "",
        isLoading ? "animate-pulse bg-gray-50" : "",
      )}
      onClick={onClick}
    >
      <div className="mb-1 text-sm font-semibold">{format(date, "d")}</div>
      <ScrollArea className="h-[calc(100%-1.5rem)]">
        {entries?.map((entry) => (
          <div key={entry.id} className="mb-1 truncate">
            {entry.recipe?.name}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};
