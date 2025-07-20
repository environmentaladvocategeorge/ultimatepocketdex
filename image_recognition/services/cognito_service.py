import os
from typing import Any
from fastapi import Request, HTTPException
from jose import jwt, JWTError
import requests
from alchemy_models.user import User
from utils.logger import get_logger

logger = get_logger(__name__)

class CognitoService:
    def __init__(self):
        self.COGNITO_USER_POOL_ID: str = os.getenv("COGNITO_USER_POOL_ID", "")
        self.COGNITO_APP_CLIENT_ID: str = os.getenv("COGNITO_APP_CLIENT_ID", "")
        self.COGNITO_REGION: str = os.getenv("AWS_REGION", "us-east-1")

        self.COGNITO_PUBLIC_KEYS_URL: str = (
            f"https://cognito-idp.{self.COGNITO_REGION}.amazonaws.com/"
            f"{self.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
        )

    def get_cognito_public_keys(self) -> list[dict[str, Any]]:
        """
        Fetches Cognito public keys used to validate JWT tokens.

        Returns:
            List[Dict[str, Any]]: A list of public keys retrieved from Cognito.
        """
        try:
            logger.info("Fetching Cognito public keys.")
            response = requests.get(self.COGNITO_PUBLIC_KEYS_URL)
            response.raise_for_status()
            logger.info("Cognito public keys successfully fetched.")
            return response.json()["keys"]
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching Cognito public keys: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Error fetching Cognito public keys: {str(e)}"
            )

    def decode_and_verify_token(self, token: str) -> dict[str, Any]:
        """
        Decodes and verifies the JWT token using the public keys from Cognito.

        Args:
            token (str): The JWT token to decode and verify.

        Returns:
            Dict[str, Any]: The payload of the verified token.
        """
        try:
            logger.info("Decoding and verifying token.")
            unverified_header = jwt.get_unverified_header(token)
            if unverified_header is None or "kid" not in unverified_header:
                logger.warning("Token kid not found in unverified header.")
                raise HTTPException(status_code=401, detail="Unable to find token kid.")

            public_keys = self.get_cognito_public_keys()

            rsa_key: dict[str, Any] = {}
            for key in public_keys:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"],
                    }
                    break

            if not rsa_key:
                logger.warning("Appropriate public key not found.")
                raise HTTPException(
                    status_code=401, detail="Unable to find appropriate public key."
                )

            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=self.COGNITO_APP_CLIENT_ID,
                issuer=f"https://cognito-idp.{self.COGNITO_REGION}.amazonaws.com/{self.COGNITO_USER_POOL_ID}",
            )
            logger.info("Token successfully decoded and verified.")
            return payload
        except JWTError as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise HTTPException(
                status_code=401, detail=f"Token verification failed: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error decoding token: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Error decoding token: {str(e)}"
            )

    async def extract_token(self, request: Request) -> User:
        """
        Extracts and validates JWT token from Authorization header to create a User object.
        
        Args:
            request (Request): FastAPI request containing the Authorization header.
        
        Returns:
            User: User object with data from token claims.
            
        Raises:
            HTTPException: When Authorization header is missing or token lacks required claims.
        """
        auth_header = request.headers.get("Authorization")
        if auth_header is None:
            logger.warning("Authorization header missing in the request.")
            raise HTTPException(status_code=400, detail="Authorization header missing")

        token = auth_header.split(" ")[1]
        logger.info("Extracting user information from token.")

        payload = self.decode_and_verify_token(token)

        user_id = payload.get("sub")
        if not user_id:
            logger.warning("User ID not found in token.")
            raise HTTPException(status_code=400, detail="User ID not found in token")
        
        user_name = payload.get("cognito:username")
        email_address = payload.get("email")
        
        logger.info(f"User information extracted: {user_id}, {user_name}, {email_address}")

        return User(
            user_id=user_id,
            user_name=user_name,
            email_address=email_address,
        )
