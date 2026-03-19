# Meal Planner UI Screens, Components & Prompts

This document outlines the UI screens, their constituent components, key interactions, and AI generation prompts (e.g., to be used in v0 by Vercel, Galileo AI, etc.) based on the application specification (`spec.md`).

## 1. Library (Recipes & Meals)

### Screen: Main Library View
**Description:** A unified view of both recipes and grouped meals.
**Interactions:** Filter toggle, search, sort, quick-group select, and a multi-action Add button.
**Prompt:**
> "A responsive web application library screen for a meal planner. The top header has a simple toggle for '[ All ]', '[ Recipes ]', or '[ Meals ]', along with a search bar and filter chips for tags. The main content is a responsive grid of cards. Some cards are 'Recipes' with a full image and title. Some cards are 'Meals' visually depicted as a stack of images or with a prominent 'Meal' badge. There is a primary floating action button (+) in the bottom right."

### Component: Recipe / Meal Card
**Description:** The individual item display in the library.
**Interactions:** Tap to view details, long-press/checkbox to multi-select for Quick Grouping.
**Prompt:**
> "A cohesive React component for a Recipe Card. It features a hero image, a title, prep/cook time metadata, and tags at the bottom. The component should also support a 'Meal' variant which visually stacks multiple images behind the primary one to indicate a grouped meal. Include a subtle checkbox in the top corner for multi-selection."

### Component: Primary Add Interaction Dropdown
**Description:** The dropdown menu that appears when clicking the main (+) Add button.
**Interactions:** Select import method or meal creation.
**Prompt:**
> "A polished popover menu triggered by a floating action button. The menu lists several options with icons: 'Import via URL', 'Upload Image', 'Paste Text/CSV', 'Manual Recipe Entry', and 'Create New Meal'."

### Screen: Recipe Editor Form (Add/Edit)
**Description:** The full form to manually edit or review parsed recipe data.
**Interactions:** Edit arrays of ingredients/directions, fix warnings on unmapped units.
**Prompt:**
> "A comprehensive form UI for editing a recipe. The top has inputs for Name, Prep Time, Cook Time, Servings, and Tags. Below are two main sections: Ingredients and Directions, each allowing the user to add, reorder, or delete rows. Include a prominent warning banner at the top that says 'Some imported ingredients need your review' and highlight specific ingredient rows in yellow where the 'unit' could not be parsed."

### Screen: Meal Editor / Builder Form
**Description:** Interface to construct a meal from recipes and add-on ingredients.
**Interactions:** Search and select recipes to attach, add simple text ingredients.
**Prompt:**
> "A clean form UI for creating a grouped Meal. It has a large text input for the Meal Name at the top. Below is a grid/list of currently attached Recipe cards with 'Remove' buttons. Below that is an autocomplete search input to 'Find and attach recipes'. Finally, a section at the bottom to 'Add simple ingredients (e.g., buns, cheese)' with a simple text input and list."

---

## 2. Recipe & Meal Details

### Screen: Recipe Detail View
**Description:** Full page view of a recipe.
**Interactions:** Add to meal, Add to schedule, push ingredients to shopping list, enter Prepare Mode.
**Prompt:**
> "A recipe detail page UI. The top section features a large hero image, recipe title, and metadata (prep time, cook time, servings, source URL). Below, the page is split into two columns on desktop (stacked on mobile): one column for a list of ingredients, and another for a numbered list of directions. Include primary action buttons for 'Add to Meal', 'Add to Schedule', and a prominent 'Enter Prepare Mode' button."

### Screen: Kitchen Companion (Prepare Mode)
**Description:** Optimized mode for cooking.
**Interactions:** Screen stays awake, check off ingredients to fade them out, start inline timers.
**Prompt:**
> "A modern 'Prepare Mode' cooking UI optimized for mobile viewing. The interface features sticky tabs to switch between 'Ingredients' and 'Directions'. The Ingredients list uses large touch targets where checking an item fades it out. The Directions list features step-by-step cards. If a step mentions a time (e.g., '10 minutes'), there should be a distinct inline UI button to start a countdown timer right inside the step card."

