document.addEventListener('DOMContentLoaded', () => {
    const IMGUR_API_KEY = 'b9916da09c29c84948d2b8336eea2250';
    const imageUrlContainer = document.getElementById('imageUrlContainer');
    const imageUrlField = document.getElementById('imageUrlField');
    const uploadButton = document.getElementById('uploadButton');
    const fileUpload = document.getElementById('fileUpload');
    const cameraButton = document.getElementById('cameraButton');
    const captureButton = document.getElementById('captureButton');
    const cameraFeed = document.getElementById('cameraFeed');
    const photoCanvas = document.getElementById('photoCanvas');
    const displayedImage = document.getElementById('displayedImage');

    let currentStream = null;

    // --- Upload Photo Logic ---
    uploadButton.addEventListener('click', () => {
        fileUpload.click(); // Trigger hidden file input
    });

    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                displayedImage.src = e.target.result;
                displayedImage.style.display = 'block';
                uploadImageToBackend(e.target.result);
                cameraFeed.style.display = 'none';
                captureButton.style.display = 'none';
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                    currentStream = null;
                }
            }
            reader.readAsDataURL(file);
        }
    });

    // --- Camera Access Logic ---
    cameraButton.addEventListener('click', async () => {
        if (currentStream) { // If stream exists, stop it
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        try {
            currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraFeed.srcObject = currentStream;
            cameraFeed.style.display = 'block';
            captureButton.style.display = 'block';
            displayedImage.style.display = 'none';
            displayedImage.src = "#"; // Reset image src
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access the camera. Please ensure permission is granted and no other application is using it.");
        }
    });

    // --- Photo Capture Logic ---
    captureButton.addEventListener('click', () => {
        if (currentStream) {
            const context = photoCanvas.getContext('2d');
            // Set canvas dimensions to match video stream
            photoCanvas.width = cameraFeed.videoWidth;
            photoCanvas.height = cameraFeed.videoHeight;

            // Draw the current video frame onto the canvas
            context.drawImage(cameraFeed, 0, 0, photoCanvas.width, photoCanvas.height);

            // Convert canvas to image data URL
            const imageDataURL = photoCanvas.toDataURL('image/png');
            displayedImage.src = imageDataURL;
            displayedImage.style.display = 'block';
            uploadImageToBackend(imageDataURL);

            // Stop the camera stream and hide camera elements
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
            cameraFeed.style.display = 'none';
            captureButton.style.display = 'none';
        }
    });

    async function uploadImageToBackend(imageDataUrl) {
        // Reset and hide the URL field initially
        imageUrlField.value = '';
        imageUrlContainer.style.display = 'none';

        const base64ImageData = imageDataUrl.split(',')[1]; // Get Base64 part
        if (!base64ImageData) {
            console.error('Could not extract Base64 data from image URL.');
            alert('Failed to process image data for upload.');
            return;
        }

        const formData = new FormData();
        formData.append('key', IMGUR_API_KEY);
        formData.append('image', base64ImageData);

        try {
            const response = await fetch('https://api.imgbb.com/1/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // Try to get more details from the response body if possible
                let errorInfo = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorInfo += `, Message: ${errorData.error?.message || JSON.stringify(errorData.error)}`;
                } catch (e) {
                    // Ignore if response is not JSON or other error
                }
                throw new Error(errorInfo);
            }

            const result = await response.json();

            if (result.success && result.data && result.data.url) {
                imageUrlField.value = result.data.url;
                imageUrlContainer.style.display = 'block';
            } else {
                console.error('API response error:', result);
                let errorMessage = 'Image upload failed. The API did not return a success status or URL.';
                if (result.error && result.error.message) {
                    errorMessage += ` API Error: ${result.error.message}`;
                } else if (result.status_txt) {
                    errorMessage += ` API Status: ${result.status_txt}`;
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert(`Error uploading image: ${error.message}. Check the console for more details.`);
        }
    }
});
