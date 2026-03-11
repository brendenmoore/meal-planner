import Link from "next/link";
import { Plus, Search, Filter, Utensils } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

// Temporary mock data for UI visualization
const MOCK_MEAL_PLANS = [
  { id: '1', name: 'Italian Night', recipes: ['Spaghetti Bolognese', 'Garlic Bread'], time: '60 mins', icon: '🍝' },
  { id: '2', name: 'Quick Lunch', recipes: ['Chicken Caesar Salad', 'Avocado Toast'], time: '25 mins', icon: '🥗' },
];

export default function MealPlansPage() {
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
          />
        </div>
        <Button variant="secondary" className={styles.filterBtn}>
          <Filter size={20} />
        </Button>
      </div>

      <div className={styles.grid}>
        {MOCK_MEAL_PLANS.map((plan) => (
          <Card key={plan.id} hoverable className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <span className={styles.emoji}>{plan.icon}</span>
              </div>
              <h3 className={styles.planName}>{plan.name}</h3>
            </div>
            
            <div className={styles.content}>
              <div className={styles.label}>
                <Utensils size={14} />
                <span>Includes {plan.recipes.length} recipes</span>
              </div>
              <ul className={styles.recipeList}>
                {plan.recipes.map((recipe, idx) => (
                  <li key={idx} className={styles.recipeItem}>
                    <div className={styles.bullet}></div>
                    <span>{recipe}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={styles.footer}>
              <span className={styles.meta}>Total Time: ~{plan.time}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