---

## 3. Desktop Schedule & Plan Mode

### Screen: Two-Month Calendar View
**Description:** The primary desktop scheduling interface.
**Interactions:** Drag and drop from sidebar to calendar, drag to extend leftovers, click slot to open search modal.
**Prompt:**
> "A complex, dense desktop calendar UI for meal planning. Show a full month view. Inside each day cell, divide the space into horizontal slot rows (e.g., Breakfast, Lunch, Dinner) with small color-coded headers. Populate these rows with compact 'Scheduled Item' chips. Some chips should have a muted 'Leftovers' badge. The entire calendar should be designed to support drag-and-drop interactions."

### Component: What's Next Sidebar
**Description:** Sticky sidebar showing the rotation queue sorted by urgency.
**Interactions:** Drag items to the calendar.
**Prompt:**
> "A sleek sidebar component titled 'What's Next'. It contains a vertically scrollable list of meal suggestion cards. Each card shows the meal name and primary tags. The cards should look draggable."

### Component: Search/Suggest Modal
**Description:** Opens when a user clicks a calendar slot.
**Interactions:** Instant search filtering, quick-create, and quick-add actions.
**Prompt:**
> "A command-palette style search modal for adding a meal to a calendar slot. At the top is a large text input field. Below it, a 'Top Suggestions' section shows 3-4 highly recommended meals. Below that, a list of search results. If the search is empty, show two persistent action buttons at the bottom: 'Quick Create Recipe' and 'Add Custom Label'."

### Component: Leftover Extension Context Menu
**Description:** Context menu for schedule items to handle leftovers.
**Interactions:** Right-click schedule item to select leftover extension.
**Prompt:**
> "A sleek context menu (right-click menu) positioned over a calendar item. The menu options include 'Edit', 'Reschedule', 'Extend as leftovers', and 'Delete'. If 'Extend as leftovers' is hovered, show a small submenu or inline input asking 'How many additional days?' with number steppers."

### Screen: Recurring Meal Setup Modal
**Description:** Modal to configure a meal to repeat on specific days.
**Prompt:**
> "A small modal dialog titled 'Set Recurring Schedule'. It contains a dropdown to select the Target Meal Slot (e.g., 'Lunch'), and a row of seven circular buttons representing the days of the week for the user to toggle which days the meal repeats. Includes 'Save' and 'Cancel' buttons."

---

## 4. Mobile Experience

### Screen: Mobile Dashboard (Home)
**Description:** The landing view for mobile users, focused on today/tomorrow.
**Interactions:** Tap card to cook, tap widget to shop.
**Prompt:**
> "A mobile app dashboard for a cooking app. Use a modern, clean, glassmorphism aesthetic. At the top, a section called 'Up Next' showing a large, beautiful card for today's dinner with an 'Enter Prepare Mode' button. Below it, a smaller card for tomorrow's meals. Next, a 'Shopping Status' widget showing '12 items on list' with a 'Go to Store' button. A floating (+) button sits in the bottom corner."

### Screen: Mobile Plan Mode (Agenda)
**Description:** Vertical scroll of days and slots instead of a calendar grid.
**Interactions:** Tap slot to open bottom sheet.
**Prompt:**
> "A mobile agenda view for a meal schedule. The screen scrolls vertically, showing days of the week as large headers. Under each day, show rows for Breakfast, Lunch, and Dinner. Empty slots have a dashed border and a 'Tap to plan' prompt. Filled slots show the meal name and an image thumbnail."

### Component: Search/Suggest Bottom Sheet
**Description:** The mobile equivalent of the desktop modal.
**Prompt:**
> "A mobile UI bottom sheet modal that slides up from the bottom of the screen. It features a sticky search bar at the top with a pill-like drag handle above it. The content area shows a vertically scrolling list of meal suggestions with small thumbnail images and names. Include a 'Quick Add' text button prominently."

