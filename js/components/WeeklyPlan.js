const WeeklyPlan = ({ 
    weeklyPlan, 
    onAssignMeal, 
    onRemoveMeal, 
    onRandomize, 
    onClear,
    imageLoadingStates,
    onImageLoad,
    onImageStart 
}) => {
    const { Shuffle, X } = window.Icons;
    const { days, getCurrentWeekDates, formatDate } = window.Utils;
    const weekDates = getCurrentWeekDates();

    return React.createElement('div', { className: "bg-white rounded-xl shadow-lg p-6 mb-8" },
        React.createElement('div', { className: "flex justify-between items-center mb-6" },
            React.createElement('h2', { className: "text-2xl font-semibold text-gray-800" }, "This Week's Plan"),
            React.createElement('div', { className: "flex gap-3" },
                React.createElement('button', {
                    onClick: onRandomize,
                    className: "flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                },
                    React.createElement(Shuffle, { size: 16 }),
                    "Randomize"
                ),
                React.createElement('button', {
                    onClick: onClear,
                    className: "flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                }, "Clear All")
            )
        ),

        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4" },
            days.map((day, index) =>
                React.createElement('div', { 
                    key: day, 
                    className: "border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-32 hover:border-blue-400 transition-colors",
                    onDragOver: (e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                    },
                    onDragLeave: (e) => {
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    },
                    onDrop: (e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                        try {
                            const mealData = JSON.parse(e.dataTransfer.getData('application/json'));
                            onAssignMeal(day, mealData);
                        } catch (error) {
                            console.log('Error dropping meal:', error);
                        }
                    }
                },
                    React.createElement('div', { className: "text-center mb-2" },
                        React.createElement('h3', { className: "font-semibold text-gray-700" }, day),
                        React.createElement('p', { className: "text-xs text-gray-500" }, formatDate(weekDates[index]))
                    ),
                    weeklyPlan[day] ? 
                        React.createElement('div', { className: "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 relative group" },
                            React.createElement('button', {
                                onClick: () => onRemoveMeal(day),
                                className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            }, React.createElement(X, { size: 10 })),
                            
                            weeklyPlan[day].image && React.createElement('div', { 
                                className: "w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm" 
                            },
                                imageLoadingStates[`plan-${day}`] && React.createElement('div', {
                                    className: "absolute inset-0 w-full h-full skeleton rounded-full z-10"
                                }),
                                React.createElement('img', {
                                    src: weeklyPlan[day].image,
                                    alt: weeklyPlan[day].name,
                                    className: "w-full h-full object-cover",
                                    onLoad: () => onImageLoad(`plan-${day}`),
                                    onLoadStart: () => onImageStart(`plan-${day}`),
                                    onError: (e) => { 
                                        e.target.style.display = 'none';
                                        onImageLoad(`plan-${day}`);
                                    }
                                })
                            ),
                            React.createElement('h4', { className: "font-semibold text-sm text-gray-800 mb-1 text-center" }, weeklyPlan[day].name),
                            React.createElement('p', { className: "text-xs text-gray-600 text-center" }, 
                                weeklyPlan[day].ingredients.slice(0, 2).join(', ') + 
                                (weeklyPlan[day].ingredients.length > 2 ? '...' : '')
                            )
                        ) :
                        React.createElement('p', { className: "text-gray-400 text-sm text-center" }, "Drop a meal here")
                )
            )
        )
    );
};

// Export to global scope
window.Components = window.Components || {};
window.Components.WeeklyPlan = WeeklyPlan;