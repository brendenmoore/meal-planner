import { api } from "~/utils/api";

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
    onSettled: () => {
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
    onSettled: () => {
      utils.calendarEntry.getByDateRange.invalidate();
    },
  });
};
