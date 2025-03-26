#in terminal:
#>python DigRecApp.py to start
#CTRL + C to stop
from flask import Flask, request, jsonify, render_template
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import io
import base64
from PIL import Image
import os

# Initialize the Flask application
app = Flask(__name__)

# Load your pre-trained model
model_path = 'handwritten.keras'
if not os.path.exists(model_path):
    raise ValueError(f"Model file not found: {model_path}")
model = tf.keras.models.load_model(model_path)  # Load the model

# Home route - renders a simple form for image upload
@app.route('/')
def home():
    return render_template('DigRecIndex.html')  # Render the HTML form for image upload

# Predict route - handles image upload and prediction
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if the image is coming from canvas or file upload
        if request.content_type == 'application/json':
            data = request.get_json()
            base64_image = data['image']
            img_type = data.get('type', 'file')
            
            if img_type == 'canvas':
                img_data = base64.b64decode(base64_image)
                img = Image.open(io.BytesIO(img_data))
                img = img.convert('L')  # Convert to grayscale
                img = img.resize((28, 28))  # Resize to 28x28 pixels
            else:
                raise ValueError("Unknown image type")
        elif 'file' in request.files:
            file = request.files['file']
            img = Image.open(file)
            img = img.convert('L')  # Convert to grayscale
            img = img.resize((28, 28))  # Resize to 28x28 pixels
        
        # Convert the image to a numpy array
        img_array = np.array(img)

        # Invert the colors (white becomes black and vice versa)
        img_array = 255 - img_array  # Invert image (white becomes black and vice versa)

        # Normalize the image (scale pixel values between 0 and 1)
        img_array = img_array.astype(np.float32) / 255.0

        # Reshape to (1, 28, 28, 1) to match the model input shape
        img_array = np.expand_dims(img_array, axis=-1)  # Add the channel dimension (grayscale)
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension

        # Make prediction with the model
        prediction = model.predict(img_array)
        predicted_digit = np.argmax(prediction)

        # Convert the image to base64 for displaying in the HTML page
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # Return the prediction as JSON, including the base64 image string
        return jsonify({
            "predicted_digit": int(predicted_digit),
            "confidence": float(np.max(prediction)),  # Confidence level
            "image": img_str  # Base64-encoded image to display on the frontend
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500  # If any error occurs, return it in JSON format

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)