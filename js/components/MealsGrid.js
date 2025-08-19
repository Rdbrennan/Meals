const MealsGrid = ({ 
    meals, 
    onDeleteMeal,
    imageLoadingStates,
    onImageLoad,
    onImageStart 
}) => {
    const { X } = window.Icons;

    // Enhanced drag handlers
    const handleDragStart = (e, meal) => {
        e.dataTransfer.setData('application/json', JSON.stringify(meal));
        e.dataTransfer.effectAllowed = 'copy';
        
        // Create a custom drag image for better visual feedback
        const dragImage = e.currentTarget.cloneNode(true);
        dragImage.style.transform = 'rotate(5deg)';
        dragImage.style.opacity = '0.8';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        dragImage.style.width = e.currentTarget.offsetWidth + 'px';
        dragImage.style.height = e.currentTarget.offsetHeight + 'px';
        document.body.appendChild(dragImage);
        
        e.dataTransfer.setDragImage(dragImage, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
        
        // Clean up drag image after drag starts
        setTimeout(() => {
            if (dragImage.parentNode) {
                document.body.removeChild(dragImage);
            }
        }, 0);

        // Visual feedback on the original element
        e.currentTarget.style.opacity = '0.5';
        e.currentTarget.style.transform = 'scale(0.95)';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'scale(1)';
    };

    if (meals.length === 0) {
        return React.createElement('div', { className: "text-center py-12 text-gray-500" },
            React.createElement('p', {}, "No meals in your library yet."),
            React.createElement('p', {}, "Click \"Add New Meal\" to get started!")
        );
    }

    return React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" },
        meals.map(meal =>
            React.createElement('div', {
                key: meal.id,
                className: "meal-card p-6 cursor-grab active:cursor-grabbing group relative transition-all duration-200 ease-in-out",
                draggable: true,
                onDragStart: (e) => handleDragStart(e, meal),
                onDragEnd: handleDragEnd
            },
                React.createElement('button', {
                    onClick: () => onDeleteMeal(meal.id),
                    className: "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-red-600 z-10"
                }, React.createElement(X, { size: 12 })),
                
                // Circular image container
                React.createElement('div', { className: "meal-image-container" },
                    meal.image && React.createElement('div', { className: "relative w-full h-full" },
                        imageLoadingStates[`meal-${meal.id}`] && React.createElement('div', {
                            className: "absolute inset-0 skeleton rounded-full z-10"
                        }),
                        React.createElement('img', {
                            src: meal.image,
                            alt: meal.name,
                            className: "meal-image",
                            onLoad: () => onImageLoad(`meal-${meal.id}`),
                            onLoadStart: () => onImageStart(`meal-${meal.id}`),
                            onError: (e) => { 
                                e.target.style.display = 'none';
                                onImageLoad(`meal-${meal.id}`);
                            }
                        })
                    )
                ),
                
                // Meal name
                React.createElement('h3', { className: "font-bold text-gray-900 text-lg mb-3 text-center" }, meal.name),
                
                // Ingredients
                React.createElement('div', { className: "flex flex-wrap gap-2 justify-center" },
                    meal.ingredients.slice(0, 4).map((ingredient, index) =>
                        React.createElement('span', {
                            key: index,
                            className: "ingredient-tag"
                        }, ingredient)
                    ),
                    meal.ingredients.length > 4 && React.createElement('span', {
                        className: "ingredient-tag"
                    }, `+${meal.ingredients.length - 4} more`)
                )
            )
        )
    );
};

// Export to global scope
window.Components = window.Components || {};
window.Components.MealsGrid = MealsGrid;