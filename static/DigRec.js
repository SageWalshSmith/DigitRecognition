document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const clearButton = document.getElementById('clear-canvas');
    const submitButton = document.getElementById('submit-drawing');
    const accuracyDisplay = document.getElementById('accuracy');
    const uploadForm = document.getElementById('upload-form');
    let correctPredictions = 0;
    let totalPredictions = 0;
    const gridSize = 28; // 28x28 grid

    let drawing = false;

    // Create the 28x28 grid of cells
    const cells = [];
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.addEventListener('mousedown', (e) => startDrawing(e, cell));
            cell.addEventListener('mousemove', (e) => drawOnCell(e, cell));
            gridContainer.appendChild(cell);
            cells.push(cell);
        }
    }

    // Start drawing when mouse is pressed down
    function startDrawing(e, cell) {
        if (e.buttons === 1 || e.type === "mousedown") {  // Left mouse button
            drawing = true;
            drawOnCell(e, cell);
        }
    }

    // Draw on the cell (or cells) when the mouse moves over
    function drawOnCell(e, cell) {
        if (drawing) {
            const target = e.target;
            target.classList.add('drawn');
            target.style.backgroundColor = '#00ff00'; // Green for retro look // Apply 'drawn' class for white color
        }
    }

    // Stop drawing when mouse is released
    document.addEventListener('mouseup', () => {
        drawing = false;
    });

    // Clear the grid
    clearButton.addEventListener('click', () => {
        cells.forEach(cell => {
            cell.classList.remove('drawn');  // Clear all drawings
            cell.style.backgroundColor = 'black'; // Reset to black background
        });
    });

    

    // Get the 28x28 grid data (black/white pixel values)
    function getGridData() {
        const gridData = [];
        cells.forEach(cell => {
            gridData.push(cell.classList.contains('drawn') ? 1 : 0);
        });
        return gridData;
    }

    // Convert the grid data to a base64 image format
    function convertGridToBase64(gridData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const cellSize = 10;
    
        canvas.width = gridSize * cellSize;
        canvas.height = gridSize * cellSize;
    
        // Fill canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        // Draw digit (black pixels)
        gridData.forEach((value, index) => {
            const x = (index % gridSize) * cellSize;
            const y = Math.floor(index / gridSize) * cellSize;
    
            if (value === 1) {
                ctx.fillStyle = 'black'; // Digit is drawn in black
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        });
    
        return canvas.toDataURL('image/png').split(',')[1];
    }
    submitButton.addEventListener('click', async () => {
        const gridData = getGridData();
        const base64Image = convertGridToBase64(gridData);
    
        // 🔍 Set the model input preview
        //const previewImg = document.getElementById('model-preview');
        //previewImg.src = `data:image/png;base64,${base64Image}`;
    
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, type: 'canvas' })
        });
    
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById('prediction').textContent = `Predicted Digit: ${data.predicted_digit}`;
            document.getElementById('confidence').textContent = `${(data.confidence * 100).toFixed(2)}%`;
    
            addHistoryItem(data.predicted_digit, data.confidence, base64Image, data.predicted_digit);
        }
    });
    // Add history item to the history section
    function addHistoryItem(predictedDigit, confidence, imgBase64, correctDigit) {
        const historyContainer = document.getElementById('history-container');
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
    
        // Create a canvas to transform the image colors
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = function () {
            // Set the canvas size to match the image size
            canvas.width = img.width;
            canvas.height = img.height;
    
            // Draw the image onto the canvas
            ctx.drawImage(img, 0, 0);
    
            // Get the image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
    
            // Loop through all pixels and modify the colors
            for (let i = 0; i < data.length; i += 4) {
                // If the pixel is white (255, 255, 255), change it to green (0, 255, 0)
                if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
                    data[i] = 0; // Red (0)
                    data[i + 1] = 0; // Green (255)
                    data[i + 2] = 0; // Blue (0)
                } else if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
                    // If the pixel is black (0, 0, 0), keep it black
                    data[i] = 0;
                    data[i + 1] = 255;
                    data[i + 2] = 0;
                }
            }
    
            // Put the modified image data back onto the canvas
            ctx.putImageData(imageData, 0, 0);
    
            // Create a new image element for the modified image
            const modifiedImg = document.createElement('img');
            modifiedImg.src = canvas.toDataURL(); // Set the source to the new canvas data URL
    
            // Append the modified image to the history item
            historyItem.appendChild(modifiedImg);
        };
    
        // Set the image source (base64 encoded image)
        img.src = `data:image/png;base64,${imgBase64}`;
    
        // Add the prediction text to the history item
        const text = document.createElement('p');
        text.textContent = `Predicted: ${predictedDigit}, Confidence: ${(confidence * 100).toFixed(2)}%`;
    
        // Add checkbox for marking the prediction as correct
        const checkboxLabel = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
            updateAccuracy();
        });
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(' Correct prediction'));
    
        historyItem.appendChild(text);
        historyItem.appendChild(checkboxLabel);
        historyContainer.prepend(historyItem);
    
        // Update the total predictions count
        totalPredictions++;
    
        // Update the accuracy display
        updateAccuracy();
    }

    // Update the model's accuracy
    function updateAccuracy() {
        const historyItems = document.querySelectorAll('.history-item');
        let checkedItems = 0;

        historyItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox.checked) {
                checkedItems++;
            }
        });

        // Calculate the accuracy as the number of checked items / total items
        const accuracy = historyItems.length > 0 ? (checkedItems / historyItems.length) * 100 : 0;
        accuracyDisplay.textContent = `Model Accuracy: ${accuracy.toFixed(2)}%`;
    }

    // Handle image upload
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the form from refreshing the page

        const fileInput = document.getElementById('file');
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            // Update UI with the prediction and confidence
            document.getElementById('prediction').textContent = `Predicted Digit: ${data.predicted_digit}`;
            document.getElementById('confidence').textContent = `${(data.confidence * 100).toFixed(2)}%`;

            // Add the uploaded image to history
            addHistoryItem(data.predicted_digit, data.confidence, data.image, data.predicted_digit);
        }
    });
});