import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar, BookOpen, ShoppingCart } from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Welcome back, Chef!</h1>
          <p className={styles.subtitle}>Here's your meal plan overview.</p>
        </div>
        <Button className={styles.addButton}>
          <Plus size={20} />
          <span>New Recipe</span>
        </Button>
      </header>

      <section className={styles.quickActions}>
        <Link href="/schedule">
          <Card hoverable className={styles.actionCard}>
            <Calendar className={styles.actionIcon} size={28} />
            <h3>Schedule</h3>
            <p>Plan your meals for the week</p>
          </Card>
        </Link>

        <Link href="/recipes">
          <Card hoverable className={styles.actionCard}>
            <BookOpen className={styles.actionIcon} size={28} />
            <h3>Recipes</h3>
            <p>Browse your saved recipes</p>
          </Card>
        </Link>
        
        <Link href="/shopping-list">
          <Card hoverable className={styles.actionCard}>
            <ShoppingCart className={styles.actionIcon} size={28} />
            <h3>Shopping List</h3>
            <p>Generate your grocery list</p>
          </Card>
        </Link>
      </section>

      <section className={styles.upcomingMeals}>
        <div className={styles.sectionHeader}>
          <h2>Upcoming Meals</h2>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className={styles.mealGrid}>
          {/* Placeholder for actual meal plan data */}
          <Card className={styles.mealCard}>
            <div className={styles.mealDate}>Today</div>
            <div className={styles.mealContent}>
              <div className={styles.mealTitle}>Grilled Salmon</div>
              <div className={styles.mealMeta}>Dinner • 45 mins</div>
            </div>
          </Card>
          
          <Card className={styles.mealCard}>
            <div className={styles.mealDate}>Tomorrow</div>
            <div className={styles.mealContent}>
              <div className={styles.mealTitle}>Chicken Alfredo</div>
              <div className={styles.mealMeta}>Dinner • 30 mins</div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
