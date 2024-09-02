import { api } from "~/utils/api";

export const useGetAllRecipes = () => {
  return api.recipe.getAll.useQuery();
};

export const useCreateRecipe = () => {
  const utils = api.useUtils();
  return api.recipe.create.useMutation({
    onSettled: () => {
      utils.recipe.getAll.invalidate();
    },
  });
};

export const useUpdateRecipe = () => {
  const utils = api.useUtils();
  return api.recipe.update.useMutation({
    onSettled: () => {
      utils.recipe.getAll.invalidate();
    },
  });
};

export const useDeleteRecipe = () => {
  const utils = api.useUtils();
  return api.recipe.delete.useMutation({
    onSettled: () => {
      utils.recipe.getAll.invalidate();
    },
  });
};
