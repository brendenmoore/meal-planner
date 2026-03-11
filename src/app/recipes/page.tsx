import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

// Temporary mock data for UI visualization
const MOCK_RECIPES = [
  { id: '1', name: 'Spaghetti Bolognese', time: '45 mins', image: '🍝' },
  { id: '2', name: 'Chicken Caesar Salad', time: '20 mins', image: '🥗' },
  { id: '3', name: 'Avocado Toast', time: '10 mins', image: '🥑' },
];

export default function RecipesPage() {
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
          />
        </div>
        <Button variant="secondary" className={styles.filterBtn}>
          <Filter size={20} />
        </Button>
      </div>

      <div className={styles.recipeGrid}>
        {MOCK_RECIPES.map((recipe) => (
          <Card key={recipe.id} hoverable className={styles.recipeCard}>
            <div className={styles.recipeImagePlaceholder}>{recipe.image}</div>
            <div className={styles.recipeInfo}>
              <h3 className={styles.recipeName}>{recipe.name}</h3>
              <p className={styles.recipeMeta}>{recipe.time}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
