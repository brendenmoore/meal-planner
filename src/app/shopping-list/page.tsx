"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { ShoppingCart, CalendarRange, Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

// Mock Data
const MOCK_STAPLES = [
  { id: 's1', name: 'Milk', defaultIncluded: true },
  { id: 's2', name: 'Eggs', defaultIncluded: true },
  { id: 's3', name: 'Bread', defaultIncluded: true },
  { id: 's4', name: 'Olive Oil', defaultIncluded: false },
];

const MOCK_RECIPE_INGREDIENTS = [
  { name: 'Spaghetti', amount: '1 lb', category: 'Pantry' },
  { name: 'Ground Beef', amount: '1 lb', category: 'Meat' },
  { name: 'Tomato Sauce', amount: '24 oz', category: 'Pantry' },
  { name: 'Garlic', amount: '3 cloves', category: 'Produce' },
];

export default function ShoppingListPage() {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [isGenerated, setIsGenerated] = useState(false);
  const [staples, setStaples] = useState(MOCK_STAPLES);
  
  // Shopping list items state
  const [listItems, setListItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");

  const handleGenerate = () => {
    // In a real app, query Schedule between startDate and endDate to get recipes, 
    // get ingredients for those recipes, merge them by category
    
    // For now, combine Mock Recipe Ingredients + Default Staples
    const defaultStaples = staples.filter(s => s.defaultIncluded).map(s => ({
      id: s.id,
      name: s.name,
      amount: '',
      category: 'Staples',
      checked: false
    }));

    const recipeItems = MOCK_RECIPE_INGREDIENTS.map((ing, i) => ({
      id: `r${i}`,
      name: ing.name,
      amount: ing.amount,
      category: ing.category,
      checked: false
    }));

    setListItems([...defaultStaples, ...recipeItems]);
    setIsGenerated(true);
  };

  const toggleItem = (id: string) => {
    setListItems(listItems.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const toggleStapleDefault = (id: string) => {
    setStaples(staples.map(s => s.id === id ? { ...s, defaultIncluded: !s.defaultIncluded } : s));
  };

  const addManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    setListItems([...listItems, {
      id: `m${Date.now()}`,
      name: newItemName,
      amount: '',
      category: 'Manual Additions',
      checked: false
    }]);
    setNewItemName("");
  };

  const groupedItems = listItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Shopping List</h1>
          <p className={styles.subtitle}>Generate lists based on your schedule</p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.mainPanel}>
          <Card className={styles.generatorCard}>
            <h3>Generate from Schedule</h3>
            <div className={styles.dateControls}>
              <Input 
                type="date" 
                label="From Date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span className={styles.dateSeparator}>to</span>
              <Input 
                type="date" 
                label="To Date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
              <Button onClick={handleGenerate} className={styles.generateBtn}>
                <CalendarRange size={18} /> Generate List
              </Button>
            </div>
          </Card>

          {isGenerated ? (
            <Card className={styles.listCard}>
              <div className={styles.listHeader}>
                <h3>Your Groceries</h3>
                <span className={styles.itemCount}>
                  {listItems.filter(i => i.checked).length} / {listItems.length} items
                </span>
              </div>

              <form onSubmit={addManualItem} className={styles.addManualForm}>
                <Input 
                  placeholder="Add a quick item..." 
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  fullWidth
                />
                <Button type="submit" variant="secondary" className={styles.manualBtn}>
                  <Plus size={18} /> Add
                </Button>
              </form>

              <div className={styles.categories}>
                {Object.keys(groupedItems).sort().map(category => (
                  <div key={category} className={styles.categoryGroup}>
                    <h4 className={styles.categoryTitle}>{category}</h4>
                    <ul className={styles.itemsList}>
                      {groupedItems[category].map((item: any) => (
                        <li 
                          key={item.id} 
                          className={`${styles.listItem} ${item.checked ? styles.checked : ''}`}
                          onClick={() => toggleItem(item.id)}
                        >
                          <div className={styles.checkbox}>
                            {item.checked && <Check size={14} />}
                          </div>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{item.name}</span>
                            {item.amount && <span className={styles.itemAmount}>{item.amount}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
             <div className={styles.emptyState}>
                <ShoppingCart size={48} className={styles.emptyIcon} />
                <p>Select a date range and click Generate to build your shopping list automatically based on your planned meals.</p>
             </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <Card className={styles.staplesCard}>
            <div className={styles.staplesHeader}>
              <h3>Staples</h3>
              <Button variant="ghost" size="sm"><Plus size={16} /></Button>
            </div>
            <p className={styles.helperText}>
              Staples are added to every shopping list automatically.
            </p>
            
            <div className={styles.staplesList}>
              {staples.map(staple => (
                <div key={staple.id} className={styles.stapleItem}>
                  <button 
                    className={`${styles.toggleBtn} ${staple.defaultIncluded ? styles.active : ''}`}
                    onClick={() => toggleStapleDefault(staple.id)}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                  <span className={styles.stapleName}>{staple.name}</span>
                  <Button variant="ghost" size="sm" className={styles.removeStaple}>
                     <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