---

## 5. Shopping List

### Screen: Active Shopping List (Aisle Mode)
**Description:** One-handed optimized shopping mode.
**Interactions:** Tap oversized checkboxes, swipe left to delete/ignore, dynamic merged view.
**Prompt:**
> "A functional, mobile-optimized shopping list UI. The top header has a simple toggle between 'Aisle Mode' and 'Recipe Mode'. The list below is grouped by ingredient types (e.g., 'Produce', 'Dairy'). Each line item features an oversized, easy-to-tap checkbox on the left, the ingredient quantity and name in bold, and subtle subtext below it showing which recipes it comes from. Mock up a swipe-to-left interaction revealing a red 'Delete' button and a gray 'Hide & Ignore' button."

### Component: Staples Drawer
**Description:** Quick-add menu for common pantry items.
**Prompt:**
> "A persistent bottom bar or drawer handle for a mobile app titled 'Add Staples'. When expanded, it shows a dense grid of pill-shaped buttons for common household items (e.g., Milk, Eggs, Paper Towels, Bread) that a user can rapidly tap to add to their shopping list."

### Screen: Desktop Shopping List View
**Description:** A wide-screen optimized version of the shopping list showing more context.
**Interactions:** View grouped ingredients and Recipe mode concurrently or detailed side-panels.
**Prompt:**
> "A desktop-optimized UI for a grocery shopping list. The layout features a sidebar on the left showing a summary of the date range, the active schedule items contributing to the list, and a prominent 'Regenerate List' button. The main right area displays the actual shopping list, structured into logical grocery store categories, with clear typography showing merged quantities."

### Component: Shopping List Generator Modal
**Description:** The prompt before wiping the active list and generating a newly scoped one.
**Interactions:** Pick date range, finalize/cancel.
**Prompt:**
> "A confirmation modal for generating a new shopping list. The title reads 'Generate New List'. It contains a date range picker component to select the schedule span. Below that is a warning text explaining that this will 'Start Fresh' and discard the current active list and manual additions. Actions: 'Cancel' and 'Generate List'."

---

## 6. Settings & General

### Screen: Meal Slot Configurator
**Description:** Manage visibility, colors, and order of slots.
**Interactions:** Reorder drag handlers, toggle visibility, pick colors.
**Prompt:**
> "A settings page UI for configuring 'Meal Slots'. Show a list of active slots (e.g., Breakfast, Lunch, Dinner, Snack). Each row should have a drag handle icon on the far left, a text input for the name, a small color picker circle showing the assigned color, and a toggle switch on the far right to show or hide the slot. Include a 'Delete' trash icon hidden behind a subtle hover or swipe."

### Component: Desktop & Browser Extensions
**Description:** Companion pieces for integrating outside workflows.
**Prompt:**
> "A compact browser extension UI popup for a meal planner app. The extension displays the metadata and image scraped from the current recipe webpage. It includes a button that says 'Save Recipe to Library' and another button that says 'Open in Meal Planner'."

### Screen: Rotation Manager
**Description:** Manage the frequency pool of meals/recipes.
**Interactions:** Create/rename rotations, add/remove items, adjust target frequency.
**Prompt:**
> "A settings dashboard UI for managing 'Meal Rotations'. The screen displays a table of recipes and meals currently in the rotation. Each row shows the item name, an adjustable number input for 'Target Frequency (Days)', and an optional 'Servings Override' input. There is an 'Add to Rotation' search bar at the top."

### Screen: Global Ignore List
**Description:** Manage strictly ignored ingredients.
**Interactions:** View, add, delete default or custom ignored items.
**Prompt:**
> "A simple settings page UI for a 'Global Ignore List'. The screen shows a text input at the top to 'Add new ignored ingredient'. Below is a flex-wrap container of pill-shaped tags representing ignored items (e.g., 'salt', 'water', 'olive oil'), each with a small 'x' button to remove them."
