const AddMealForm = ({
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
    onAddMeal,
    onCancel,
    fileInputRef,
    onFileUpload,
    onDragOver,
    onDragLeave,
    onDrop
}) => {
    const { Upload } = window.Icons;

    if (!showAddMeal) return null;

    return React.createElement('div', { className: "bg-gray-50 rounded-lg p-4 mb-6" },
        React.createElement('h3', { className: "font-semibold text-gray-700 mb-3" }, "Add New Meal"),
        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement('input', {
                    type: "text",
                    placeholder: "Meal name",
                    value: newMealName,
                    onChange: (e) => setNewMealName(e.target.value),
                    className: "border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                }),
                React.createElement('input', {
                    type: "text",
                    placeholder: "Ingredients (comma separated)",
                    value: newMealIngredients,
                    onChange: (e) => setNewMealIngredients(e.target.value),
                    className: "border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                })
            ),
            
            // Image Upload Options
            React.createElement('div', { className: "space-y-3" },
                React.createElement('div', { className: "flex gap-4" },
                    React.createElement('label', { className: "flex items-center" },
                        React.createElement('input', {
                            type: "radio",
                            name: "imageMethod",
                            value: "url",
                            checked: uploadMethod === 'url',
                            onChange: (e) => {
                                setUploadMethod(e.target.value);
                                setImagePreview('');
                                setNewMealImage('');
                            },
                            className: "mr-2"
                        }),
                        React.createElement('span', {}, "Image URL")
                    ),
                    React.createElement('label', { className: "flex items-center" },
                        React.createElement('input', {
                            type: "radio",
                            name: "imageMethod",
                            value: "upload",
                            checked: uploadMethod === 'upload',
                            onChange: (e) => {
                                setUploadMethod(e.target.value);
                                setImagePreview('');
                                setNewMealImage('');
                            },
                            className: "mr-2"
                        }),
                        React.createElement('span', {}, "Upload Image")
                    )
                ),

                uploadMethod === 'url' ? 
                    React.createElement('input', {
                        type: "text",
                        placeholder: "Image URL (optional - we'll use a default if empty)",
                        value: newMealImage,
                        onChange: (e) => {
                            setNewMealImage(e.target.value);
                            setImagePreview(e.target.value);
                        },
                        className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }) :
                    React.createElement('div', { className: "space-y-3" },
                        React.createElement('div', {
                            className: "file-drop-zone",
                            onClick: () => fileInputRef.current?.click(),
                            onDragOver: onDragOver,
                            onDragLeave: onDragLeave,
                            onDrop: onDrop
                        },
                            React.createElement('div', { className: "space-y-2" },
                                React.createElement(Upload, { size: 32 }),
                                React.createElement('p', { className: "text-gray-600" }, "Click to upload or drag and drop"),
                                React.createElement('p', { className: "text-sm text-gray-500" }, "PNG, JPG, GIF up to 10MB")
                            )
                        ),
                        React.createElement('input', {
                            ref: fileInputRef,
                            type: "file",
                            accept: "image/*",
                            onChange: (e) => {
                                if (e.target.files[0]) {
                                    onFileUpload(e.target.files[0]);
                                }
                            },
                            className: "hidden"
                        })
                    )
            ),

            // Image Preview
            imagePreview && React.createElement('div', { className: "mt-3" },
                React.createElement('p', { className: "text-sm text-gray-600 mb-2" }, "Image Preview:"),
                React.createElement('img', {
                    src: imagePreview,
                    alt: "Preview",
                    className: "file-preview",
                    onError: () => setImagePreview('')
                })
            ),

            React.createElement('div', { className: "flex gap-2" },
                React.createElement('button', {
                    onClick: onAddMeal,
                    className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                }, "Submit"),
                React.createElement('button', {
                    onClick: onCancel,
                    className: "bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                }, "Cancel")
            )
        )
    );
};

// Export to global scope
window.Components = window.Components || {};
window.Components.AddMealForm = AddMealForm;