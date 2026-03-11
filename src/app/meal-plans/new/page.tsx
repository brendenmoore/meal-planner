"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

// Mock available recipes to add to the meal plan
const AVAILABLE_RECIPES = [
  { id: '1', name: 'Spaghetti Bolognese', time: '45 mins' },
  { id: '2', name: 'Chicken Caesar Salad', time: '20 mins' },
  { id: '3', name: 'Avocado Toast', time: '10 mins' },
  { id: '4', name: 'Garlic Bread', time: '15 mins' },
  { id: '5', name: 'Grilled Salmon', time: '30 mins' },
];

export default function NewMealPlanPage() {
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<typeof AVAILABLE_RECIPES>([]);

  const filteredRecipes = AVAILABLE_RECIPES.filter(
    r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
         !selectedRecipes.find(sr => sr.id === r.id)
  );

  const addRecipe = (recipe: typeof AVAILABLE_RECIPES[0]) => {
    setSelectedRecipes([...selectedRecipes, recipe]);
    setSearchQuery("");
  };

  const removeRecipe = (id: string) => {
    setSelectedRecipes(selectedRecipes.filter(r => r.id !== id));
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
        <Button disabled={!name || selectedRecipes.length === 0}>
          <Save size={20} />
          <span>Save Plan</span>
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
              {filteredRecipes.length === 0 ? (
                <p className={styles.noResults}>No recipes found.</p>
              ) : (
                filteredRecipes.map(recipe => (
                  <div key={recipe.id} className={styles.resultItem}>
                    <div className={styles.resultInfo}>
                      <h4>{recipe.name}</h4>
                      <span>{recipe.time}</span>
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
