import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar, BookOpen, ShoppingCart, Sparkles } from "lucide-react";
import styles from "./page.module.css";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  if (!isAuthed) {
    return (
      <div className={styles.landing}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              <Sparkles size={16} /> Plan smarter meals
            </span>
            <h1 className={styles.heroTitle}>Meal planning that feels effortless.</h1>
            <p className={styles.heroSubtitle}>
              Build recipes, assemble meal plans, and generate shopping lists in minutes.
              Sign in to keep everything synced.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login">
                <Button size="lg">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
          <div className={styles.heroCardGrid}>
            <Card className={styles.heroCard}>
              <Calendar size={24} />
              <h3>Schedule meals</h3>
              <p>Drag, drop, and visualize your upcoming weeks.</p>
            </Card>
            <Card className={styles.heroCard}>
              <BookOpen size={24} />
              <h3>Save recipes</h3>
              <p>Store favorites and organize by meal plans.</p>
            </Card>
            <Card className={styles.heroCard}>
              <ShoppingCart size={24} />
              <h3>Shop smarter</h3>
              <p>Generate a grocery list from your schedule.</p>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Welcome back, Chef!</h1>
          <p className={styles.subtitle}>Here's your meal plan overview.</p>
        </div>
        <Link href="/recipes/new">
          <Button className={styles.addButton}>
            <Plus size={20} />
            <span>New Recipe</span>
          </Button>
        </Link>
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
          <Link href="/schedule">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
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
