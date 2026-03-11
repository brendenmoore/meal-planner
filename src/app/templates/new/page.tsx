"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Search, GripVertical, Plus, Trash2, Loader2 } from "lucide-react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

type MealPlan = {
  id: string;
  name: string;
};

type SequenceItem = {
  instanceId: string;
  planId: string;
  plan: MealPlan;
};

function SortablePlanItem({ 
  id, 
  plan, 
  index, 
  onRemove 
}: { 
  id: string, 
  plan: MealPlan, 
  index: number,
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${styles.selectedItem} ${isDragging ? styles.dragging : ''}`}>
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>
      <div className={styles.dayLabel}>Day {index + 1}</div>
      <div className={styles.itemInfo}>
        <h4>{plan.name}</h4>
        <span>Meal Plan</span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onRemove(id)}
        className={styles.removeBtn}
      >
        <Trash2 size={18} />
      </Button>
    </div>
  );
}

export default function NewTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [templatePlanIds, setTemplatePlanIds] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    let mounted = true;

    const loadMealPlans = async () => {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/meal-plans");
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to load meal plans.");
      } else if (mounted) {
        setMealPlans(data.mealPlans ?? []);
      }

      if (mounted) setIsLoading(false);
    };

    loadMealPlans();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!templateId) return;

    let mounted = true;

    const loadTemplate = async () => {
      const res = await fetch(`/api/templates/${templateId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to load template.");
        return;
      }

      if (mounted) {
        setName(data.template?.name ?? "");
        setTemplatePlanIds(data.template?.meal_plan_ids ?? []);
      }
    };

    loadTemplate();

    return () => {
      mounted = false;
    };
  }, [router, templateId]);

  useEffect(() => {
    if (!templatePlanIds) return;
    if (mealPlans.length === 0 && templatePlanIds.length > 0) return;

    const updatedSequence = templatePlanIds
      .map((planId, index) => {
        const plan = mealPlans.find((item) => item.id === planId);
        if (!plan) return null;
        return {
          instanceId: `inst-${planId}-${index}-${Date.now()}`,
          planId: plan.id,
          plan,
        };
      })
      .filter((item): item is SequenceItem => Boolean(item));

    setSequence(updatedSequence);
  }, [mealPlans, templatePlanIds]);

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return mealPlans.filter((plan) => plan.name.toLowerCase().includes(query));
  }, [mealPlans, searchQuery]);

  const addPlan = (plan: MealPlan) => {
    setSequence([...sequence, {
      instanceId: `inst-${Date.now()}-${Math.random()}`,
      planId: plan.id,
      plan: plan
    }]);
  };

  const removePlan = (instanceId: string) => {
    setSequence(sequence.filter(s => s.instanceId !== instanceId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSequence((items) => {
        const oldIndex = items.findIndex(i => i.instanceId === active.id);
        const newIndex = items.findIndex(i => i.instanceId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!name.trim() || sequence.length === 0) return;

    setIsSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      meal_plan_ids: sequence.map((item) => item.planId),
    };

    try {
      const res = await fetch(templateId ? `/api/templates/${templateId}` : "/api/templates", {
        method: templateId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Failed to save template.");
      }

      router.push("/templates");
      router.refresh();
    } catch (saveError) {
      console.error("Template save error:", saveError);
      setError("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/templates" className={styles.backLink}>
            <Button variant="ghost" size="sm" className={styles.backBtn}>
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className={styles.title}>{templateId ? "Edit Template" : "Create Template"}</h1>
        </div>
        <Button disabled={!name || sequence.length === 0 || isSaving} onClick={handleSave}>
          {isSaving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={20} />}
          <span>{isSaving ? "Saving..." : "Save Template"}</span>
        </Button>
      </header>

      <div className={styles.content}>
        <div className={styles.mainPanel}>
          <Card className={styles.formCard}>
            <div className={styles.formGroup}>
              <Input 
                label="Template Name" 
                placeholder="e.g., Summer Diet Week 1" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth 
              />
            </div>
            <p className={styles.helperText}>
              A template is a sequence of meal plans that you can easily apply to your calendar in a loop.
            </p>
            {error && <p className={styles.errorText}>{error}</p>}
          </Card>

          <Card className={styles.selectedCard}>
            <div className={styles.sequenceHeader}>
              <h3>Meal Sequence ({sequence.length} Days)</h3>
            </div>
            
            {sequence.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No meals in your template yet. Search and add meal plans to build your routine sequence.</p>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={sequence.map(s => s.instanceId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={styles.sequenceList}>
                    {sequence.map((item, index) => (
                      <SortablePlanItem 
                        key={item.instanceId}
                        id={item.instanceId}
                        index={index}
                        plan={item.plan}
                        onRemove={removePlan}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card className={styles.searchCard}>
            <h3>Add Meal Plans</h3>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} size={18} />
              <Input 
                placeholder="Search your plans..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                fullWidth
              />
            </div>
            
            <div className={styles.searchResults}>
              {isLoading ? (
                <p className={styles.noResults}>Loading meal plans...</p>
              ) : filteredPlans.length === 0 ? (
                <p className={styles.noResults}>No plans found.</p>
              ) : (
                filteredPlans.map(plan => (
                  <div key={plan.id} className={styles.resultItem}>
                    <div className={styles.resultInfo}>
                      <h4>{plan.name}</h4>
                      <span>Meal Plan</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => addPlan(plan)}
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
