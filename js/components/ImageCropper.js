const { useState, useRef, useEffect } = React;

// Image Cropper Component
const ImageCropper = ({ 
    imageSrc, 
    onCropComplete, 
    onCancel,
    cropSize = 300 
}) => {
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [imageScale, setImageScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
    const [minScale, setMinScale] = useState(1);
    
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    const handleImageLoad = (e) => {
        const img = e.target;
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        
        // Calculate minimum scale to ensure the image always covers the crop circle
        const minScaleX = cropSize / img.naturalWidth;
        const minScaleY = cropSize / img.naturalHeight;
        const calculatedMinScale = Math.max(minScaleX, minScaleY);
        
        setMinScale(calculatedMinScale);
        setImageScale(calculatedMinScale);
        
        // Center the image - with transform scaling, we need to account for the transform origin
        const scaledWidth = img.naturalWidth * calculatedMinScale;
        const scaledHeight = img.naturalHeight * calculatedMinScale;
        setImagePosition({
            x: (cropSize - scaledWidth) / 2,
            y: (cropSize - scaledHeight) / 2
        });
    };

    const getConstrainedPosition = (newX, newY, scale) => {
        // Use the base size (at minimum scale) for calculations
        const baseWidth = imageNaturalSize.width * minScale;
        const baseHeight = imageNaturalSize.height * minScale;
        const scaleRatio = scale / minScale;
        
        const scaledWidth = baseWidth * scaleRatio;
        const scaledHeight = baseHeight * scaleRatio;
        
        // Ensure image doesn't leave empty space in the crop circle
        const maxX = 0;
        const minX = cropSize - scaledWidth;
        const maxY = 0;
        const minY = cropSize - scaledHeight;
        
        return {
            x: Math.min(maxX, Math.max(minX, newX)),
            y: Math.min(maxY, Math.max(minY, newY))
        };
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - imagePosition.x,
            y: e.clientY - imagePosition.y
        });
    };

    const handleMouseMove = React.useCallback((e) => {
        if (!isDragging) return;
        
        const newPosition = {
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        };
        
        const constrainedPosition = getConstrainedPosition(newPosition.x, newPosition.y, imageScale);
        setImagePosition(constrainedPosition);
    }, [isDragging, dragStart, imageScale, imageNaturalSize, cropSize]);

    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false);
    }, []);

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleScaleChange = (e) => {
        const newScale = parseFloat(e.target.value);
        setImageScale(newScale);
        
        // Adjust position to keep image centered and constrained
        const constrainedPosition = getConstrainedPosition(imagePosition.x, imagePosition.y, newScale);
        setImagePosition(constrainedPosition);
    };

    const getCroppedImage = () => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = cropSize;
            canvas.height = cropSize;
            
            // Create circular clipping path
            ctx.beginPath();
            ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
            ctx.clip();
            
            // Draw the image with proper scaling
            const img = imageRef.current;
            if (img) {
                // Calculate the actual scale being applied
                const actualScale = imageScale;
                
                // Save the context state
                ctx.save();
                
                // Apply the transform
                ctx.translate(imagePosition.x, imagePosition.y);
                ctx.scale(actualScale, actualScale);
                
                // Draw the image at its natural size
                ctx.drawImage(img, 0, 0, imageNaturalSize.width, imageNaturalSize.height);
                
                // Restore the context state
                ctx.restore();
            }
            
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
    };

    const handleSave = async () => {
        const croppedBlob = await getCroppedImage();
        onCropComplete(croppedBlob);
    };

    const cropContainerStyle = {
        position: 'relative',
        width: `${cropSize}px`,
        height: `${cropSize}px`,
        overflow: 'hidden',
        borderRadius: '50%',
        border: '2px solid #e5e7eb',
        margin: '0 auto',
        cursor: isDragging ? 'grabbing' : 'grab'
    };

    const imageStyle = {
        position: 'absolute',
        left: `${imagePosition.x}px`,
        top: `${imagePosition.y}px`,
        transform: `scale(${imageScale / minScale})`,
        transformOrigin: '0 0',
        width: `${imageNaturalSize.width * minScale}px`,
        height: `${imageNaturalSize.height * minScale}px`,
        userSelect: 'none',
        pointerEvents: 'auto'
    };

    return React.createElement('div', { 
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
        style: { userSelect: 'none' }
    },
        React.createElement('div', { className: "bg-white rounded-lg p-6 max-w-md w-full mx-4" },
            React.createElement('h3', { className: "text-lg font-semibold mb-4 text-center" }, "Crop Image"),
            
            React.createElement('div', { 
                ref: containerRef,
                style: cropContainerStyle,
                className: "mb-4"
            },
                React.createElement('img', {
                    ref: imageRef,
                    src: imageSrc,
                    alt: "Crop preview",
                    style: imageStyle,
                    onLoad: handleImageLoad,
                    onMouseDown: handleMouseDown,
                    draggable: false
                })
            ),
            
            React.createElement('div', { className: "mb-4" },
                React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" }, 
                    `Zoom: ${Math.round(imageScale / minScale * 100)}%`
                ),
                React.createElement('input', {
                    type: "range",
                    min: minScale,
                    max: minScale * 3,
                    step: minScale * 0.05,
                    value: imageScale,
                    onChange: handleScaleChange,
                    className: "w-full"
                })
            ),
            
            React.createElement('div', { className: "flex gap-3 justify-end" },
                React.createElement('button', {
                    onClick: onCancel,
                    className: "px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                }, "Cancel"),
                React.createElement('button', {
                    onClick: handleSave,
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                }, "Save")
            )
        )
    );
};

// Export to global scope
window.Components = window.Components || {};
window.Components.ImageCropper = ImageCropper;