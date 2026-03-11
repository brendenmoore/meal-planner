"use client";

import { useState, useMemo } from "react";
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, 
  addMonths, isToday, parseISO
} from "date-fns";
import { ChevronLeft, ChevronRight, Wand2, Plus, Search, Layers, BookOpen } from "lucide-react";
import { 
  DndContext, DragEndEvent, DragOverlay, 
  useSensor, useSensors, PointerSensor, TouchSensor 
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import styles from "./page.module.css";

// Mock available items to add
const MOCK_AVAILABLE = [
  { id: 'p1', name: 'Italian Night', type: 'meal-plan' },
  { id: 'p2', name: 'Quick Lunch', type: 'meal-plan' },
  { id: 'r1', name: 'Avocado Toast', type: 'recipe' },
  { id: 'r2', name: 'Grilled Salmon', type: 'recipe' },
];

function DraggableMeal({ meal, dateKey }: { meal: any, dateKey: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${meal.id}-${dateKey}`,
    data: { meal, sourceDate: dateKey }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`${styles.mealBadge} ${meal.type === 'meal-plan' ? styles.badgePlan : styles.badgeRecipe} ${isDragging ? styles.dragging : ''}`}
    >
      {meal.name}
    </div>
  );
}

function DroppableDay({ dateKey, isToday, dayNum, meals, onAddClick }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`${styles.dayCard} ${isToday ? styles.today : ''} ${isOver ? styles.droppableOver : ''}`}
      hoverable
    >
      <div className={styles.dayHeader}>
        <span className={styles.dayNumber}>{dayNum}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className={styles.addMealBtn}
          onClick={() => onAddClick(dateKey)}
        >
          <Plus size={14} />
        </Button>
      </div>
      
      <div className={styles.mealsContainer}>
        {meals.map((meal: any) => (
          <DraggableMeal key={`${meal.id}-${dateKey}`} meal={meal} dateKey={dateKey} />
        ))}
      </div>
    </Card>
  );
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Schedule state: Map of date string 'YYYY-MM-DD' -> array of meal objects
  const [schedule, setSchedule] = useState<Record<string, any[]>>({
    [format(new Date(), 'yyyy-MM-dd')]: [
      { id: 'p1', type: 'meal-plan', name: 'Italian Night' }
    ],
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDragMeal, setActiveDragMeal] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const calendarDays = useMemo(() => {
    const firstMonthStart = startOfMonth(currentDate);
    const firstMonthEnd = endOfMonth(currentDate);
    const secondMonth = addMonths(currentDate, 1);
    
    return [
      {
        name: format(firstMonthStart, 'MMMM yyyy'),
        days: eachDayOfInterval({ start: firstMonthStart, end: firstMonthEnd }),
        startOffset: firstMonthStart.getDay()
      },
      {
        name: format(startOfMonth(secondMonth), 'MMMM yyyy'),
        days: eachDayOfInterval({ start: startOfMonth(secondMonth), end: endOfMonth(secondMonth) }),
        startOffset: startOfMonth(secondMonth).getDay()
      }
    ];
  }, [currentDate]);

  const handleDragStart = (event: any) => {
    setActiveDragMeal(event.active.data.current?.meal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragMeal(null);
    
    if (over && active.data.current) {
      const { meal, sourceDate } = active.data.current;
      const targetDate = over.id as string;

      if (sourceDate !== targetDate) {
        setSchedule(prev => {
          const newSchedule = { ...prev };
          // Remove from source
          newSchedule[sourceDate] = (newSchedule[sourceDate] || []).filter(m => m.id !== meal.id);
          // Add to target
          newSchedule[targetDate] = [...(newSchedule[targetDate] || []), meal];
          return newSchedule;
        });
      }
    }
  };

  const openAddModal = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setSearchQuery("");
    setIsModalOpen(true);
  };

  const handleAddItem = (item: any) => {
    if (selectedDateKey) {
      setSchedule(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] || []), item]
      }));
    }
    setIsModalOpen(false);
  };

  const filteredItems = MOCK_AVAILABLE.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Meal plans first
    if (a.type === 'meal-plan' && b.type !== 'meal-plan') return -1;
    if (a.type !== 'meal-plan' && b.type === 'meal-plan') return 1;
    return 0;
  });

  const handleAutofill = () => {
    // Simulated Autofill from a "Standard Weekly" template (7 days)
    const mockTemplate = [
      { id: 'p1', name: 'Italian Night', type: 'meal-plan' },
      { id: 'p2', name: 'Quick Lunch', type: 'meal-plan' },
      null, // Day 3 empty
      { id: 'p3', name: 'Steak & Veggies', type: 'meal-plan' },
      null,
      { id: 'p1', name: 'Italian Night', type: 'meal-plan' }, // repeat
      { id: 'p4', name: 'Pancakes & Bacon', type: 'meal-plan' },
    ];

    const newSchedule = { ...schedule };
    let currentFillDate = new Date();

    // Fill the next 14 days by looping the 7 day template
    for (let i = 0; i < 14; i++) {
      const dateKey = format(currentFillDate, 'yyyy-MM-dd');
      const templateItem = mockTemplate[i % mockTemplate.length];
      
      if (templateItem) {
        // Prevent duplicates
        const existing = newSchedule[dateKey] || [];
        if (!existing.find(m => m.id === templateItem.id)) {
          newSchedule[dateKey] = [...existing, { ...templateItem, id: `${templateItem.id}-${Date.now()}-${i}` }];
        }
      }
      currentFillDate = new Date(currentFillDate.setDate(currentFillDate.getDate() + 1));
    }
    
    setSchedule(newSchedule);
    alert('Autofilled the next 14 days using the "Standard Weekly" template!');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Schedule</h1>
          <p className={styles.subtitle}>Plan your upcoming meals</p>
        </div>
        <Button variant="secondary" className={styles.autofillBtn} onClick={handleAutofill}>
          <Wand2 size={18} />
          <span>Autofill from Template</span>
        </Button>
      </header>

      <div className={styles.calendarControls}>
        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(prev => addMonths(prev, -1))}>
          <ChevronLeft size={20} />
        </Button>
        <h2 className={styles.dateRange}>
          {calendarDays[0].name} — {calendarDays[1].name}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(prev => addMonths(prev, 1))}>
          <ChevronRight size={20} />
        </Button>
      </div>

      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.calendarWrapper}>
          {calendarDays.map((month, idx) => (
            <div key={idx} className={styles.monthSection}>
              <h3 className={styles.monthName}>{month.name}</h3>
              
              <div className={styles.weekDays}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className={styles.weekDayHeader}>{day}</div>
                ))}
              </div>

              <div className={styles.daysGrid}>
                {Array.from({ length: month.startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className={styles.emptyDay} />
                ))}
                
                {month.days.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  return (
                    <DroppableDay 
                      key={dateKey}
                      dateKey={dateKey}
                      dayNum={format(day, 'd')}
                      isToday={isToday(day)}
                      meals={schedule[dateKey] || []}
                      onAddClick={openAddModal}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeDragMeal ? (
            <div className={`${styles.mealBadge} ${styles.draggingOverlay} ${activeDragMeal.type === 'meal-plan' ? styles.badgePlan : styles.badgeRecipe}`}>
              {activeDragMeal.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedDateKey ? `Add to ${format(parseISO(selectedDateKey), 'MMM do, yyyy')}` : "Add meal"}
      >
        <div className={styles.modalContent}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <Input 
              autoFocus
              placeholder="Search meal plans and recipes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              fullWidth
            />
          </div>
          
          <div className={styles.searchResults}>
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className={styles.resultItem}
                onClick={() => handleAddItem(item)}
              >
                <div className={styles.resultIcon}>
                  {item.type === 'meal-plan' ? <Layers size={18} className={styles.planIcon} /> : <BookOpen size={18} className={styles.recipeIcon} />}
                </div>
                <div className={styles.resultInfo}>
                  <h4>{item.name}</h4>
                  <span>{item.type === 'meal-plan' ? 'Meal Plan' : 'Recipe'}</span>
                </div>
                <Button variant="ghost" size="sm"><Plus size={16}/></Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
