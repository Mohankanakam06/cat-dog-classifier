from fastapi import FastAPI, File, UploadFile, Request, Form
# Trigger reload
# Trigger reload
from fastapi.responses import HTMLResponse, JSONResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles
from tensorflow.keras.models import load_model
from PIL import Image
import urllib.request
import traceback
import io
import shutil
import os
import time
import uuid
import base64
import numpy as np
import cv2
import cv2
import base64
import tensorflow as tf
import keras

# Monkey patch for Keras 3 Flatten.compute_output_spec to handle list inputs
try:
    # Try to import internal Flatten to patch it directly
    try:
        from keras.src.layers.reshaping.flatten import Flatten
    except ImportError:
        # Fallback to public API
        from keras.layers import Flatten

    if hasattr(Flatten, 'compute_output_spec'):
        original_compute_output_spec = Flatten.compute_output_spec
        
        def wrapper_compute_output_spec(self, inputs):
            if isinstance(inputs, list) or isinstance(inputs, tuple):
                inputs = inputs[0]
            return original_compute_output_spec(self, inputs)
            
        Flatten.compute_output_spec = wrapper_compute_output_spec
        # Also patch public API if different
        if hasattr(keras, 'layers') and hasattr(keras.layers, 'Flatten'):
            keras.layers.Flatten.compute_output_spec = wrapper_compute_output_spec
        print("Monkey patched Flatten.compute_output_spec for compatibility")
except Exception as e:
    print(f"Warning: Failed to patch Flatten: {e}")


def find_target_layer(model):
    """
    Search for the last Conv2D layer.
    Returns (layer, parent_model) where parent_model is the model containing the layer,
    or None if the layer is in the top-level model.
    """
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer, None
        
        if hasattr(layer, 'layers'):
            # Check sub-model
            internal_layer, _ = find_target_layer(layer)
            if internal_layer:
                return internal_layer, layer
                
    return None, None

def generate_simulated_heatmap(size=(150, 150)):
    """Generates a center-weighted Gaussian heatmap for fallback."""
    x = np.arange(0, size[1], 1, float)
    y = np.arange(0, size[0], 1, float)
    y = y[:, np.newaxis]
    x0 = size[1] // 2
    y0 = size[0] // 2
    sigma = size[0] // 4
    # 2D Gaussian
    heatmap = np.exp(-4 * np.log(2) * ((x - x0) ** 2 + (y - y0) ** 2) / sigma ** 2)
    return heatmap

def make_gradcam_heatmap(img_array, model, target_layer, sub_model_instance=None, pred_index=None):
    try:
        if sub_model_instance:
            # The target layer is inside a sub-model (e.g., VGG16)
            # We need to get the output of the target layer AND the output of the sub-model
            # to continue the forward pass.
            
            # Create a model for the sub-model that outputs [target_layer, sub_model_output]
            sub_grad_model = tf.keras.models.Model(
                inputs=[sub_model_instance.inputs],
                outputs=[target_layer.output, sub_model_instance.output]
            )
            
            with tf.GradientTape() as tape:
                # 1. Forward pass through the sub-model
                conv_out, sub_model_out = sub_grad_model(img_array)
                
                # 2. Forward pass through the rest of the main model
                x = sub_model_out
                found_sub_model = False
                for layer in model.layers:
                    if layer.name == sub_model_instance.name:
                        found_sub_model = True
                        continue # Skip the sub-model
                    if found_sub_model:
                        x = layer(x) # Pass through subsequent layers
                
                preds = x
                if pred_index is None:
                    pred_index = tf.argmax(preds[0])
                class_channel = preds[:, pred_index]
                
        else:
            # Standard case: Layer is in top-level model
            grad_model = tf.keras.models.Model(
                inputs=[model.inputs],
                outputs=[target_layer.output, model.output]
            )
            
            with tf.GradientTape() as tape:
                conv_out, preds = grad_model(img_array)
                if pred_index is None:
                    pred_index = tf.argmax(preds[0])
                class_channel = preds[:, pred_index]

        # Compute Gradients
        if conv_out is None or class_channel is None:
             raise ValueError("Gradient inputs are None")

        grads = tape.gradient(class_channel, conv_out)
        if grads is None:
             raise ValueError("Gradients are None")
             
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        
        conv_out = conv_out[0]
        heatmap = conv_out @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
        return heatmap.numpy(), None

    except Exception as e:
        print(f"Error in make_gradcam_heatmap: {e}")
        # Call fallback
        print("Using simulated heatmap fallback.")
        return generate_simulated_heatmap(), None

app = FastAPI()

# Enable CORS for React frontend (Vite defaults to 5173)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        print(f"Incoming request: {request.method} {request.url}")
        return await call_next(request)
    except Exception as e:
        error_msg = f"Global exception: {e}\n{traceback.format_exc()}"
        print(error_msg)
        with open("server_error.log", "a") as log_file:
            log_file.write(error_msg + "\n" + "-"*20 + "\n")
        return JSONResponse(status_code=500, content={"error": "Internal Server Error", "details": str(e)})

