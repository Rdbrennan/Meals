const { useState, useEffect, useRef } = React;

const useFirebase = (meals, weeklyPlan) => {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [lastKnownServerTimestamp, setLastKnownServerTimestamp] = useState(null);
    const [conflictDetected, setConflictDetected] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(false);
    const saveTimeoutRef = useRef(null);
    const { db, isFirebaseConfigured, firebase } = window.firebaseState;

    // Helper function to sanitize data before savin
    const sanitizeData = (data) => {
        return JSON.parse(JSON.stringify(data));
    };

    // Sanitize meals data specifically
    const sanitizeMeals = (meals) => {
        if (!Array.isArray(meals)) return [];
        
        return meals.map(meal => {
            const sanitizedMeal = {
                id: meal.id,
                name: String(meal.name || ''),
                ingredients: Array.isArray(meal.ingredients) ? meal.ingredients.map(ing => String(ing)) : [],
                image: String(meal.image || '')
            };
            
            Object.keys(sanitizedMeal).forEach(key => {
                if (sanitizedMeal[key] === undefined || typeof sanitizedMeal[key] === 'function') {
                    delete sanitizedMeal[key];
                }
            });
            
            return sanitizedMeal;
        });
    };

    // Sanitize weekly plan data
    const sanitizeWeeklyPlan = (weeklyPlan) => {
        if (!weeklyPlan || typeof weeklyPlan !== 'object') return {};
        
        const sanitizedPlan = {};
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        validDays.forEach(day => {
            if (weeklyPlan[day] && typeof weeklyPlan[day] === 'object') {
                sanitizedPlan[day] = {
                    id: weeklyPlan[day].id,
                    name: String(weeklyPlan[day].name || ''),
                    ingredients: Array.isArray(weeklyPlan[day].ingredients) 
                        ? weeklyPlan[day].ingredients.map(ing => String(ing)) 
                        : [],
                    image: String(weeklyPlan[day].image || '')
                };
            } else {
                sanitizedPlan[day] = null;
            }
        });
        
        return sanitizedPlan;
    };

    // Check for conflicts before saving
    const checkForConflicts = async () => {
        if (!isFirebaseConfigured || !lastKnownServerTimestamp) {
            return false; // No conflict if we haven't loaded data yet or Firebase not configured
        }

        try {
            const doc = await db.collection('mealPlans').doc('emby-arby-plan').get();
            if (doc.exists) {
                const serverData = doc.data();
                const serverTimestamp = serverData.lastUpdated;
                
                // Check if server data is newer than our last known timestamp
                if (serverTimestamp && lastKnownServerTimestamp && 
                    serverTimestamp.toMillis() > lastKnownServerTimestamp.toMillis()) {
                    console.warn("Conflict detected: Server data is newer than local data");
                    return {
                        hasConflict: true,
                        serverData: serverData,
                        serverTimestamp: serverTimestamp
                    };
                }
            }
            return { hasConflict: false };
        } catch (error) {
            console.error("Error checking for conflicts:", error);
            return { hasConflict: false }; // Assume no conflict on error
        }
    };

    // Merge conflicting data intelligently
    const mergeData = (localData, serverData) => {
        console.log("Merging conflicted data...");
        
        // For meals: merge by ID, keeping the most recent or both if different
        const mergedMeals = [...localData.meals];
        const localMealIds = new Set(localData.meals.map(meal => meal.id));
        
        serverData.meals.forEach(serverMeal => {
            if (!localMealIds.has(serverMeal.id)) {
                mergedMeals.push(serverMeal);
            }
        });

        // For weekly plan: prefer local changes for now (user is actively editing)
        // But log the conflict for user awareness
        console.log("Weekly plan conflict - keeping local version:", localData.weeklyPlan);
        console.log("Server had:", serverData.weeklyPlan);

        return {
            meals: mergedMeals,
            weeklyPlan: localData.weeklyPlan // Prefer local weekly plan changes
        };
    };

    // Load data from Firebase on component mount
    useEffect(() => {
        if (isFirebaseConfigured && !initialLoadComplete) {
            loadFromFirebase();
        } else if (!isFirebaseConfigured) {
            setInitialLoadComplete(true);
        }
    }, []);

    // Safe save with conflict resolution
    const saveToFirebase = async function saveToFirebaseNamed(mealsToSave = null, weeklyPlanToSave = null, options = {}) {
        console.log("🔄 saveToFirebase called with:", {
            mealsToSave: mealsToSave ? `${mealsToSave.length} meals` : 'current meals',
            weeklyPlanToSave: weeklyPlanToSave ? 'provided plan' : 'current plan',
            options
        });

        if (!isFirebaseConfigured) {
            if (!options.silent) {
                alert("Firebase not configured. Please add your Firebase configuration to enable cloud saving.");
            }
            return false;
        }

        // Prevent multiple simultaneous saves
        if (saving) {
            console.log("⚠️ Save already in progress, skipping...");
            return false;
        }

        setSaving(true);
        
        try {
            console.log("🔍 Starting save process...");
            
            // Get the data to work with
            const currentMeals = mealsToSave || meals;
            const currentWeeklyPlan = weeklyPlanToSave || weeklyPlan;
            
            console.log("📊 Raw data before sanitization:", {
                mealsType: typeof currentMeals,
                mealsIsArray: Array.isArray(currentMeals),
                mealsLength: currentMeals?.length,
                mealsFirst: currentMeals?.[0],
                weeklyPlanType: typeof currentWeeklyPlan,
                weeklyPlanKeys: currentWeeklyPlan ? Object.keys(currentWeeklyPlan) : 'null',
                weeklyPlanMonday: currentWeeklyPlan?.Monday
            });

            // Check for conflicts first
            console.log("🔍 Checking for conflicts...");
            const conflictCheck = await checkForConflicts();
            console.log("✅ Conflict check complete:", conflictCheck);
            
            if (conflictCheck.hasConflict && !options.forceOverwrite) {
                console.log("⚠️ Conflict detected, handling...");
                setConflictDetected(true);
                
                if (!options.silent) {
                    const shouldMerge = confirm(
                        "Conflict detected: The data on the server has been updated by another session. " +
                        "Click OK to merge changes, or Cancel to keep your local changes and overwrite the server."
                    );
                    
                    if (shouldMerge) {
                        const localData = {
                            meals: sanitizeMeals(currentMeals),
                            weeklyPlan: sanitizeWeeklyPlan(currentWeeklyPlan)
                        };
                        
                        const mergedData = mergeData(localData, conflictCheck.serverData);
                        
                        // Save merged data
                        return await saveToFirebaseNamed(mergedData.meals, mergedData.weeklyPlan, { 
                            forceOverwrite: true, 
                            silent: true 
                        });
                    }
                } else {
                    // Silent conflict resolution - merge automatically
                    const localData = {
                        meals: sanitizeMeals(currentMeals),
                        weeklyPlan: sanitizeWeeklyPlan(currentWeeklyPlan)
                    };
                    
                    const mergedData = mergeData(localData, conflictCheck.serverData);
                    
                    return await saveToFirebaseNamed(mergedData.meals, mergedData.weeklyPlan, { 
                        forceOverwrite: true, 
                        silent: true 
                    });
                }
            }

            console.log("🧹 Sanitizing data...");
            // Sanitize the data before saving
            const sanitizedMeals = sanitizeMeals(currentMeals);
            const sanitizedWeeklyPlan = sanitizeWeeklyPlan(currentWeeklyPlan);

            console.log("✅ Data sanitized:", {
                sanitizedMealsLength: sanitizedMeals.length,
                sanitizedWeeklyPlanKeys: Object.keys(sanitizedWeeklyPlan),
                sampleMeal: sanitizedMeals[0],
                sampleWeeklyPlan: sanitizedWeeklyPlan.Monday
            });

            const dataToSave = {
                meals: sanitizedMeals,
                weeklyPlan: sanitizedWeeklyPlan,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                saveSource: 'web-app',
                version: Date.now()
            };

            console.log("💾 Preparing to save:", {
                mealsCount: dataToSave.meals.length,
                weeklyPlanDays: Object.keys(dataToSave.weeklyPlan).length,
                hasConflict: conflictCheck.hasConflict,
                forceOverwrite: options.forceOverwrite
            });

            // Verify data is serializable
            console.log("🔍 Testing serializability...");
            try {
                const testSerialization = JSON.stringify(dataToSave);
                console.log("✅ Data is serializable, size:", testSerialization.length);
            } catch (serializeError) {
                console.error("❌ Data is not serializable:", serializeError);
                console.error("❌ Problematic data:", dataToSave);
                throw new Error("Data contains non-serializable objects: " + serializeError.message);
            }

            console.log("🔄 Starting Firebase transaction...");
            // Use transaction for atomic updates
            await db.runTransaction(async (transaction) => {
                console.log("📋 Inside transaction...");
                const docRef = db.collection('mealPlans').doc('emby-arby-plan');
                const doc = await transaction.get(docRef);
                console.log("📄 Got document:", doc.exists);
                
                if (doc.exists && !options.forceOverwrite) {
                    const serverData = doc.data();
                    const serverTimestamp = serverData.lastUpdated;
                    
                    // Double-check for conflicts within the transaction
                    if (serverTimestamp && lastKnownServerTimestamp && 
                        serverTimestamp.toMillis() > lastKnownServerTimestamp.toMillis()) {
                        console.log("⚠️ Conflict detected during transaction");
                        throw new Error("Conflict detected during transaction");
                    }
                }
                
                console.log("💾 Setting document data...");
                transaction.set(docRef, dataToSave);
                console.log("✅ Transaction set complete");
            });

            console.log("🎉 Firebase transaction completed successfully!");

            const now = new Date();
            setLastSaved(now);
            setLastKnownServerTimestamp({ toMillis: () => now.getTime() });
            setConflictDetected(false);
            setPendingChanges(false);
            
            if (!options.silent) {
                console.log("✅ Data saved to Firebase successfully");
            }
            return true;
            
        } catch (error) {
            console.error("❌ Error in saveToFirebase:", error);
            console.error("❌ Error stack:", error.stack);
            console.error("❌ Error message:", error.message);
            console.error("❌ Error details:", {
                name: error.name,
                code: error.code,
                customData: error.customData
            });
            
            if (error.message === "Conflict detected during transaction") {
                console.log("🔄 Retrying with conflict resolution...");
                // Retry with conflict resolution
                return await saveToFirebaseNamed(mealsToSave, weeklyPlanToSave, { ...options, silent: false });
            }
            
            if (!options.silent) {
                alert("Failed to save data: " + error.message + ". Please check the browser console for more details.");
            }
            return false;
        } finally {
            console.log("🏁 saveToFirebase finally block");
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
                console.log("Loading data from Firebase:", data);
                
                // Store the server timestamp for conflict detection
                setLastKnownServerTimestamp(data.lastUpdated);
                setLastSaved(data.lastUpdated?.toDate() || new Date());
                setInitialLoadComplete(true);
                
                // Sanitize loaded data
                const sanitizedMeals = sanitizeMeals(data.meals);
                const sanitizedWeeklyPlan = sanitizeWeeklyPlan(data.weeklyPlan);
                
                return {
                    meals: sanitizedMeals.length > 0 ? sanitizedMeals : null,
                    weeklyPlan: Object.keys(sanitizedWeeklyPlan).length > 0 ? sanitizedWeeklyPlan : null
                };
            } else {
                console.log("No Firebase document found, this is the first time.");
                setInitialLoadComplete(true);
                return { meals: null, weeklyPlan: null };
            }
        } catch (error) {
            console.error("Error loading from Firebase:", error);
            setInitialLoadComplete(true);
            return { meals: null, weeklyPlan: null };
        }
    };

    // Force reload with user confirmation if there are unsaved changes
    const forceLoadFromFirebase = async () => {
        if (!isFirebaseConfigured) {
            alert("Firebase not configured.");
            return { meals: null, weeklyPlan: null };
        }

        if (pendingChanges) {
            const shouldProceed = confirm(
                "You have unsaved changes. Reloading from Firebase will overwrite your local changes. Continue?"
            );
            if (!shouldProceed) {
                return { meals: null, weeklyPlan: null };
            }
        }

        try {
            const doc = await db.collection('mealPlans').doc('emby-arby-plan').get();
            if (doc.exists) {
                const data = doc.data();
                console.log("Force loading data from Firebase");
                
                // Update our conflict detection timestamp
                setLastKnownServerTimestamp(data.lastUpdated);
                setLastSaved(data.lastUpdated?.toDate() || new Date());
                setConflictDetected(false);
                setPendingChanges(false);
                
                // Sanitize loaded data
                const sanitizedMeals = sanitizeMeals(data.meals);
                const sanitizedWeeklyPlan = sanitizeWeeklyPlan(data.weeklyPlan);
                
                alert("Data reloaded from Firebase successfully!");
                
                return {
                    meals: sanitizedMeals.length > 0 ? sanitizedMeals : null,
                    weeklyPlan: Object.keys(sanitizedWeeklyPlan).length > 0 ? sanitizedWeeklyPlan : null
                };
            } else {
                alert("No saved data found in Firebase.");
                return { meals: null, weeklyPlan: null };
            }
        } catch (error) {
            console.error("Error force loading from Firebase:", error);
            alert("Failed to reload data from Firebase: " + error.message);
            return { meals: null, weeklyPlan: null };
        }
    };

    // Mark that we have pending changes
    const markPendingChanges = () => {
        setPendingChanges(true);
    };

    // Create a backup before major operations
    const createBackup = async () => {
        if (!isFirebaseConfigured) return false;
        
        try {
            const backupData = {
                meals: sanitizeMeals(meals),
                weeklyPlan: sanitizeWeeklyPlan(weeklyPlan),
                backedUpAt: firebase.firestore.FieldValue.serverTimestamp(),
                backupSource: 'manual'
            };
            
            await db.collection('mealPlans').doc(`emby-arby-plan-backup-${Date.now()}`).set(backupData);
            alert("Backup created successfully!");
            return true;
        } catch (error) {
            console.error("Error creating backup:", error);
            alert("Failed to create backup: " + error.message);
            return false;
        }
    };

    return {
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
    };
};

// Export to global scope
window.Hooks = window.Hooks || {};
window.Hooks.useFirebase = useFirebase;