import Link from "next/link";
import { Plus, Search, Layers, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

// Temporary mock data
const MOCK_TEMPLATES = [
  { id: '1', name: 'Standard Weekly', planCount: 7 },
  { id: '2', name: 'Weekend Specials', planCount: 2 },
  { id: '3', name: 'Diet Reset Week', planCount: 5 },
];

export default function TemplatesPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Templates</h1>
          <p className={styles.subtitle}>Reusable sequences of meal plans</p>
        </div>
        <Link href="/templates/new">
          <Button>
            <Plus size={20} />
            <span>Create Template</span>
          </Button>
        </Link>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <Input 
            type="text" 
            placeholder="Search templates..." 
            className={styles.searchInput}
            fullWidth 
          />
        </div>
      </div>

      <div className={styles.grid}>
        {MOCK_TEMPLATES.map((template) => (
          <Card key={template.id} hoverable className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <Layers className={styles.icon} size={24} />
              </div>
              <h3 className={styles.templateName}>{template.name}</h3>
            </div>
            
            <div className={styles.content}>
              <div className={styles.statBox}>
                <CalendarRange size={16} className={styles.statIcon} />
                <span className={styles.statText}>{template.planCount} Day Routine</span>
              </div>
            </div>
            
            <div className={styles.footer}>
              <Button variant="outline" size="sm" fullWidth>Apply to Calendar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
