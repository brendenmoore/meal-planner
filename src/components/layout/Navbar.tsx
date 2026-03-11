import Link from 'next/link';
import { CalendarDays, ShoppingCart, User, BookOpen } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={`glass-panel ${styles.navbar}`}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          <CalendarDays className={styles.icon} />
          <span className="text-gradient">Meal Mates</span>
        </Link>
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
      </div>
    </nav>
  );
}
