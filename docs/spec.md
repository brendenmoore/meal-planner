TODO:
- support scaling recipes on the schedule/rotation
- support for lunch/dinner/etch on schedule/rotation (dinner rotation should not overwrite conflict with lunches)
- spec for shopping list, staples
- ability to extend leftovers to future days
- quick create recipes
- quick group meals

# Meal Planner App Specification

## 1. Overview

This document outlines the specification for a meal planner application. The application will be used to plan meals for a household and generate a shopping list based on the planned meals. 

Core Principles:
- Recipes can be added to the recipe list.
- Recipes contain ingredients, directions, and other metadata.
- Recipes can be added to a meal. A meal can have multiple recipes. A meal has a name and recipes associated with it.
- Meals or recipes can be scheduled for specific dates on the schedule.
- The schedule can be viewed as a calendar.
- The shopping list can be generated from the schedule.
- The shopping list can be generated for a specific date range.
- A rotation is a pool of meals and recipes, each with a target frequency. The app tracks how long it has been since each was last scheduled and surfaces the most overdue ones in a priority queue for the user to drag onto the calendar.

So the basic user flow is:
1. User adds recipes to the recipe list.
2. User creates meals and adds recipes to them. (optional)
3. User builds a rotation by adding meals/recipes and assigning each a target frequency. (optional)
4. User schedules meals by dragging from the rotation queue sidebar onto the calendar. Or by clicking any date and searching and adding any meal/recipe.
5. The rotation queue automatically re-sorts as meals are scheduled. Deleting a past schedule entry resets that meal's urgency.
6. User generates a shopping list from the schedule.
7. User can add/remove additional items to the shopping list. (optional)

## 2. Data Model

### 2.1 Recipe

A recipe is a collection of ingredients and directions.

```
Recipe {
  id: string,
  name: string,
  ingredients?: Ingredient[],
  directions?: DirectionStep[],
  prepTime?: number,
  cookTime?: number,
  servings?: number,
  tags?: string[],
  image?: string,
  sourceImage?: string,
  sourceUrl?: string,
  notes?: string,
}
```

### 2.2 DirectionStep

A single step in a recipe's directions. Structured to support the prepare-mode checklist UI and potential future features like inline timers.

```
DirectionStep {
  text: string,          // The main instruction for the step
  note?: string,         // Optional tip or aside, rendered with less prominence
  timerMinutes?: number, // Optional duration hint (e.g. for an inline timer in prepare mode)
}
```

### 2.3 Ingredient

An ingredient is a list of items that are needed for a recipe. Both a raw display form and a normalized form are stored to support accurate shopping list aggregation while preserving the original human-readable text.

```
Ingredient {
  id: string,
  name: string,
  quantity?: number,       // Normalized numeric quantity (e.g. 113)
  unit?: CanonicalUnit,    // Normalized unit from the canonical list (e.g. 'g')
  displayText?: string,    // Original human-readable form (e.g. '1 stick')
}
```

### 2.4 Meal

A meal is a named collection of recipes and optional add-on ingredients. Add-on ingredients are simple purchased items (e.g. cheese, tortillas) that don't warrant a full recipe but still need to appear on the shopping list.

```
Meal {
  id: string,
  name: string,
  recipeIds?: string[],
  ingredients?: Ingredient[], // Simple add-ons that don't have a full recipe
}
```

### 2.5 Rotation

A rotation is a frequency pool of meals and recipes. Each entry has a target frequency that describes how often the user wants it scheduled. The app tracks the last time each entry was scheduled and uses this to compute a priority queue that surfaces the most overdue items first. Recipe tags are displayed in the sidebar queue so the user can see at a glance what kind of meal each entry is.

```
RotationEntry {
  id: string,
  type: 'meal' | 'recipe',
  referenceId: string,         // ID of the meal or recipe
  targetFrequencyDays: number, // How often the user wants this scheduled (e.g. 14 = every 2 weeks)
  lastScheduledAt?: Date,      // Updated automatically when a matching item is added to the schedule
  servingsOverride?: number,   // Overrides Recipe.servings for this rotation entry (e.g. always double this one)
}
```

```
Rotation {
  id: string,
  name: string,
  entries: RotationEntry[],
}
```

#### Priority Queue Algorithm

The rotation queue is computed on the fly — it is never stored. The sort order is determined by each entry's **urgency score**:

```
urgencyScore = daysSinceLastScheduled / targetFrequencyDays
```

