import { api } from "~/utils/api";

export const useGetCalendarEntriesByMonth = (month: number, year: number) => {
  return api.calendarEntry.getByMonth.useQuery({ month, year });
};

export const useCreateCalendarEntry = () => {
  const utils = api.useUtils();
  return api.calendarEntry.createWithExistingRecipe.useMutation({
    onSettled: (variables) => {
      utils.calendarEntry.getByMonth.invalidate({
        month: variables?.date.getMonth(),
        year: variables?.date.getFullYear(),
      });
    },
  });
};

export const useCreateCalendarEntryWithNewRecipe = () => {
  const utils = api.useUtils();
  return api.calendarEntry.createEntryWithNewRecipe.useMutation({
    onSettled: (variables) => {
      utils.calendarEntry.getByMonth.invalidate({
        month: variables?.date.getMonth(),
        year: variables?.date.getFullYear(),
      });
      utils.recipe.getAll.invalidate();
    },
  });
};

export const useUpdateCalendarEntry = () => {
  const utils = api.useUtils();
  return api.calendarEntry.update.useMutation({
    onSettled: () => {
      utils.calendarEntry.getByMonth.invalidate();
    },
  });
};

export const useDeleteCalendarEntry = () => {
  const utils = api.useUtils();
  return api.calendarEntry.delete.useMutation({
    onSettled: () => {
      utils.calendarEntry.getByMonth.invalidate();
    },
  });
};
