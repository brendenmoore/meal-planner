"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

export default function AddRecipePage() {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState([{ id: 1, name: "", amount: "" }]);
  const [instructions, setInstructions] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Date.now(), name: "", amount: "" }]);
  };

  const removeIngredient = (id: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const handleIngredientChange = (id: number, field: 'name' | 'amount', value: string) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      reader.readAsDataURL(file);
      const base64Image = await base64Promise;

      // Call API
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        throw new Error('Failed to extract recipe');
      }

      const data = await res.json();
      
      // Update state with extracted data
      if (data.name) setName(data.name);
      if (data.instructions) setInstructions(data.instructions);
      if (data.ingredients && Array.isArray(data.ingredients)) {
        setIngredients(data.ingredients.map((ing: any, i: number) => ({
          id: Date.now() + i,
          name: ing.name || "",
          amount: ing.amount || "",
        })));
      }
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Failed to extract recipe from image. Please try again.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("Please name your recipe before saving.");
      return;
    }

    setIsSaving(true);

    const cleanedIngredients = ingredients
      .map((ing) => ({
        name: ing.name.trim(),
        amount: ing.amount.trim(),
      }))
      .filter((ing) => ing.name || ing.amount);

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          instructions: instructions.trim(),
          ingredients: cleanedIngredients,
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Failed to save recipe.");
      }

      router.push("/recipes");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/recipes" className={styles.backLink}>
            <Button variant="ghost" size="sm" className={styles.backBtn}>
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className={styles.title}>New Recipe</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={20} />}
          <span>{isSaving ? "Saving..." : "Save Recipe"}</span>
        </Button>
      </header>

      <div className={styles.content}>
        <div className={styles.mainForm}>
          <Card className={styles.formCard}>
            <div className={styles.formGroup}>
              <Input 
                label="Recipe Name" 
                placeholder="e.g., Grandma's Lasagna" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth 
              />
            </div>
            
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h3>Ingredients</h3>
                <Button variant="ghost" size="sm" onClick={addIngredient} type="button">
                  <Plus size={16} /> Add
                </Button>
              </div>
              
              <div className={styles.ingredientsList}>
                {ingredients.map((ing) => (
                  <div key={ing.id} className={styles.ingredientRow}>
                    <Input 
                      placeholder="Amount (e.g., 2 cups)" 
                      value={ing.amount}
                      onChange={(e) => handleIngredientChange(ing.id, 'amount', e.target.value)}
                      className={styles.ingAmount}
                    />
                    <Input 
                      placeholder="Ingredient name" 
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(ing.id, 'name', e.target.value)}
                      className={styles.ingName}
                      fullWidth
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeIngredient(ing.id)}
                      disabled={ingredients.length === 1}
                      className={styles.removeBtn}
                      type="button"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Instructions</h3>
              <textarea 
                className={styles.textarea} 
                placeholder="Step 1: Preheat the oven to 350°F..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
              ></textarea>
            </div>
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card className={styles.aiCard}>
            <div className={styles.aiHeader}>
              <div className={styles.aiIconWrapper}>
                <Camera size={24} className={styles.aiIcon} />
              </div>
              <h3>Magic Import</h3>
            </div>
            <p className={styles.aiText}>
              Got a photo of a recipe card or cookbook? Let our AI extract the ingredients and instructions for you automatically.
            </p>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            
            <Button 
              variant="secondary" 
              fullWidth 
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  Extracting...
                </>
              ) : (
                <>
                  <Camera size={18} />
                  Upload Photo
                </>
              )}
            </Button>
          </Card>
          
          <Card className={styles.imageCard}>
            <div className={styles.imagePlaceholder}>
              <span>Recipe Image</span>
            </div>
            <Button variant="outline" fullWidth className={styles.imageBtn}>
              Add Cover Image
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