Entries with a higher urgency score (most overdue relative to their target) appear first. Entries that have never been scheduled are treated as maximally overdue. `lastScheduledAt` is updated automatically whenever the meal or recipe is added to the schedule; deleting a past schedule entry resets it, causing the entry to rise back up the queue.

### 2.6 Schedule

A schedule entry represents a specific date. A `ScheduleItem` wrapper supports unified ordering and tracking leftovers.

```
ScheduleItem {
  id: string,
  type: 'meal' | 'recipe' | 'quick-add',
  referenceId?: string,   // ID of the meal or recipe (omitted for quick-add)
  quickAddLabel?: string, // Freeform label for quick-add items (e.g. 'Takeout', 'Eat out')
  servings?: number,      // Overrides RotationEntry.servingsOverride or Recipe.servings for this specific night
  isLeftover?: boolean,   // True if this item represents leftovers from a previous day
}
```

> **Servings cascade:** `Recipe.servings` → `RotationEntry.servingsOverride` → `ScheduleItem.servings`. Each layer overrides the previous. The shopping list uses the resolved servings value to scale ingredient quantities. Leftover items (`isLeftover: true`) contribute no ingredients to the shopping list, as the original entry's quantities already account for the full batch.

```
ScheduleEntry {
  id: string,
  date: Date, // unique
  items: ScheduleItem[], // Array order defines the sequence for the day
}
```

### 2.7 Recurring Meals

Recurring meals appear on the schedule automatically on specified days. The application logic can query these when applying a rotation to avoid double-booking days that already have a recurring meal.

```
RecurringSchedule {
  id: string,
  type: 'meal' | 'recipe',
  referenceId: string, // ID of the meal or recipe
  dayOfWeek: number, // 0=Sunday, 1=Monday, ..., 6=Saturday
}
```

### 2.8 Shopping List

A shopping list is a collection of ingredients that are needed for a recipe.

```
ShoppingList {
  id: string,
  name: string,
  ingredients: Ingredient[],
}
```

## 3. Features

### 3.1 Recipe Management

- Add, edit, and delete recipes.
- Recipes have the following fields available for editing:
  - Name (Required)
  - Ingredients
  - Directions
  - Prep Time
  - Cook Time
  - Servings
  - Tags
  - Image
  - Source Image (If imported from an image)
  - Source URL (If imported from a website)
  - Notes
- Ingredients can be added to recipes manually, or by pasting a list of ingredients.

#### Importing Recipes
- User can import recipes from websites. (using a web scraper or LLM to parse the website content)
- User can import recipes from images using an LLM. (ex. OpenRouter + Gemini 2.5 Flash)
- The source photo and URL are stored with the recipe and can be viewed by the user.
- User can import recipes from a CSV file. (parsed by LLM)
- User can import recipes by pasting a plaintext recipe. (parsed by LLM)
- If the imput source is lacking information, the user is warned and given the option to edit the recipe.
- User can edit fields of imported recipes.

#### Searching and Filtering Recipes
- User can search for recipes by name or ingredient.
- User can filter recipes by tags.
- User can sort recipes by date added, last scheduled, most frequently scheduled, etc.
- Users can bulk tag recipes.
- Recipes are paginated as needed.

#### Viewing Recipes
- User can view a recipe in a modal.
- User can view a recipe in a list view.
- User can see "prepare" mode of a recipe, which shows the ingredients and directions in a step-by-step format.
  - In prepare mode, the user can check off ingredients and directions as they are completed.
  - In prepare mode, if the screen is wide enough, user can see recipes and direction side-by-side in separate scrollable panes.
- User can scale the servings of a recipe.
- User can add a recipe directly to the shopping list.
- User can see when the recipe was last scheduled, and how many times it has been scheduled.


### 3.2 Meal Management

- User can add, edit, and delete meals.
- Meals have the following fields available for editing:
  - Name (Required)
  - Recipes
  - Add-on ingredients
- User can add meals to the schedule.
- User can see when the meal was last scheduled, and how many times it has been scheduled.

### 3.3 Rotation Management

- User can add, edit, and delete rotations.
- A rotation has a name and a pool of entries. Each entry has:
  - A meal or recipe reference
  - A target frequency in days (e.g. 7 = weekly, 14 = every two weeks, 30 = monthly)
- The user can add meals or recipes to the rotation directly from the recipe/meal detail view.
- The user can see the priority queue for the active rotation — the sorted list of entries by urgency score — as a preview of what the app would suggest next.
- Deleting a past schedule entry for a rotation meal resets its `lastScheduledAt`, causing it to rise back toward the top of the queue.

