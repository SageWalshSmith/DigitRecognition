#in terminal:
#>python DigRecApp.py to start
#CTRL + C to stop
import os
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify, render_template
from tensorflow.keras.preprocessing import image
import io
import base64

# Initialize the Flask application
app = Flask(__name__)

# Define the path for saving uploaded files (if you want to save them)
#UPLOAD_FOLDER = 'uploads'  # You can set any folder here where you want to save the uploaded files
#app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
#if not os.path.exists(UPLOAD_FOLDER):
#    os.makedirs(UPLOAD_FOLDER)

# call previously saved model
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
    # Check if 'file' is in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400  # If no file is uploaded
    
    file = request.files['file']

    # If no file is selected, return an error
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        #process user submitted image to be read by the model:
        # Convert the uploaded file into a file-like object using BytesIO
        img = image.load_img(io.BytesIO(file.read()), target_size=(28, 28), color_mode='grayscale')  # Convert FileStorage to BytesIO

        # Convert the image to a numpy array
        img_array = image.img_to_array(img)

        # Convert to integer type for inversion
        img_array = img_array.astype(np.uint8)

        # Invert the image (white becomes black and vice versa)
        img_array = np.invert(img_array)

        # Add an extra dimension to simulate a batch of size 1 (model expects this)
        img_array = np.expand_dims(img_array, axis=0)

        # Normalize the image (scale pixel values between 0 and 1)
        img_array = img_array / 255.0

        # Make a prediction with the model
        prediction = model.predict(img_array)
        
        # Get the predicted digit (most probable digit)
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