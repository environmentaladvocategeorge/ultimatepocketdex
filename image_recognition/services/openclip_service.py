import requests
from typing import Dict, Any
from utils.logger import get_logger
from services.ssm_service import SSMService

logger = get_logger(__name__)

class OpenCLIPService:
    def __init__(self):
        ssm = SSMService()
        token = ssm.get_parameter("upd/dev/hf_token")
        self.api_url = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"
        self.headers = {"Authorization": f"Bearer {token}"}

    def get_image_embedding(self, image_bytes: bytes) -> Dict[str, Any]:
        try:
            logger.info("Sending image to HuggingFace OpenCLIP model.")
            response = requests.post(self.api_url, headers=self.headers, files={"file": image_bytes})
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as e:
            logger.error(f"HuggingFace request failed: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in OpenCLIPService: {str(e)}", exc_info=True)
            raise
