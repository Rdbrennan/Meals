const Header = ({ saving, lastSaved, onSave }) => {
    const { ChefHat, Calendar, Cloud } = window.Icons;
    const { getWeekRange } = window.Utils;
    const { isFirebaseConfigured } = window.firebaseState;

    return React.createElement('div', { className: "text-center mb-8" },
        React.createElement('div', { className: "flex items-center justify-center gap-4 mb-6" },
            React.createElement('div', { className: "bg-white rounded-full p-4 shadow-sm" },
                React.createElement(ChefHat)
            ),
            React.createElement('h1', { className: "text-3xl font-bold text-gray-900" }, "Emby & Arby Meal Planner")
        ),
        React.createElement('p', { className: "text-lg text-gray-600 mb-4" }, "Health is wealth! Let's add some delicious meals for the current week."),
        React.createElement('div', { className: "flex items-center justify-center gap-3 text-gray-600 mb-4" },
            React.createElement(Calendar),
            React.createElement('span', { className: "text-lg font-small" }, getWeekRange())
        ),
        
        // Firebase Status & Save Button
        React.createElement('div', { className: "flex items-center justify-center gap-4" },
            isFirebaseConfigured ? 
                React.createElement('div', { className: "flex items-center gap-4" },
                    React.createElement('button', {
                        onClick: onSave,
                        disabled: saving,
                        className: `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            saving 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700'
                        } text-white`
                    },
                        React.createElement(Cloud),
                        saving ? "Saving..." : "Save to Cloud"
                    ),
                    lastSaved && React.createElement('span', { className: "text-sm text-gray-500" },
                        `Last saved: ${lastSaved.toLocaleTimeString()}`
                    ),
                    React.createElement('div', { className: "flex items-center gap-1" },
                        React.createElement('div', { className: "w-2 h-2 bg-green-500 rounded-full" }),
                        React.createElement('span', { className: "text-sm text-gray-600" }, "Cloud Connected")
                    )
                ) :
                React.createElement('div', { className: "flex items-center gap-4" },
                    React.createElement('div', { className: "flex items-center gap-1" },
                        React.createElement('div', { className: "w-2 h-2 bg-orange-500 rounded-full" }),
                        React.createElement('span', { className: "text-sm text-gray-600" }, "Firebase Not Configured")
                    ),
                    React.createElement('span', { className: "text-xs text-gray-500" }, "Add your Firebase config to enable cloud saving")
                )
        )
    );
};

// Export to global scope
window.Components = window.Components || {};
window.Components.Header = Header;