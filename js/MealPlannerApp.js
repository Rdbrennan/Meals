const { useState, useEffect, useRef, useCallback } = React;

const MealPlannerApp = () => {
    // Get components and hooks from global scope - ADDED GroceryList here
    const { Header, WeeklyPlan, AddMealForm, MealsGrid, ImageCropper, GroceryList } = window.Components;
    const { useFirebase, useImageUpload } = window.Hooks;
    const { Plus } = window.Icons;
    const { isFirebaseConfigured, firebase } = window.firebaseState;

    // State
    const [meals, setMeals] = useState([
        {
            id: 1,
            name: "Spaghetti Carbonara",
            ingredients: ["pasta", "eggs", "bacon", "parmesan", "black pepper"],
            image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop&auto=format"
        },
        {
            id: 2,
            name: "Chicken Stir Fry",
            ingredients: ["chicken breast", "mixed vegetables", "soy sauce", "garlic", "ginger", "rice"],
            image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&auto=format"
        },
        {
            id: 3,
            name: "Vegetable Curry",
            ingredients: ["mixed vegetables", "coconut milk", "curry powder", "onion", "garlic", "rice"],
            image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&auto=format"
        }
    ]);

    const [weeklyPlan, setWeeklyPlan] = useState({
        Monday: null,
        Tuesday: null,
        Wednesday: null,
        Thursday: null,
        Friday: null,
        Saturday: null,
        Sunday: null
    });

    // Add meal form state
    const [showAddMeal, setShowAddMeal] = useState(false);
    const [newMealName, setNewMealName] = useState('');
    const [newMealIngredients, setNewMealIngredients] = useState('');
    const [newMealImage, setNewMealImage] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [uploadMethod, setUploadMethod] = useState('url');
    
    const fileInputRef = useRef(null);

    // Custom hooks - FIXED: Added initialLoadComplete to destructuring
    const { 
        saving, 
        lastSaved, 
        conflictDetected,
        pendingChanges,
        saveToFirebase, 
        loadFromFirebase, 
        forceLoadFromFirebase,
        initialLoadComplete,
        markPendingChanges,
        createBackup
    } = useFirebase(meals, weeklyPlan);
    
    const {
        showCropper,
        tempImageForCrop,
        imageLoadingStates,
        handleImageLoad,
        handleImageStart,
        handleFileUpload,
        handleCropComplete,
        handleCropCancel,
        handleDragOver,
        handleDragLeave,
        handleDrop
    } = useImageUpload();

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            const { meals: loadedMeals, weeklyPlan: loadedPlan } = await loadFromFirebase();
            if (loadedMeals) {
                console.log("Loading meals from Firebase:", loadedMeals);
                setMeals(loadedMeals);
            }
            if (loadedPlan) {
                console.log("Loading weekly plan from Firebase:", loadedPlan);
                setWeeklyPlan(loadedPlan);
            }
        };
        loadData();
    }, []);

    // Handle file upload cleanup
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    // Debounced save function to prevent excessive saves
    const debouncedSave = useCallback(
        debounce(async (mealsToSave, weeklyPlanToSave) => {
            console.log("Debounced save triggered", { mealsToSave, weeklyPlanToSave });
            await saveToFirebase(mealsToSave, weeklyPlanToSave, { silent: true });
        }, 2000), // Increased debounce time to 2 seconds
        [saveToFirebase]
    );

    // Track changes to mark pending changes - FIXED: Now initialLoadComplete is available
    useEffect(() => {
        if (initialLoadComplete) {
            markPendingChanges();
        }
    }, [meals, weeklyPlan, markPendingChanges, initialLoadComplete]);

    // Simple debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Meal management functions
    const addMeal = async () => {
        if (newMealName.trim() && newMealIngredients.trim()) {
            const ingredientsList = newMealIngredients.split(',').map(ing => ing.trim());
            
            const imageUrl = newMealImage.trim() || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&auto=format";
            
            const newMeal = {
                id: Date.now(),
                name: newMealName.trim(),
                ingredients: ingredientsList,
                image: imageUrl
            };
            
            const updatedMeals = [...meals, newMeal];
            setMeals(updatedMeals);
            
            // Auto-save after adding meal
            debouncedSave(updatedMeals, weeklyPlan);
            
            // Reset form
            setNewMealName('');
            setNewMealIngredients('');
            setNewMealImage('');
            setImagePreview('');
            setUploadMethod('url');
            setShowAddMeal(false);
        }
    };

    const deleteMeal = async (mealId) => {
        const mealToDelete = meals.find(meal => meal.id === mealId);

        // Delete from Firebase Storage if applicable
        if (isFirebaseConfigured && mealToDelete?.image && mealToDelete.image.includes("firebasestorage.googleapis.com")) {
            try {
                const storageRef = firebase.storage().refFromURL(mealToDelete.image);
                await storageRef.delete();
                console.log("Deleted image from Firebase Storage:", mealToDelete.image);
            } catch (error) {
                console.error("Error deleting image from Firebase Storage:", error);
            }
        }

        // Remove meal from the list
        const updatedMeals = meals.filter(meal => meal.id !== mealId);
        setMeals(updatedMeals);

        // Remove from weekly plan
        const updatedPlan = { ...weeklyPlan };
        Object.keys(updatedPlan).forEach(day => {
            if (updatedPlan[day]?.id === mealId) {
                updatedPlan[day] = null;
            }
        });
        setWeeklyPlan(updatedPlan);

        // Auto-save after deletion
        debouncedSave(updatedMeals, updatedPlan);
    };

    // Weekly plan functions with proper state management
    const assignMealToDay = useCallback((day, meal) => {
        console.log("Assigning meal to day:", { day, meal: meal.name });
        
        // Create a clean copy of the meal object to avoid any event contamination
        const cleanMeal = {
            id: meal.id,
            name: meal.name,
            ingredients: [...meal.ingredients],
            image: meal.image
        };
        
        const updatedPlan = {
            ...weeklyPlan,
            [day]: cleanMeal
        };
        
        console.log("Updated plan:", updatedPlan);
        setWeeklyPlan(updatedPlan);
        
        // Auto-save after assignment
        debouncedSave(meals, updatedPlan);
    }, [weeklyPlan, meals, debouncedSave]);

    const removeMealFromDay = useCallback((day) => {
        console.log("Removing meal from day:", day);
        
        const updatedPlan = {
            ...weeklyPlan,
            [day]: null
        };
        
        console.log("Updated plan after removal:", updatedPlan);
        setWeeklyPlan(updatedPlan);
        
        // Auto-save after removal
        debouncedSave(meals, updatedPlan);
    }, [weeklyPlan, meals, debouncedSave]);

    const randomizeMealPlan = useCallback(() => {
        const { days } = window.Utils;
        const availableMeals = [...meals];
        const newPlan = {};
        
        days.forEach(day => {
            if (availableMeals.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableMeals.length);
                const selectedMeal = availableMeals[randomIndex];
                
                // Create clean copy
                newPlan[day] = {
                    id: selectedMeal.id,
                    name: selectedMeal.name,
                    ingredients: [...selectedMeal.ingredients],
                    image: selectedMeal.image
                };
            } else {
                newPlan[day] = null;
            }
        });
        
        console.log("Randomized plan:", newPlan);
        setWeeklyPlan(newPlan);
        
        // Auto-save after randomization
        debouncedSave(meals, newPlan);
    }, [meals, debouncedSave]);

    const clearWeeklyPlan = useCallback(() => {
        const clearedPlan = {
            Monday: null,
            Tuesday: null,
            Wednesday: null,
            Thursday: null,
            Friday: null,
            Saturday: null,
            Sunday: null
        };
        
        console.log("Clearing weekly plan");
        setWeeklyPlan(clearedPlan);
        
        // Auto-save after clearing
        debouncedSave(meals, clearedPlan);
    }, [meals, debouncedSave]);

    // Manual save function
    const handleManualSave = useCallback(async () => {
        console.log("Manual save triggered");
        const success = await saveToFirebase(meals, weeklyPlan, { silent: false });
        if (success) {
            alert("Data saved successfully!");
        }
    }, [meals, weeklyPlan, saveToFirebase]);

    // Create backup function
    const handleCreateBackup = useCallback(async () => {
        await createBackup();
    }, [createBackup]);

    // Force reload function
    const handleForceReload = useCallback(async () => {
        const { meals: loadedMeals, weeklyPlan: loadedPlan } = await forceLoadFromFirebase();
        if (loadedMeals) {
            setMeals(loadedMeals);
        }
        if (loadedPlan) {
            setWeeklyPlan(loadedPlan);
        }
    }, [forceLoadFromFirebase]);

    // Image handling for cropper
    const handleCropCompleteWithPreview = async (croppedBlob) => {
        const downloadURL = await handleCropComplete(croppedBlob);
        if (downloadURL) {
            // Show local preview while uploading
            const localPreview = URL.createObjectURL(croppedBlob);
            setImagePreview(localPreview);
            setNewMealImage(downloadURL);
            
            // Cleanup blob URL after a short delay
            setTimeout(() => {
                if (localPreview.startsWith('blob:')) {
                    URL.revokeObjectURL(localPreview);
                }
            }, 200);
        }
    };

    return React.createElement('div', { 
        className: "min-h-screen p-4", 
        style: { background: "linear-gradient(120deg, rgba(220, 245, 220, 0.8), rgba(255, 235, 230, 0.8))" } 
    },
        React.createElement('div', { className: "max-w-6xl mx-auto" },
            // Header
            React.createElement(Header, {
                saving,
                lastSaved,
                conflictDetected,
                pendingChanges,
                onSave: handleManualSave,
                onForceReload: handleForceReload,
                onCreateBackup: handleCreateBackup
            }),

            // Weekly Plan Section
            React.createElement(WeeklyPlan, {
                weeklyPlan,
                onAssignMeal: assignMealToDay,
                onRemoveMeal: removeMealFromDay,
                onRandomize: randomizeMealPlan,
                onClear: clearWeeklyPlan,
                imageLoadingStates,
                onImageLoad: handleImageLoad,
                onImageStart: handleImageStart
            }),

            // Meals Library Section
            React.createElement('div', { className: "bg-white rounded-xl shadow-lg p-6" },
                React.createElement('div', { className: "flex justify-between items-center mb-6" },
                    React.createElement('h2', { className: "text-2xl font-semibold text-gray-800" }, "Meal Library"),
                    React.createElement('button', {
                        onClick: () => setShowAddMeal(true),
                        className: "flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    },
                        React.createElement(Plus, { size: 16 }),
                        "Add New Meal"
                    )
                ),

                // Add Meal Form
                React.createElement(AddMealForm, {
                    showAddMeal,
                    newMealName,
                    setNewMealName,
                    newMealIngredients,
                    setNewMealIngredients,
                    newMealImage,
                    setNewMealImage,
                    imagePreview,
                    setImagePreview,
                    uploadMethod,
                    setUploadMethod,
                    onAddMeal: addMeal,
                    onCancel: () => setShowAddMeal(false),
                    fileInputRef,
                    onFileUpload: handleFileUpload,
                    onDragOver: handleDragOver,
                    onDragLeave: handleDragLeave,
                    onDrop: handleDrop
                }),

                // Meals Grid
                React.createElement(MealsGrid, {
                    meals,
                    onDeleteMeal: deleteMeal,
                    imageLoadingStates,
                    onImageLoad: handleImageLoad,
                    onImageStart: handleImageStart
                }),

                            // ADDED: Grocery List Section
                React.createElement(GroceryList, {
                    weeklyPlan,
                    meals
                })
            ),

            // Image Cropper Modal
            showCropper && React.createElement(ImageCropper, {
                imageSrc: tempImageForCrop,
                onCropComplete: handleCropCompleteWithPreview,
                onCancel: handleCropCancel
            })
        )
    );
};

// Export to global scope
window.MealPlannerApp = MealPlannerApp;