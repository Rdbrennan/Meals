
const GroceryList = ({ weeklyPlan, meals }) => {
    const [copied, setCopied] = React.useState(false);
    // ...existing code...
    const ShoppingCartIcon = () => React.createElement('svg', {
        className: "w-4 h-4",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24"
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: "2",
        d: "M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v8a2 2 0 002 2h7a2 2 0 002-2v-8M7 13H5a2 2 0 01-2-2V9a2 2 0 012-2h2M9 9V7a2 2 0 012-2h2a2 2 0 012 2v2"
    }));

    const DownloadIcon = () => React.createElement('svg', {
        className: "w-4 h-4",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24"
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: "2",
        d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    }));

    const getCurrentWeekDates = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + mondayOffset + i);
            dates.push(date);
        }
        return dates;
    };

    const generateGroceryList = () => {
        const ingredients = {};
        const plannedMeals = [];
        Object.entries(weeklyPlan).forEach(([day, meal]) => {
            if (meal && meal.ingredients) {
                const mealExists = plannedMeals.some(existingMeal => existingMeal.name === meal.name);
                if (!mealExists) {
                    plannedMeals.push(meal);
                }
                meal.ingredients.forEach(ingredient => {
                    const cleanIngredient = ingredient.trim().toLowerCase();
                    ingredients[cleanIngredient] = (ingredients[cleanIngredient] || 0) + 1;
                });
            }
        });
        return { ingredients, plannedMeals };
    };

    const formatGroceryList = () => {
        const weekDates = getCurrentWeekDates();
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        const { ingredients, plannedMeals } = generateGroceryList();
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        };
        let groceryText = `Week of ${formatDate(startDate)} Groceries\n\n`;
        if (plannedMeals.length > 0) {
            groceryText += `Meals This Week\n`;
            plannedMeals.forEach(meal => {
                groceryText += `☐ ${meal.name}\n`;
            });
            groceryText += `\n`;
        }
        groceryText += `Shopping List\n`;
        Object.keys(ingredients)
            .sort()
            .forEach(ingredient => {
                const displayIngredient = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
                groceryText += `${displayIngredient}\n`;
            });
        return groceryText;
    };

    const downloadGroceryList = () => {
        const groceryText = formatGroceryList();
        const blob = new Blob([groceryText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const weekDates = getCurrentWeekDates();
        const startDate = weekDates[0];
        const dateString = startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
        const link = document.createElement('a');
        link.href = url;
        link.download = `Week-of-${dateString}-Groceries.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Refactored: use React state for feedback
    const copyToClipboard = async () => {
        const groceryText = formatGroceryList();
        try {
            await navigator.clipboard.writeText(groceryText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            downloadGroceryList();
        }
    };

    const hasPlannedMeals = Object.values(weeklyPlan).some(meal => meal !== null);
    if (!hasPlannedMeals) {
        return null;
    }
    const { ingredients, plannedMeals } = generateGroceryList();
    const totalIngredients = Object.keys(ingredients).length;
    const totalMeals = plannedMeals.length;

    return React.createElement('div', { className: "bg-white rounded-xl shadow-lg p-6 mb-8" },
        React.createElement('div', { className: "flex justify-between items-center mb-4" },
            React.createElement('div', {},
                React.createElement('h2', { className: "text-2xl font-semibold text-gray-800 mb-1" }, "Grocery List"),
                React.createElement('p', { className: "text-sm text-gray-600" }, 
                    `${totalMeals} meal${totalMeals !== 1 ? 's' : ''} • ${totalIngredients} ingredient${totalIngredients !== 1 ? 's' : ''}`
                )
            ),
            React.createElement('div', { className: "flex gap-3" },
                React.createElement('button', {
                    onClick: copyToClipboard,
                    className: "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                },
                    copied
                        ? React.createElement('span', {},
                            React.createElement('svg', { className: "w-4 h-4 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                                React.createElement('path', {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: "2",
                                    d: "M5 13l4 4L19 7"
                                })
                            ),
                            "Copied!"
                        )
                        : [
                            React.createElement('svg', { key: "icon", className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                                React.createElement('path', {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: "2",
                                    d: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                })
                            ),
                            "Copy List"
                        ]
                ),
                React.createElement('button', {
                    onClick: downloadGroceryList,
                    className: "flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                },
                    React.createElement(DownloadIcon),
                    "Download"
                )
            )
        ),
        React.createElement('div', { className: "bg-gray-50 rounded-lg p-4" },
            React.createElement('h3', { className: "font-semibold text-gray-700 mb-3" }, "Preview"),
            React.createElement('div', { className: "text-sm text-gray-600 space-y-1" },
                React.createElement('p', { className: "font-medium" }, `Week of ${getCurrentWeekDates()[0].toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })} Groceries`),
                React.createElement('div', { className: "mt-2" },
                    plannedMeals.length > 0 && React.createElement('div', {},
                        React.createElement('p', { className: "font-medium mt-2 mb-1" }, "Meals This Week"),
                        plannedMeals.slice(0, 3).map((meal, index) =>
                            React.createElement('p', { key: index, className: "ml-2" }, `☐ ${meal.name}`)
                        ),
                        plannedMeals.length > 3 && React.createElement('p', { className: "ml-2 text-gray-500" }, `... and ${plannedMeals.length - 3} more`)
                    ),
                    React.createElement('div', {},
                        React.createElement('p', { className: "font-medium mt-3 mb-1" }, "Shopping List"),
                        Object.keys(ingredients).sort().slice(0, 5).map((ingredient, index) =>
                            React.createElement('p', { key: index, className: "ml-2" }, 
                                `☐ ${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}`
                            )
                        ),
                        Object.keys(ingredients).length > 5 && React.createElement('p', { className: "ml-2 text-gray-500" }, `... and ${Object.keys(ingredients).length - 5} more ingredients`)
                    )
                )
            )
        )
    );
};

// Export to global scope
window.Components = window.Components || {};
window.Components.GroceryList = GroceryList;