"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Utensils } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/utils/api";
import styles from "./page.module.css";

type MealPlan = {
  id: string;
  name: string;
  recipe_ids: string[];
};

type Recipe = {
  id: string;
  name: string;
};

export default function MealPlansPage() {
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      const [planRes, recipeRes] = await Promise.all([
        apiFetch("/api/meal-plans"),
        apiFetch("/api/recipes"),
      ]);

      if (planRes.status === 401 || recipeRes.status === 401) {
        router.push("/login");
        return;
      }

      const planData = await planRes.json();
      const recipeData = await recipeRes.json();

      if (!planRes.ok) {
        setError(planData?.error ?? "Failed to load meal plans.");
      } else if (mounted) {
        setMealPlans(planData.mealPlans ?? []);
      }

      if (!recipeRes.ok) {
        setError(recipeData?.error ?? "Failed to load recipes.");
      } else if (mounted) {
        setRecipes(recipeData.recipes ?? []);
      }

      if (mounted) setIsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const recipesById = useMemo(() => {
    const map = new Map<string, string>();
    recipes.forEach((recipe) => map.set(recipe.id, recipe.name));
    return map;
  }, [recipes]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return mealPlans;
    return mealPlans.filter((plan) => plan.name.toLowerCase().includes(query));
  }, [mealPlans, search]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Meal Plans</h1>
          <p className={styles.subtitle}>Combinations of your favorite recipes</p>
        </div>
        <Link href="/meal-plans/new">
          <Button>
            <Plus size={20} />
            <span>Create Plan</span>
          </Button>
        </Link>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <Input 
            type="text" 
            placeholder="Search meal plans..." 
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

      <div className={styles.grid}>
        {isLoading ? (
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.planName}>Loading meal plans...</h3>
            </div>
          </Card>
        ) : error ? (
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.planName}>Could not load meal plans</h3>
            </div>
            <div className={styles.content}>
              <p className={styles.meta}>{error}</p>
            </div>
          </Card>
        ) : filteredPlans.length === 0 ? (
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.planName}>No meal plans yet</h3>
            </div>
            <div className={styles.content}>
              <p className={styles.meta}>Create one to build templates.</p>
            </div>
          </Card>
        ) : (
          filteredPlans.map((plan) => {
            const recipeNames = plan.recipe_ids.map((id) => recipesById.get(id) ?? "Unknown recipe");
            return (
              <Card key={plan.id} hoverable className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.emoji}>🍽️</span>
                  </div>
                  <h3 className={styles.planName}>{plan.name}</h3>
                </div>
                
                <div className={styles.content}>
                  <div className={styles.label}>
                    <Utensils size={14} />
                    <span>Includes {recipeNames.length} recipes</span>
                  </div>
                  <ul className={styles.recipeList}>
                    {recipeNames.map((recipe, idx) => (
                      <li key={idx} className={styles.recipeItem}>
                        <div className={styles.bullet}></div>
                        <span>{recipe}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.footer}>
                  <span className={styles.meta}>{recipeNames.length} total recipes</span>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
