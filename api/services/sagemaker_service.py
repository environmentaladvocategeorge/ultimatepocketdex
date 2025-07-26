import base64
import json
import os
import re
import boto3
import io
from PIL import Image
from utils.logger import get_logger

logger = get_logger(__name__)


class SageMakerService:
    def __init__(self, region_name: str = "us-east-1"):
        self.sagemaker_runtime = boto3.client("sagemaker-runtime", region_name=region_name)
        self.endpoint_name = os.environ.get("SAGEMAKER_ENDPOINT")
        if not self.endpoint_name:
            raise ValueError("SAGEMAKER_ENDPOINT environment variable is not set.")

    def get_image_embeddings(self, base64_image: str):
        if not base64_image:
            logger.error("No image data provided.")
            raise ValueError("No image data provided.")

        base64_str = re.sub(r"^data:image/\w+;base64,", "", base64_image)

        try:
            image_bytes = base64.b64decode(base64_str)
        except Exception as decode_err:
            logger.error(f"Failed to decode base64 image: {decode_err}")
            raise ValueError("Invalid base64 image data.")

        try:
            Image.open(io.BytesIO(image_bytes)).verify()
        except Exception as img_err:
            logger.error(f"Uploaded base64 is not a valid image: {img_err}")
            raise ValueError("Uploaded data is not a valid image.")
        
        try:
            logger.info(f"Sending {len(image_bytes)} bytes to SageMaker endpoint '{self.endpoint_name}'.")
            response = self.sagemaker_runtime.invoke_endpoint(
                EndpointName=self.endpoint_name,
                ContentType="image/jpeg",
                Body=image_bytes
            )
            raw_result = response["Body"].read()
            logger.info(f"Received SageMaker response ({len(raw_result)} bytes).")

            try:
                result = json.loads(raw_result.decode("utf-8"))
                embeddings = result.get("embeddings")[0]
            except json.JSONDecodeError as json_err:
                logger.error(f"Failed to parse SageMaker response as JSON: {json_err}")
                raise RuntimeError("Invalid response from model.")

            return embeddings
        except Exception as e:
            logger.error(f"SageMaker inference error: {e}")
            raise RuntimeError("Error invoking SageMaker endpoint.")
