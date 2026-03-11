import Link from "next/link";
import { CalendarDays, ShoppingCart, User, BookOpen } from "lucide-react";
import styles from "./Navbar.module.css";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  return (
    <nav
      className={`glass-panel ${styles.navbar} ${!isAuthed ? styles.publicNavbar : ""}`}
    >
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          <CalendarDays className={styles.icon} />
          <span className="text-gradient">Meal Mates</span>
        </Link>
        {isAuthed ? (
          <div className={styles.navLinks}>
            <Link href="/recipes" className={styles.navLink}>
              <BookOpen size={20} />
              <span className={styles.linkLabel}>Recipes</span>
            </Link>
            <Link href="/schedule" className={styles.navLink}>
              <CalendarDays size={20} />
              <span className={styles.linkLabel}>Schedule</span>
            </Link>
            <Link href="/shopping-list" className={styles.navLink}>
              <ShoppingCart size={20} />
              <span className={styles.linkLabel}>Shopping</span>
            </Link>
            <Link href="/profile" className={styles.navLink}>
              <User size={20} />
              <span className={styles.linkLabel}>Profile</span>
            </Link>
          </div>
        ) : (
          <div className={styles.authLinks}>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Create Account</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
