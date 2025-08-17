const { useState, useEffect, useRef } = React;

const MealPlannerApp = () => {
    // Get components and hooks from global scope
    const { Header, WeeklyPlan, AddMealForm, MealsGrid, ImageCropper } = window.Components;
    const { useFirebase, useImageUpload } = window.Hooks;
    const { Plus } = window.Icons;
    const { isFirebaseConfigured, firebase } = window.firebaseState;

    // State
    const [meals, setMeals] = useState([]);

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

    // Custom hooks
    const { saving, lastSaved, saveToFirebase, loadFromFirebase, forceLoadFromFirebase } = useFirebase(meals, weeklyPlan, setMeals, setWeeklyPlan);
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
            if (loadedMeals) setMeals(loadedMeals);
            if (loadedPlan) setWeeklyPlan(loadedPlan);
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
            
            // Reset form first
            setNewMealName('');
            setNewMealIngredients('');
            setNewMealImage('');
            setImagePreview('');
            setUploadMethod('url');
            setShowAddMeal(false);
            
            // AUTO-SAVE ONLY when adding a new meal - pass the updated meals directly
            if (isFirebaseConfigured) {
                console.log("Auto-saving after adding new meal with", updatedMeals.length, "meals");
                try {
                    await saveToFirebase(updatedMeals, weeklyPlan);
                    console.log("Successfully saved new meal to Firebase");
                } catch (error) {
                    console.error("Failed to save new meal to Firebase:", error);
                }
            }
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

        // Save the updated data to Firebase
        if (isFirebaseConfigured) {
            console.log("Auto-saving after deleting meal with", updatedMeals.length, "meals remaining");
            try {
                await saveToFirebase(updatedMeals, updatedPlan);
                console.log("Successfully saved meal deletion to Firebase");
            } catch (error) {
                console.error("Failed to save meal deletion to Firebase:", error);
            }
        }
    };

    // Weekly plan functions
    const assignMealToDay = (day, meal) => {
        setWeeklyPlan({
            ...weeklyPlan,
            [day]: meal
        });
    };

    const removeMealFromDay = (day) => {
        setWeeklyPlan({
            ...weeklyPlan,
            [day]: null
        });
    };

    const randomizeMealPlan = () => {
        const { days } = window.Utils;
        const availableMeals = [...meals];
        const newPlan = {};
        
        days.forEach(day => {
            if (availableMeals.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableMeals.length);
                newPlan[day] = availableMeals[randomIndex];
            } else {
                newPlan[day] = null;
            }
        });
        
        setWeeklyPlan(newPlan);
    };

    const clearWeeklyPlan = () => {
        setWeeklyPlan({
            Monday: null,
            Tuesday: null,
            Wednesday: null,
            Thursday: null,
            Friday: null,
            Saturday: null,
            Sunday: null
        });
    };

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
                onSave: saveToFirebase,
                onForceLoad: forceLoadFromFirebase
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