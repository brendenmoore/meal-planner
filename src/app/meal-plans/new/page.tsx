"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Search, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { apiFetchWithAuth } from "@/utils/mobile-auth";
import styles from "./page.module.css";

type Recipe = {
  id: string;
  name: string;
  time?: string;
};

export default function NewMealPlanPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [isSaving, setIsSaving] = useState(false);
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
        setAvailableRecipes(data.recipes ?? []);
      }

      if (mounted) setIsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availableRecipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(query) &&
        !selectedRecipes.find((sr) => sr.id === recipe.id)
    );
  }, [availableRecipes, searchQuery, selectedRecipes]);

  const addRecipe = (recipe: Recipe) => {
    setSelectedRecipes([...selectedRecipes, recipe]);
    setSearchQuery("");
  };

  const removeRecipe = (id: string) => {
    setSelectedRecipes(selectedRecipes.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim() || selectedRecipes.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await apiFetchWithAuth("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          recipe_ids: selectedRecipes.map((recipe) => recipe.id),
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Failed to save meal plan.");
      }

      router.push("/meal-plans");
      router.refresh();
    } catch (saveError) {
      console.error("Meal plan save error:", saveError);
      setError("Failed to save meal plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/meal-plans" className={styles.backLink}>
            <Button variant="ghost" size="sm" className={styles.backBtn}>
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className={styles.title}>Create Meal Plan</h1>
        </div>
        <Button disabled={!name || selectedRecipes.length === 0 || isSaving} onClick={handleSave}>
          {isSaving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={20} />}
          <span>{isSaving ? "Saving..." : "Save Plan"}</span>
        </Button>
      </header>

      <div className={styles.content}>
        <div className={styles.mainPanel}>
          <Card className={styles.formCard}>
            <div className={styles.formGroup}>
              <Input 
                label="Meal Plan Name" 
                placeholder="e.g., Italian Night, Quick Breakfasts..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth 
              />
            </div>
          </Card>

          <Card className={styles.selectedCard}>
            <h3>Included Recipes ({selectedRecipes.length})</h3>
            {error && <p className={styles.errorText}>{error}</p>}
            
            {selectedRecipes.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No recipes added yet. Search and select recipes from the right panel to build your meal plan.</p>
              </div>
            ) : (
              <div className={styles.selectedList}>
                {selectedRecipes.map((recipe, index) => (
                  <div key={recipe.id} className={styles.selectedItem}>
                    <div className={styles.itemNumber}>{index + 1}</div>
                    <div className={styles.itemInfo}>
                      <h4>{recipe.name}</h4>
                      <span>{recipe.time}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeRecipe(recipe.id)}
                      className={styles.removeBtn}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card className={styles.searchCard}>
            <h3>Add Recipes</h3>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} size={18} />
              <Input 
                placeholder="Search your recipes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                fullWidth
              />
            </div>
            
            <div className={styles.searchResults}>
              {isLoading ? (
                <p className={styles.noResults}>Loading recipes...</p>
              ) : filteredRecipes.length === 0 ? (
                <p className={styles.noResults}>No recipes found.</p>
              ) : (
                filteredRecipes.map(recipe => (
                  <div key={recipe.id} className={styles.resultItem}>
                    <div className={styles.resultInfo}>
                      <h4>{recipe.name}</h4>
                      <span>Recipe</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => addRecipe(recipe)}
                      className={styles.addBtn}
                    >
                      <Plus size={16} /> Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
