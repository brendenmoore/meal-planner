"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { apiFetchWithAuth } from "@/utils/mobile-auth";
import styles from "./page.module.css";

type Recipe = {
  id: string;
  name: string;
  instructions?: string | null;
  ingredients?: Array<{ name: string; amount?: string }>;
};

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      const res = await apiFetchWithAuth("/api/recipes");
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to load recipes.");
      } else if (mounted) {
        setRecipes(data.recipes ?? []);
      }

      if (mounted) setIsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((recipe) => recipe.name.toLowerCase().includes(query));
  }, [recipes, search]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Recipes</h1>
          <p className={styles.subtitle}>Manage your culinary collection</p>
        </div>
        <Link href="/recipes/new">
          <Button>
            <Plus size={20} />
            <span>Add Recipe</span>
          </Button>
        </Link>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <Input 
            type="text" 
            placeholder="Search recipes..." 
            className={styles.searchInput}
            fullWidth 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" className={styles.filterBtn}>
          <Filter size={20} />
        </Button>
      </div>

      <div className={styles.recipeGrid}>
        {isLoading ? (
          <Card className={styles.recipeCard}>
            <div className={styles.recipeInfo}>
              <h3 className={styles.recipeName}>Loading recipes...</h3>
            </div>
          </Card>
        ) : error ? (
          <Card className={styles.recipeCard}>
            <div className={styles.recipeInfo}>
              <h3 className={styles.recipeName}>Could not load recipes</h3>
              <p className={styles.recipeMeta}>{error}</p>
            </div>
          </Card>
        ) : filteredRecipes.length === 0 ? (
          <Card className={styles.recipeCard}>
            <div className={styles.recipeInfo}>
              <h3 className={styles.recipeName}>No recipes yet</h3>
              <p className={styles.recipeMeta}>Create one to get started.</p>
            </div>
          </Card>
        ) : (
          filteredRecipes.map((recipe) => (
            <Card key={recipe.id} hoverable className={styles.recipeCard}>
              <div className={styles.recipeImagePlaceholder}>
                {recipe.name?.charAt(0).toUpperCase()}
              </div>
              <div className={styles.recipeInfo}>
                <h3 className={styles.recipeName}>{recipe.name}</h3>
                <p className={styles.recipeMeta}>
                  {recipe.ingredients?.length ?? 0} ingredients
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
