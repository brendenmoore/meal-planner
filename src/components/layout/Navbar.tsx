import Link from "next/link";
import { CalendarDays, ShoppingCart, User, BookOpen } from "lucide-react";
import styles from "./Navbar.module.css";
import { createClient } from "@/utils/supabase/server";
import { isMobileBuild } from "@/utils/mobile-build";
import { Button } from "@/components/ui/Button";

function NavbarView({ isAuthed }: { isAuthed: boolean }) {
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

export default async function Navbar() {
  // Mobile static-export build: no request cookies at prerender time, so
  // prerender the public shell. The client-side guard (MobileAuthGuard)
  // resolves the session at runtime. Web path below is unchanged.
  if (isMobileBuild()) {
    return <NavbarView isAuthed={false} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <NavbarView isAuthed={Boolean(user)} />;
}
