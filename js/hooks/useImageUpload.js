const { useState, useEffect } = React;

const useImageUpload = () => {
    const [showCropper, setShowCropper] = useState(false);
    const [tempImageForCrop, setTempImageForCrop] = useState('');
    const [imageLoadingStates, setImageLoadingStates] = useState({});
    const { isFirebaseConfigured, firebase } = window.firebaseState;

    // Handle image loading states
    const handleImageLoad = (imageKey) => {
        setImageLoadingStates(prev => ({
            ...prev,
            [imageKey]: false
        }));
    };

    const handleImageStart = (imageKey) => {
        setImageLoadingStates(prev => ({
            ...prev,
            [imageKey]: true
        }));
    };

    // Handle file upload
    const handleFileUpload = async (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setTempImageForCrop(e.target.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
        }
    };

    const handleCropComplete = async (croppedBlob) => {
        if (!isFirebaseConfigured) {
            alert("Firebase not configured. Please add your Firebase configuration to enable image uploads.");
            setShowCropper(false);
            return null;
        }

        try {
            // Create unique filename
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substr(2, 9);
            const fileName = `${timestamp}_${randomId}.jpg`;
            
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`meals/${fileName}`);

            // Upload to Firebase Storage
            await fileRef.put(croppedBlob);
            
            // Get the download URL
            const downloadURL = await fileRef.getDownloadURL();
            console.log("Upload successful, URL:", downloadURL);

            setShowCropper(false);
            return downloadURL;

        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Image upload failed: " + error.message);
            setShowCropper(false);
            return null;
        }
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setTempImageForCrop('');
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    return {
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
    };
};

// Export to global scope
window.Hooks = window.Hooks || {};
window.Hooks.useImageUpload = useImageUpload;