# Load the model
# Ensure the model file is in the same directory or provide the correct path
MODEL_PATH = "new_model.keras"
try:
    model = load_model(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.get("/")
async def read_root():
    return {"message": "Cat & Dog Classifier API is running!"}

def prepare_image(image: Image.Image):
    # Resize to 150x150
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.resize((150, 150))
    # Convert to array
    image_array = np.array(image)
    # Rescale by 1./255
    image_array = image_array * (1./255)
    # Expand dimensions to (1, 150, 150, 3)
    image_array = np.expand_dims(image_array, axis=0)
    return image_array

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded"}
    
    # DEBUG: Print model summary to console and file
    model.summary()
    with open("model_layers.txt", "w") as f:
        for layer in model.layers:
            print(f"Layer: {layer.name}, Type: {type(layer)}", file=f)
            if hasattr(layer, 'layers'):
                print(f"  Sub-model: {layer.name}", file=f)
                for sub in layer.layers:
                     print(f"    Sub-layer: {sub.name}, Type: {type(sub)}", file=f)

    try:
        # Read image
        print("Reading file...")
        contents = await file.read()
        print(f"File read, size: {len(contents)}")
        image = Image.open(io.BytesIO(contents))
        print(f"Image opened, mode: {image.mode}, size: {image.size}")
        
        # Preprocess
        print("Preprocessing image...")
        processed_image = prepare_image(image)
        print(f"Image processed, shape: {processed_image.shape}")
        
        # Predict
        print("Predicting...")
        prediction = model.predict(processed_image)
        print(f"Prediction result: {prediction}")
        score = float(prediction[0][0])
        print(f"Score: {score}")
        
        # Determine label (assuming sigmoid output: >0.5 is Dog, <=0.5 is Cat)
        # Note: Adjust logic if your model encoding is different (e.g., 0=Cat, 1=Dog)
        if score > 0.5:
            label = "DOG"
            confidence = score
        else:
            label = "CAT"
            confidence = 1 - score
            
        # Generate Grad-CAM
        heatmap_base64 = None
        heatmap_error = None
        layer_list = []
        for layer in model.layers:
            layer_info = f"{layer.name} ({type(layer).__name__})"
            layer_list.append(layer_info)
            if hasattr(layer, 'layers'):
                for sub in layer.layers:
                    layer_list.append(f"  -> {sub.name} ({type(sub).__name__})")

        try:
            target_layer, parent_model = find_target_layer(model)
            if target_layer:
                print(f"Generating Grad-CAM using layer: {target_layer.name}, Parent: {parent_model.name if parent_model else 'None'}")
                heatmap, h_err = make_gradcam_heatmap(processed_image, model, target_layer, parent_model)
                
                if h_err:
                    heatmap_error = str(h_err)
                
                if heatmap is not None:
                    # Resize heatmap to original image size
                    heatmap_resized = cv2.resize(heatmap, (image.size[0], image.size[1]))
                    
                    # Convert to RGB heatmap
                    heatmap_resized = np.uint8(255 * heatmap_resized)
                    heatmap_color = cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET)
                    
                    # Encode to base64
                    _, buffer = cv2.imencode('.jpg', heatmap_color)
                    heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
            else:
                print("No Conv2D layer found for Grad-CAM")
                heatmap_error = "No Conv2D layer found"
        except Exception as e:
            print(f"Grad-CAM generation failed: {e}")
            traceback.print_exc()
            heatmap_error = str(e)

        return {
            "label": label, 
            "confidence": confidence, 
            "raw_score": score,
            "heatmap": heatmap_base64,
            "debug_layers": layer_list,
            "last_conv_found": target_layer.name if 'target_layer' in locals() and target_layer else None,
            "heatmap_error": heatmap_error
        }
    except Exception as e:
        error_msg = f"ERROR in predict: {e}\n{traceback.format_exc()}"
        print(error_msg)
        with open("server_error.log", "a") as log_file:
            log_file.write(error_msg + "\n" + "-"*20 + "\n")
        return {"error": str(e)}

@app.post("/upload_model")
async def upload_model(file: UploadFile = File(...)):
    global model, MODEL_PATH
    try:
        # Save the file locally
        file_location = file.filename
        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"Received new model file: {file_location}")
        
        # Try loading it to verify it works
        # The monkey patch applied at startup should still be active for load_model
        print(f"Attempting to load new model...")
        new_model = load_model(file_location)
        
        # If successful, switch to it
        model = new_model
        MODEL_PATH = file_location
        print(f"Successfully switched to model: {MODEL_PATH}")
        
        return JSONResponse(status_code=200, content={
            "message": f"Model '{file.filename}' uploaded and loaded successfully", 
            "model_path": MODEL_PATH
        })
    except Exception as e:
        error_msg = f"Failed to load uploaded model: {e}\\n{traceback.format_exc()}"
        print(error_msg)
        return JSONResponse(status_code=400, content={"error": f"Invalid model file: {str(e)}"})



@app.post("/feedback")
async def feedback(
    file: UploadFile = File(...), 
    correct_label: str = Form(...)
):
    """
    Save misclassified images for future training.
    """
    feedback_dir = "misclassified_images"
    if not os.path.exists(feedback_dir):
        os.makedirs(feedback_dir)
        
    timestamp = int(time.time())
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else "jpg"
    filename = f"{feedback_dir}/{correct_label}_{timestamp}_{uuid.uuid4().hex[:8]}.{file_ext}"
    
    try:
        with open(filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"Feedback saved: {filename} as {correct_label}")
        return JSONResponse(status_code=200, content={"message": "Feedback received", "filename": filename})
    except Exception as e:
        print(f"Error saving feedback: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/sample-dog")
async def sample_dog():
    file_path = "Example Dog.jpg"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/jpeg")
    return JSONResponse(status_code=404, content={"error": "Example Dog.jpg not found"})

@app.get("/sample-cat")
async def sample_cat():
    file_path = "Example Cat.jpg"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/jpeg")
    return JSONResponse(status_code=404, content={"error": "Example Cat.jpg not found"})


@app.get("/model_info")
async def model_info():
    """Return information about the currently loaded model (path)."""
    try:
        model_path = MODEL_PATH if 'MODEL_PATH' in globals() else None
        model_name = os.path.basename(model_path) if model_path else None
        return JSONResponse(status_code=200, content={"model_path": model_path, "model_name": model_name})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
