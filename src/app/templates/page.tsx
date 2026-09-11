"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Layers, CalendarRange, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/utils/api";
import styles from "./page.module.css";

type Template = {
  id: string;
  name: string;
  meal_plan_ids: string[];
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      const res = await apiFetch("/api/templates");
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to load templates.");
      } else if (mounted) {
        setTemplates(data.templates ?? []);
      }

      if (mounted) setIsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((template) => template.name.toLowerCase().includes(query));
  }, [templates, search]);

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {isLoading ? (
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.templateName}>Loading templates...</h3>
            </div>
          </Card>
        ) : error ? (
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.templateName}>Could not load templates</h3>
            </div>
            <div className={styles.content}>
              <span className={styles.statText}>{error}</span>
            </div>
          </Card>
        ) : filteredTemplates.length === 0 ? (
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.templateName}>No templates yet</h3>
            </div>
            <div className={styles.content}>
              <span className={styles.statText}>Create one to reuse meal plans.</span>
            </div>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
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
                  <span className={styles.statText}>{template.meal_plan_ids?.length ?? 0} Day Routine</span>
                </div>
              </div>
              
              <div className={styles.footer}>
                <Link href={`/templates/new?id=${template.id}`} className={styles.editLink}>
                  <Button variant="outline" size="sm" fullWidth>
                    <Pencil size={16} /> Edit Template
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
