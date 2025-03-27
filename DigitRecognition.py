#Handwritten digit recognition Neural Network project
#Author: Sage Walsh Smith
#Source: MNIST Dataset
#https://www.tensorflow.org/datasets/catalog/mnist 
#TO DO:
#README.txt
#annotate - DONE
#build UI - FLASK app, "simple python app framework", django
#build widget for user to draw number - matplotlib (?)
#https://stackoverflow.com/questions/3347483/writing-a-paint-program-%C3%A0-la-ms-paint-how-to-interpolate-between-mouse-move-ev
#create an image from a canvas html element in javascript and pass it to django to analyze it
#https://www.reddit.com/r/flask/comments/z3q6ps/creating_an_image_from_a_canvas_element_in_js_and/
# https://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/
# https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
# 
# github
#website



 #import libraries:
#import libraries:
# numpy - array manipulation / mathematical functions.
# opencv-python - Computer Vision: load, process, and handle image files.
# matplotlib - visualizing the images and predictions.
# tensorflow - machine learning library: building and training the neural network model.
import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf

# Load MNIST dataset from Keras, a deep learning framework built on top of TensorFlow
mnist = tf.keras.datasets.mnist
#split data -> training data, testing data

#x:pixel data, y:classification
(x_train, y_train), (x_test, y_test) = mnist.load_data()

# Normalize the pixel data to scale the values between 0 and 1 for better training convergence.
# Each pixel value originally ranges from 0 to 255, and this step divides each pixel by 255 to normalize it.
x_train = tf.keras.utils.normalize(x_train, axis=1)
x_train = tf.keras.utils.normalize(x_train, axis=1)
x_test = tf.keras.utils.normalize(x_test, axis =1)

# Create a neural network model using Keras' Sequential API, where layers are stacked sequentially.
model = tf.keras.models.Sequential()
#add layers to the model
#transform image pixel "grid" to a "line"
#28x28 pixel grid -> 784x1 vector
#necessary bc dense layers need "1D" input
model.add(tf.keras.layers.Flatten(input_shape=(28, 28)))
#Add 2 fully connected Dense layer with 128 neurons and ReLU (Rectified Linear Unit) activation function.
#ReLU helps introduce non-linearity, allowing the network to learn more complex patterns.
model.add(tf.keras.layers.Dense(128, activation='relu'))
model.add(tf.keras.layers.Dense(128, activation='relu'))
#output layer - these layers represent the digits 0-9
#Softmax converts the output values into a probability distribution, where the sum of the outputs is 1.
model.add(tf.keras.layers.Dense(10, activation='softmax'))

#compile the model
# - 'adam' optimizer is used for efficient gradient descent.
# - 'sparse_categorical_crossentropy' loss function is appropriate for multi-class classification problems with integer labels.
# - 'accuracy' metric tracks the model's performance during training.
model.compile(optimizer = 'adam',
               loss='sparse_categorical_crossentropy',
                 metrics=['accuracy'])

#train the model -> call fit() and pass the training data
#train model for 3 epochs/iterations
model.fit(x_train, y_train, epochs=3)

#save the model, we can save a specific iteration
#of the model that we have trained
#this allows us to reuse the model without retraining it
model.save('handwritten.keras')

#load saved model
model = tf.keras.models.load_model('handwritten.keras')

#return values(for model evaluation):
#loss, accuracy = model.evaluate(x_test, y_test)
#print(loss)
#print(accuracy)

#build a function that lets the model iterate through
#our own handwritten digits
#initialize variable image_number
image_number = 1
#"While there is a file at the following path..."
while os.path.isfile(f"Digits/Digit{image_number}.png"):
    #read the file
    #[:,:,0] -> we are only reading the grayscale value
    img = cv2.imread(f"Digits/Digit{image_number}.png")[:,:,0]
    #invert the file (since MNIST images are white on black, and we want black on white) 
    # & convert it to an array
    img = np.invert(np.array([img]))
    #predict the number
    prediction = model.predict(img)
    #print output
    print(f"This digit is probably a {np.argmax(prediction)}")
    print(image_number)
    #show png
    plt.imshow(img[0],cmap=plt.cm.binary)
    plt.show()
    #advance to next iteration
    image_number += 1