### 3.4 Schedule Management

- User can add, edit, and delete schedule entries in a calendar view.
- By default the schedule page will show the current month and the next month.
- The user can view past and future months as well.
- User can click on any day to open a modal to add, edit, or delete schedule entries for that day.
- Recipes and meals can be dragged and dropped to different days.
- The user can also add **quick-add** items to the schedule — freeform labels like "Takeout" or "Eat out" that appear on the calendar but contribute nothing to the shopping list.
- Meals can be set on a recurring schedule, which will automatically fill the specified day of week for the current and upcoming months. When the month changes, recurring meals are automatically added for the new month.

#### Rotation Queue Sidebar

When a rotation is active, a sidebar is shown alongside the calendar displaying the **rotation priority queue**: the ordered list of rotation entries sorted by urgency score (most overdue first).

- The user drags meals from the sidebar queue onto any calendar day to schedule them. The meal is then removed from the queue display (it has been assigned) and its `lastScheduledAt` is updated.
- The user is never forced to follow the queue — they can ignore the top item and drag any entry from the list.
- The queue is always computed on the fly and automatically re-sorts as meals are scheduled.
- The user can still manually schedule any meal or recipe not in the rotation by clicking any date and searching; the queue only surfaces rotation suggestions.
- The user can drag a meal from a past calendar date to a future date to reschedule it without re-entering it.
- Recurring meals already on the calendar are visually distinct from rotation-scheduled meals so the user can tell them apart at a glance.

---

## Appendix

### A. Ingredient Parsing

Ingredient parsing is a critical subsystem that affects the quality of the shopping list. All import methods (URL, image, CSV, plaintext) pass ingredients through the same LLM parsing step to produce a consistent internal schema.

#### Canonical Unit List (`CanonicalUnit`)

The following are the only valid values for `Ingredient.unit`. The LLM is instructed to convert to these units wherever possible.

| Category   | Units |
|------------|-------|
| Volume     | `ml`, `tsp`, `tbsp`, `cup`, `fl oz`, `l` |
| Weight     | `g`, `oz`, `lb`, `kg` |
| Count      | `piece`, `clove`, `slice`, `stalk`, `sprig`, `leaf`, `sheet` |
| Imprecise  | `pinch`, `dash`, `handful`, `to taste` |
| Packaging  | `can`, `package`, `bag`, `box`, `jar`, `bottle` |

If a unit cannot be mapped to any canonical unit, `unit` is set to `null` and the raw text is preserved in `displayText`.

#### Shopping List Aggregation Strategy

When combining ingredients across recipes to build a shopping list:

1. **Same canonical unit** → sum quantities (e.g. `2 cup flour` + `1 cup flour` = `3 cup flour`)
2. **Compatible units** (same category, e.g. `ml` and `cup`) → convert to the larger unit and sum
3. **Incompatible or packaging units** (e.g. `g` and `can`) → list separately under the same ingredient name
4. **No unit / `to taste`** → deduplicate by name, show once

#### Sample LLM Prompt

The following prompt is used when parsing ingredients from any source:

```
Parse the following ingredient list and return a JSON array. Each element should have:
- "name": the ingredient name, lowercase, singular (e.g. "egg", "garlic clove" → "garlic")
- "quantity": a numeric value, or null if not applicable
- "unit": one of the following canonical units only:
    ml, tsp, tbsp, cup, fl oz, l,
    g, oz, lb, kg,
    piece, clove, slice, stalk, sprig, leaf, sheet,
    pinch, dash, handful, to taste,
    can, package, bag, box, jar, bottle
  If the unit cannot be mapped, set to null.
- "displayText": the original raw ingredient string, exactly as written

Rules:
- Convert non-standard units where unambiguous (e.g. "1 stick of butter" → quantity: 113, unit: "g", displayText: "1 stick of butter")
- If conversion is ambiguous or would lose meaning, leave quantity and unit as null
- Do not infer information that is not present
- Return only the JSON array, no explanation

Ingredient list:
{{INGREDIENT_TEXT}}
```

#### Handling Parsing Failures

- If the LLM returns a malformed response, retry once with a stricter prompt before surfacing an error.
- After import, the user is shown all parsed ingredients and warned of any that have `unit: null` so they can manually correct them.
- Users can always edit any ingredient field directly in the recipe editor.
