import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useCreateRecipe, useDeleteRecipe, useGetAllRecipes, useUpdateRecipe } from "~/queryHooks/recipeHooks";

import { api } from "~/utils/api";

export default function Home() {
  const { data: recipes, isLoading, isFetching } = useGetAllRecipes();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  return (
    <>
      <Head>
        <title>Meal Planner</title>
        <meta name="description" content="Plan your meals in advance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Meal Planner
          </h1>
          <div className="text-white">
            <div>
              <h2 className="text-2xl font-bold mb-4">Recipe CRUD Operations</h2>
              
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Create Recipe</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const recipeName = formData.get('recipeName') as string;
                  if (recipeName) {
                    createRecipe.mutate({ name: recipeName });
                    e.currentTarget.reset();
                  }
                }}>
                  <input
                    type="text"
                    name="recipeName"
                    id="recipeName"
                    placeholder="Recipe Name"
                    className="p-2 mr-2 text-black"
                    autoComplete="off"
                    autoCorrect="off"
                    required
                  />
                  <button type="submit" className="bg-blue-500 text-white p-2 rounded">Create</button>
                </form>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Read Recipes</h3>
                <ul className="mt-2">
                  {recipes?.map((recipe) => (
                    <li key={recipe.id}>ID: {recipe.id} - Name: {recipe.name}</li>
                  ))}
                  {createRecipe.isPending && <li className="opacity-50">{createRecipe.variables?.name}</li>}
                  {isFetching && <li className="opacity-50">Loading...</li>}
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Update Recipe</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const recipeId = Number(formData.get('recipeId'));
                  const newName = formData.get('newName') as string;
                  if (recipeId && newName) {
                    updateRecipe.mutate({ id: recipeId, name: newName });
                    e.currentTarget.reset();
                  }
                }}>
                  <input
                    type="number"
                    name="recipeId"
                    placeholder="Recipe ID"
                    className="p-2 mr-2 text-black"
                    required
                  />
                  <input
                    type="text"
                    name="newName"
                    id="newName"
                    autoComplete="off"
                    autoCorrect="off"
                    placeholder="New Name"
                    className="p-2 mr-2 text-black"
                    required
                  />
                  <button type="submit" className="bg-yellow-500 text-white p-2 rounded">Update</button>
                </form>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Delete Recipe</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const recipeId = Number(formData.get('recipeId'));
                  if (recipeId) {
                    if (window.confirm(`Are you sure you want to delete recipe with ID ${recipeId}?`)) {
                      deleteRecipe.mutate({ id: recipeId });
                      e.currentTarget.reset();
                    }
                  }
                }}>
                  <input
                    type="number"
                    name="recipeId"
                    placeholder="Recipe ID"
                    className="p-2 mr-2 text-black"
                    required
                  />
                  <button type="submit" className="bg-red-500 text-white p-2 rounded">Delete</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

