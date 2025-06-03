document.addEventListener('DOMContentLoaded', () => {
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

            // Stop the camera stream and hide camera elements
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
            cameraFeed.style.display = 'none';
            captureButton.style.display = 'none';
        }
    });
});
