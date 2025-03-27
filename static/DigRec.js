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
            target.style.backgroundColor = 'black'; // Simulate drawing with black color
        }
    }

    // Stop drawing when mouse is released
    document.addEventListener('mouseup', () => {
        drawing = false;
    });

    // Clear the grid
    clearButton.addEventListener('click', () => {
        cells.forEach(cell => {
            cell.style.backgroundColor = 'white';  // Reset all cells to white
        });
    });

    // Submit the drawing
    submitButton.addEventListener('click', async () => {
        const gridData = getGridData();
        const base64Image = convertGridToBase64(gridData);

        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, type: 'canvas' }) // Change to 'canvas'
        });

        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            // Update UI with the prediction and confidence
            document.getElementById('prediction').textContent = `Predicted Digit: ${data.predicted_digit}`;
            document.getElementById('confidence').textContent = `${(data.confidence * 100).toFixed(2)}%`;

            // Add the new submission to the history
            addHistoryItem(data.predicted_digit, data.confidence, base64Image, data.predicted_digit);
        }
    });

    // Get the 28x28 grid data (black/white pixel values)
    function getGridData() {
        const gridData = [];
        cells.forEach(cell => {
            gridData.push(cell.style.backgroundColor === 'black' ? 1 : 0);
        });
        return gridData;
    }

    // Convert the grid data to a base64 image format
    function convertGridToBase64(gridData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const cellSize = 10;  // Each grid cell is a 10x10 pixel block

        canvas.width = gridSize * cellSize;
        canvas.height = gridSize * cellSize;

        // Fill in the canvas with the grid data (black or white cells)
        gridData.forEach((value, index) => {
            const x = (index % gridSize) * cellSize;
            const y = Math.floor(index / gridSize) * cellSize;

            ctx.fillStyle = value === 1 ? 'black' : 'white';
            ctx.fillRect(x, y, cellSize, cellSize);
        });

        return canvas.toDataURL('image/png').split(',')[1]; // Return base64 string (without the header part)
    }

    // Add history item to the history section
    function addHistoryItem(predictedDigit, confidence, imgBase64, correctDigit) {
        const historyContainer = document.getElementById('history-container');
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');

        const img = document.createElement('img');
        img.src = `data:image/png;base64,${imgBase64}`;
        historyItem.appendChild(img);

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