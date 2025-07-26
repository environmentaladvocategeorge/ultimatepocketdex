import json
import base64
import io
from PIL import Image
import torch
from transformers import CLIPModel, CLIPProcessor

# Load model and processor at container startup
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")


def model_fn(model_dir):
    """
    SageMaker loads the model here. We already load CLIP globally.
    """
    return model


def input_fn(request_body, content_type):
    """
    Preprocess the input data.
    Accepts:
      - Raw bytes with content_type image/jpeg or image/png
      - JSON with { "image": "<base64>" }
    """
    if content_type in ["image/jpeg", "image/png", "application/x-image"]:
        # Raw image bytes
        image = Image.open(io.BytesIO(request_body)).convert("RGB")
    elif content_type == "application/json":
        data = json.loads(request_body)
        base64_image = data.get("image")
        if not base64_image:
            raise ValueError("Missing 'image' field in input JSON.")
        image_bytes = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    else:
        raise ValueError(f"Unsupported content type: {content_type}")

    inputs = processor(images=image, return_tensors="pt")
    return inputs


def predict_fn(inputs, model):
    """
    Generate embeddings using CLIP.
    """
    with torch.no_grad():
        embeddings = model.get_image_features(**inputs)
    return embeddings.cpu().numpy().tolist()


def output_fn(prediction, accept):
    """
    Format the output as JSON.
    """
    return json.dumps({"embeddings": prediction})
