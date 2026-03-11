"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Search, GripVertical, Plus, Trash2 } from "lucide-react";
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

// Mock available meal plans
const AVAILABLE_PLANS = [
  { id: 'p1', name: 'Italian Night', type: 'Dinner' },
  { id: 'p2', name: 'Quick Lunch', type: 'Lunch' },
  { id: 'p3', name: 'Pancakes & Bacon', type: 'Breakfast' },
  { id: 'p4', name: 'Steak & Veggies', type: 'Dinner' },
  { id: 'p5', name: 'Smoothie Bowl', type: 'Breakfast' },
];

function SortablePlanItem({ 
  id, 
  plan, 
  index, 
  onRemove 
}: { 
  id: string, 
  plan: any, 
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
        <span>{plan.type}</span>
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
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // We use objects with a unique instance id since the same plan can be used multiple times
  const [sequence, setSequence] = useState<Array<{instanceId: string, planId: string, plan: any}>>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredPlans = AVAILABLE_PLANS.filter(
    p => p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addPlan = (plan: typeof AVAILABLE_PLANS[0]) => {
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/templates" className={styles.backLink}>
            <Button variant="ghost" size="sm" className={styles.backBtn}>
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className={styles.title}>Create Template</h1>
        </div>
        <Button disabled={!name || sequence.length === 0}>
          <Save size={20} />
          <span>Save Template</span>
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
              {filteredPlans.length === 0 ? (
                <p className={styles.noResults}>No plans found.</p>
              ) : (
                filteredPlans.map(plan => (
                  <div key={plan.id} className={styles.resultItem}>
                    <div className={styles.resultInfo}>
                      <h4>{plan.name}</h4>
                      <span>{plan.type}</span>
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
