const { useState, useEffect } = React;

const useFirebase = (meals, weeklyPlan, setMeals, setWeeklyPlan) => {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const { db, isFirebaseConfigured, firebase } = window.firebaseState;

    // Load data from Firebase on component mount
    useEffect(() => {
        if (isFirebaseConfigured && !initialLoadComplete) {
            loadFromFirebase();
        } else if (!isFirebaseConfigured) {
            setInitialLoadComplete(true);
        }
    }, []);

    // REMOVED: Auto-save functionality - now only saves when manually triggered

    // Save data to Firebase (manual save only)
    const saveToFirebase = async (mealsToSave = null, weeklyPlanToSave = null) => {
        if (!isFirebaseConfigured) {
            alert("Firebase not configured. Please add your Firebase configuration to enable cloud saving.");
            return false;
        }

        setSaving(true);
        try {
            const dataToSave = {
                meals: mealsToSave || meals,
                weeklyPlan: weeklyPlanToSave || weeklyPlan,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log("Saving to Firebase:", {
                mealsCount: dataToSave.meals.length,
                weeklyPlan: dataToSave.weeklyPlan
            });

            await db.collection('mealPlans').doc('emby-arby-plan').set(dataToSave);
            setLastSaved(new Date());
            console.log("Data saved to Firebase successfully");
            return true;
        } catch (error) {
            console.error("Error saving to Firebase:", error);
            alert("Failed to save data. Please check your internet connection and Firebase configuration.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Load data from Firebase
    const loadFromFirebase = async () => {
        if (!isFirebaseConfigured) {
            console.log("Firebase not configured, keeping default data");
            setInitialLoadComplete(true);
            return { meals: null, weeklyPlan: null };
        }

        try {
            const doc = await db.collection('mealPlans').doc('emby-arby-plan').get();
            if (doc.exists) {
                const data = doc.data();
                console.log("Firebase document exists. Data found:", data);
                console.log("Meals in Firebase:", data.meals);
                console.log("Weekly plan in Firebase:", data.weeklyPlan);
                
                setLastSaved(data.lastUpdated?.toDate() || new Date());
                setInitialLoadComplete(true);
                
                return {
                    meals: data.meals && Array.isArray(data.meals) && data.meals.length > 0 ? data.meals : null,
                    weeklyPlan: data.weeklyPlan && typeof data.weeklyPlan === 'object' ? data.weeklyPlan : null
                };
            } else {
                console.log("No Firebase document found, this might be the first time. Keeping current data.");
                setInitialLoadComplete(true);
                return { meals: null, weeklyPlan: null };
            }
        } catch (error) {
            console.error("Error loading from Firebase:", error);
            console.log("Keeping current data due to Firebase error");
            setInitialLoadComplete(true);
            return { meals: null, weeklyPlan: null };
        }
    };

    // Force reload from Firebase
    const forceLoadFromFirebase = async () => {
        if (!isFirebaseConfigured) {
            alert("Firebase not configured.");
            return;
        }

        try {
            const doc = await db.collection('mealPlans').doc('emby-arby-plan').get();
            if (doc.exists) {
                const data = doc.data();
                console.log("Force loading data from Firebase");
                
                if (data.meals && Array.isArray(data.meals)) {
                    setMeals(data.meals);
                }
                
                if (data.weeklyPlan && typeof data.weeklyPlan === 'object') {
                    setWeeklyPlan(data.weeklyPlan);
                }
                
                setLastSaved(data.lastUpdated?.toDate() || new Date());
                alert("Data reloaded from Firebase successfully!");
            } else {
                alert("No saved data found in Firebase.");
            }
        } catch (error) {
            console.error("Error force loading from Firebase:", error);
            alert("Failed to reload data from Firebase: " + error.message);
        }
    };

    return {
        saving,
        lastSaved,
        saveToFirebase,
        loadFromFirebase,
        forceLoadFromFirebase,
        initialLoadComplete
    };
};

// Export to global scope
window.Hooks = window.Hooks || {};
window.Hooks.useFirebase = useFirebase;