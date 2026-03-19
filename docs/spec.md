# TODO:
- [x] support scaling recipes on the schedule/rotation
- [x] support for lunch/dinner/etc on schedule/rotation (dinner rotation should not overwrite conflict with lunches)
- [x] spec for shopping list, staples
- [x] ability to extend leftovers to future days
- [x] quick create recipes
- [x] quick group meals
- [ ] home page, more mobile UX specifications

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
- A rotation is a pool of meals and recipes, each with a target frequency. The app tracks how long it has been since each was last scheduled and surfaces the most overdue ones in a **What's Next** panel for the user to drag onto the calendar.

So the basic user flow is:
1. User adds recipes to the recipe list.
2. User creates meals and adds recipes to them. (optional)
3. User builds a rotation by adding meals/recipes and assigning each a target frequency. (optional)
4. User enters Plan Mode and schedules meals by dragging from the **What's Next** panel onto the calendar. Or by clicking any date and searching and adding any meal/recipe.
5. The What's Next panel automatically re-sorts as meals are scheduled. Deleting a past schedule entry simply recalculates that meal's urgency from the remaining history.
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
  createdAt: Date,
  updatedAt: Date,
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
  createdAt: Date,
  updatedAt: Date,
}
```

### 2.5 Rotation

A rotation is a frequency pool of meals and recipes. Each entry has a target frequency that describes how often the user wants it scheduled. The app tracks the last time each entry was scheduled and uses this to rank entries in the **What's Next** panel, surfacing the most overdue items first. Recipe tags are displayed in the panel so the user can see at a glance what kind of meal each entry is.

```
RotationEntry {
  id: string,
  type: 'meal' | 'recipe',
  referenceId: string,         // ID of the meal or recipe
  targetFrequencyDays: number, // How often the user wants this scheduled (e.g. 14 = every 2 weeks)
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

Entries with a higher urgency score (most overdue relative to their target) appear first. Entries that have never been scheduled are treated as maximally overdue. `lastScheduledAt` is a derived value representing the most recent scheduled occurrence of that meal/recipe in the schedule history; deleting an occurrence simply recalculates the score from the remaining history.

### 2.6 MealSlot

A meal slot represents a named time-of-day context for schedule items, such as Breakfast, Lunch, or Dinner. Slots are user-configurable and can be shown or hidden independently. Each day on the calendar is divided into the user's visible slots.

Defaults: `Lunch` and `Dinner` are created for new accounts. Additional slots (e.g. Breakfast, Snack) can be added in Settings.

```
MealSlot {
  id: string,
  name: string,         // e.g. 'Breakfast', 'Lunch', 'Dinner', 'Snack'
  color: string,        // hex or token, used for calendar chips and slot headers
  isVisible: boolean,   // if false, the slot row is hidden across all calendar days
  displayOrder: number, // controls top-to-bottom order within a day cell
}
```

### 2.7 Schedule

A schedule entry represents a specific date. A `ScheduleItem` wrapper supports unified ordering and tracking leftovers.

```
ScheduleItem {
  id: string,
  type: 'meal' | 'recipe' | 'quick-add',
  referenceId?: string,       // ID of the meal or recipe (omitted for quick-add)
  quickAddLabel?: string,     // Freeform label for quick-add items (e.g. 'Takeout', 'Eat out')
  slotId: string,             // Which MealSlot this item belongs to (e.g. Dinner)
  servings?: number,          // Overrides RotationEntry.servingsOverride or Recipe.servings for this specific night
  isLeftover?: boolean,       // True if this item represents leftovers from a previous day
  leftoverSourceId?: string,  // ID of the original ScheduleItem this leftover was generated from
}
```

> **Servings cascade:** `Recipe.servings` → `RotationEntry.servingsOverride` → `ScheduleItem.servings`. Each layer overrides the previous. The shopping list uses the resolved servings value to scale ingredient quantities.

> **Leftover shopping list rule:** Items with `isLeftover: true` contribute **no ingredients** to the shopping list. The original item's servings already account for the full batch across all leftover days.

```
ScheduleEntry {
  id: string,
  date: Date, // unique
  items: ScheduleItem[], // Array order defines the sequence for the day
}
```

### 2.8 Recurring Meals

Recurring meals appear on the schedule automatically on specified days and in a specific slot.

```
RecurringSchedule {
  id: string,
  type: 'meal' | 'recipe',
  referenceId: string, // ID of the meal or recipe
  slotId: string,      // Which MealSlot this recurring meal belongs to
  dayOfWeek: number,   // 0=Sunday, 1=Monday, ..., 6=Saturday
}
```

### 2.9 Shopping List

A generated shopping list based on a specific date range of the schedule. There is only one active shopping list at a time, treated as a disposable working document. `ShoppingList.items` stores the raw, unmerged source rows; grouped merged views are computed dynamically by the UI.

```
ShoppingListItem {
  id: string,
  ingredient: Ingredient,
  isChecked: boolean,
  isGenerated: boolean, // true if computed from schedule, false if manually added/modified
  sourceType?: 'recipe' | 'meal' | 'manual' | 'staple',
  sourceRecipeId?: string,
  sourceMealId?: string,
  sourceScheduleItemId?: string,
}
```

```
ShoppingList {
  id: string,
  name: string,
  dateRangeStart: Date,
  dateRangeEnd: Date,
  items: ShoppingListItem[], // Raw unmerged source rows; UI handles grouped merging
}
```

### 2.10 Staples & Ignore List

```
StapleItem {
  id: string,
  name: string, // Common item (e.g., 'Milk', 'Paper Towels')
}
```

```
IgnoreItem {
  id: string,
  name: string, // Normalised ingredient name to silently drop during generation (e.g., 'salt')
}
```

## 3. Features

### 3.1 Library (Recipes & Meals)

Recipes (individual items) and Meals (grouped items) exist together as first-class citizens in a unified **Library**. 

- The Library displays both Recipes and Meals in the same primary grid or list.
- **Visuals:** Meal cards have a distinct treatment (e.g. a stylized stack of images or a "Meal" badge) so users can distinguish grouped entities from standalone recipes at a glance.
- **Filtering:** A simple top-level toggle allows users to view `[ All ]`, `[ Recipes ]`, or `[ Meals ]`.
- Users can search by name or ingredient, filter by tags, and sort by date added. Sorting by "last scheduled" or "most frequently scheduled" is dynamically computed from schedule history.
- The primary **(+) Add** button provides a dropdown:
  - Add Recipe (Import via URL, Image, plain text, CSV, or manual entry)
  - Create Meal

#### Recipe Details & Actions
- Recipes contain fields for: Name, Ingredients, Directions, Prep/Cook time, Servings, Tags, Notes, and original Import Data (Source Image, URL).
- **Importing:** Users can import recipes via URL (web scraper/LLM), Image (LLM vision), CSV, or pasted plaintext. The source photo and URL are stored. If an import lacks info, the user is warned and given the option to edit.
- **Quick Create (Stubbing):** If the user is searching for a recipe to add to a meal or the schedule and it doesn't exist, they can tap "Create [Name]" to instantly stub out an empty Recipe with just that name and fill in the details later. 
- Recipes can be viewed in a list or a focused "Prepare Mode" (step-by-step checklist, with side-by-side panes on wide screens).
- User can push a recipe's ingredients directly to the active shopping list (if no active list exists, it prompts the user to create one).

#### Meal Details & Actions
- Meals contain a Name, referenced Recipes, and optional simple Add-on Ingredients (e.g. buns, cheese).
- Like recipes, user can see when a meal was last scheduled and its frequency, computed from schedule history.

#### Quick Group Meals
Creating a Meal from existing recipes must be incredibly fast. The app supports three "Quick Group" flows:
1. **Library Multi-select:** User long-presses or checks multiple recipes in the Library, then taps a "Group into Meal" action. A prompt asks for a Name, and the Meal is instantly created.
2. **From Recipe View:** While looking at a recipe, the user taps "Add to a Meal" and can either pick an existing Meal or type a new name to instantly create one.
3. **From Calendar (Plan Mode):** If the user has scheduled multiple recipes and add-on ingredients in a single slot (e.g. Spaghetti and Garlic Bread on Tuesday Dinner), they can select that slot and tap "Save as Meal" to add that combination directly to their Library.

### 3.3 Rotation Management

- User can add, edit, and delete rotations.
- A rotation has a name and a pool of entries. Each entry has:
  - A meal or recipe reference
  - A target frequency in days (e.g. 7 = weekly, 14 = every two weeks, 30 = monthly)
- The user can add meals or recipes to the rotation directly from the recipe/meal detail view.
- The user can see the **What's Next** panel for the active rotation — entries sorted by urgency score — as a preview of what the app would suggest next.
- Deleting a past schedule entry for a rotation meal recalculates its urgency score from the remaining history, causing it to correctly rise back toward the top of the What's Next panel.

### 3.4 Schedule Management

- User can add, edit, and delete schedule entries in a calendar view.
- By default the schedule page will show the current month and the next month.
- The user can view past and future months as well.
- User can click on any day to open a modal to add, edit, or delete schedule entries for that day.
- Recipes and meals can be dragged and dropped to different days and to different slots within a day.
- Dragging an item from a past calendar date to a future date reschedules it without re-entering it.
- **Quick Create Recipes:** If the user searches for a meal/recipe that doesn't exist, they can instantly hit "Create 'name'" to stub out an empty recipe in the Library and place it straight onto the schedule.
- The user can also add **quick-add** items to any slot — freeform labels like "Takeout" or "Eat out" that appear on the calendar but contribute nothing to the shopping list.
- Meals can be set on a recurring schedule per slot (e.g. the same lunch every weekday in the Lunch slot). When the month changes, recurring meals are automatically added for the new month.

#### Meal Slot Behavior on the Calendar

Each day cell on the calendar is divided into rows, one per visible `MealSlot`, displayed in `displayOrder` order. Each slot row is labeled and color-coded with the slot's color.

- Schedule items are displayed as chips within their slot row, using the slot's color.
- Empty slot rows are shown with minimal height so the user can still drop items into them.
- If a slot is hidden (`isVisible: false`), its row is completely collapsed across all days.
- Items can only be dropped into a visible slot row. Dragging an item to a day without targeting a specific slot defaults to the first visible slot.

#### Leftovers

Leftovers allow a meal to span multiple days without duplicating shopping list ingredients. Leftover items are **per-slot** — extending a dinner does not affect the lunch row on the same days.

**Creating leftovers (desktop):** The user drags the right edge of a schedule item to extend it across one or more additional days — similar to extending a multi-day event in Google Calendar. Each newly covered day-slot receives a new `ScheduleItem` with `isLeftover: true` and `leftoverSourceId` pointing to the original item.

**Creating leftovers (alternative):** Right-click or long-press a schedule item → "Extend as leftovers" → choose number of additional days.

**Leftover display:** Leftover items show the meal/recipe name with a muted style and a "Leftovers" badge, distinguishing them from freshly cooked entries.

**Editing leftovers:**
- Editing the original item (servings, label) propagates to all linked leftover items.
- Deleting the original item also removes all its linked leftovers.
- Individual leftover days can be deleted independently (e.g. if you ran out of food earlier than expected).

**Shopping list:** Extending a meal as leftovers does not change shopping list quantities. The original scheduled item is assumed to already represent the full batch needed for all leftover days. If the user needs more food, they manually increase the servings on the original item.

#### Plan Mode — What's Next Panel

When the user enters **Plan Mode**, a **What's Next** panel is shown alongside the calendar displaying rotation entries sorted by urgency score (most overdue first).

- The user drags meals from the What's Next panel onto any calendar day to schedule them. The entry is then removed from the panel (it has been assigned) and the panel recalculates.
- The user is never forced to follow the ranking — they can ignore the top item and drag any entry from the list.
- The panel is always computed on the fly and automatically re-sorts as meals are scheduled.
- The user can still manually schedule any meal or recipe not in the rotation by clicking any date and searching; the What's Next panel only surfaces rotation suggestions.
- The user can drag a meal from a past calendar date to a future date to reschedule it without re-entering it.
- Recurring meals are visually distinct from manually scheduled meals so the user can tell them apart at a glance.

### 3.5 Meal Slot Settings

Meal slots are configured in the app's Settings. The defaults for a new account are **Lunch** and **Dinner**.

- User can add, rename, reorder, and delete meal slots.
- Each slot has a configurable color used for chips and slot row headers on the calendar.
- Each slot can be toggled visible/hidden from the Settings page or directly from the calendar view (e.g. a toggle chip above the calendar).
- Hiding a slot does not delete its data — items in hidden slots are preserved and reappear if the slot is made visible again.
- Deleting a slot is a destructive action: the user is warned that all schedule items in that slot will be deleted.
- Slot display order can be changed by dragging in the Settings list.

### 3.6 Shopping List Management

- The app supports **only one active shopping list** at a time. It is a disposable working document.
- Generating a new shopping list presents two choices: **Start Fresh** (which deletes the current active list after confirmation and generates a new one) or **Cancel**.
- The active shopping list **does not sync** with the schedule. If the schedule changes, the user must regenerate the list.
- When generating, the app computes the required ingredients from all schedule items in the range (including both recipes and direct meal add-ons). Leftover items are skipped. Resolves multi-layer servings overrides.
- **Global Ignore List:** Any ingredient matching an item on the user's `Ignore List` via **exact name match** (ignoring case) is silently omitted from the generated list. The ignore list comes with sensible defaults (salt, water, olive oil).
- The user can add any item on the active shopping list to the Ignore List via a submenu action ("Remove and Ignore in future").
- **Manual Edits & Provenance:** Generated items retain their source metadata. If the user only checks off or deletes an item, it stays a generated row. If they materially change the quantity, unit, or name, the item becomes a plain manual row (`isGenerated: false`).
- **Staples Quick-Add:** The user can open a "Staples" drawer to quickly append common non-recipe items.

#### View & Sort Modes

The user can toggle between two primary views for the active shopping list:

1. **Grouped by Ingredient:** 
   - Same-named ingredients are merged only when their canonical units are identical or safely compatible.
   - If units are incompatible, they remain as separate line items under the same ingredient heading.
   - Merged items display a subtext layer showing exactly which recipes/meals contributed to the total. The UI resolves contributor names dynamically via relational lookup to the referenced `sourceRecipeId` or `sourceMealId`.
2. **Recipe Mode (Group by Recipe):**
   - This view is for auditing and meal context. Ingredients are strictly grouped under the recipe or meal they belong to.
   - Ingredients with the same name are *not* merged in this mode.
   - Manually added items and Staples appear in an "Other" or "Manually Added" section at the bottom.

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
- "name": the ingredient name, lowercase, singular. Do not over-normalize distinct grocery items (e.g. "red onions" → "red onion", but keep modifiers like "kosher salt" distinct from "salt").
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
- Convert to canonical units where it does not destroy common pantry/packaging semantics (e.g., "1 cup of flour" → quantity: 1, unit: "cup", displayText: "1 cup of flour").
- If conversion loses meaning or removes common packaging references (like "1 stick of butter"), leave quantity and unit as null, and preserve the raw text in displayText. Shopping list relies heavily on identical strings to merge unmapped units.
- Do not infer information that is not present
- Return only the JSON array, no explanation

Ingredient list:
{{INGREDIENT_TEXT}}
```

#### Handling Parsing Failures

- If the LLM returns a malformed response, retry once with a stricter prompt before surfacing an error.
- After import, the user is shown all parsed ingredients and warned of any that have `unit: null` so they can manually correct them.
- Users can always edit any ingredient field directly in the recipe editor.
