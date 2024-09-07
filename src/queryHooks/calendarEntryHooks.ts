import { api } from "~/utils/api";
import { CalendarEntry, Recipe } from "@prisma/client";

interface OptimisticCalendarEntry extends CalendarEntry {
  recipe: Recipe;
  temp: boolean;
}

export const useGetCalendarEntriesByDateRange = (start: Date, end: Date) => {
  return api.calendarEntry.getByDateRange.useQuery({ start, end });
};

export const useCreateCalendarEntry = () => {
  const utils = api.useUtils();
  return api.calendarEntry.createWithExistingRecipe.useMutation({
    onSettled: () => {
      utils.calendarEntry.getByDateRange.invalidate();
    },
  });
};

export const useCreateCalendarEntryWithNewRecipe = () => {
  const utils = api.useUtils();
  return api.calendarEntry.createEntryWithNewRecipe.useMutation({
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await utils.calendarEntry.getByDateRange.cancel();

      // Get the current data
      const prevData = utils.calendarEntry.getByDateRange.getData();

      // Optimistically update the cache
      utils.calendarEntry.getByDateRange.setQueriesData(
        undefined,
        { queryKey: undefined },
        (old) => {
          const newCalendarEntry: OptimisticCalendarEntry = {
            id: Date.now(), // Temporary ID
            userId: old?.[0]?.userId ?? "",
            order: 0,
            date: newEntry.date,
            recipeId: Date.now(), // Temporary ID
            recipe: { id: Date.now(), name: newEntry.name } as Recipe,
            temp: true,
          };
          return old ? [...old, newCalendarEntry] : [newCalendarEntry];
        },
      );

      return { prevData };
    },
    onError: (err, newEntry, context) => {
      // If the mutation fails, use the context we returned above
      utils.calendarEntry.getByDateRange.setQueriesData(
        undefined,
        { queryKey: undefined },
        context?.prevData,
      );
    },
    onSettled: () => {
      // Sync with the server
      utils.calendarEntry.getByDateRange.invalidate();
      utils.recipe.getAll.invalidate();
    },
  });
};

export const useUpdateCalendarEntry = () => {
  const utils = api.useUtils();
  return api.calendarEntry.update.useMutation({
    onSettled: () => {
      utils.calendarEntry.getByDateRange.invalidate();
    },
  });
};

export const useDeleteCalendarEntry = () => {
  const utils = api.useUtils();
  return api.calendarEntry.delete.useMutation({
    onMutate: async (deletedEntry) => {
      await utils.calendarEntry.getByDateRange.cancel();
      const prevData = utils.calendarEntry.getByDateRange.getData();

      utils.calendarEntry.getByDateRange.setQueriesData(
        undefined, // This will update all date ranges
        { queryKey: undefined },
        (old) => old?.filter((entry) => entry.id !== deletedEntry.id),
      );

      return { prevData };
    },
    onError: (err, deletedEntry, context) => {
      utils.calendarEntry.getByDateRange.setQueriesData(
        undefined, // This will update all date ranges
        { queryKey: undefined },
        context?.prevData,
      );
    },
    onSettled: () => {
      utils.calendarEntry.getByDateRange.invalidate();
    },
  });
};
