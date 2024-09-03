import { useState } from "react"
import { addDays, endOfMonth, format, getDay, startOfMonth, subDays } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { ScrollArea } from "~/components/ui/scroll-area"

type Recipe = {
  name: string
  date: Date
}

export function CustomRecipeCalendar() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [newRecipe, setNewRecipe] = useState("")

  const currentDate = new Date()
  const startDate = startOfMonth(currentDate)
  const endDate = endOfMonth(currentDate)
  const startDayOfWeek = getDay(startDate)
  const totalDays = endDate.getDate()

  const calendarDays = []
  let day = subDays(startDate, startDayOfWeek)

  for (let i = 0; i < 42; i++) {
    calendarDays.push(day)
    day = addDays(day, 1)
  }

  const handleAddRecipe = () => {
    if (selectedDate && newRecipe) {
      setRecipes([...recipes, { name: newRecipe, date: selectedDate }])
      setNewRecipe("")
      setSelectedDate(undefined)
    }
  }

  const getRecipesForDate = (date: Date) => {
    return recipes.filter(
      (recipe) => format(recipe.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{format(currentDate, "MMMM yyyy")}</h2>
      <div className="grid grid-cols-7 gap-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}
        {calendarDays.map((date, index) => {
          const dayRecipes = getRecipesForDate(date)
          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
          return (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <div
                  className={`aspect-square border rounded-lg p-2 cursor-pointer ${
                    isCurrentMonth ? "bg-white" : "bg-gray-100"
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">{format(date, "d")}</div>
                  <ScrollArea className="h-full">
                    {dayRecipes.map((recipe, recipeIndex) => (
                      <div key={recipeIndex} className="text-xs mb-1 truncate">
                        {recipe.name}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{format(date, "MMMM d, yyyy")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <ScrollArea className="h-[200px]">
                    {dayRecipes.length > 0 ? (
                      <ul className="space-y-2">
                        {dayRecipes.map((recipe, recipeIndex) => (
                          <li key={recipeIndex} className="text-sm">
                            {recipe.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recipes for this day.</p>
                    )}
                  </ScrollArea>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a recipe"
                      value={newRecipe}
                      onChange={(e) => setNewRecipe(e.target.value)}
                    />
                    <Button onClick={() => {
                      setSelectedDate(date)
                      handleAddRecipe()
                    }}>
                      Add
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )
        })}
      </div>
    </div>
  )
}