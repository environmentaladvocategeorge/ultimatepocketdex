import boto3

class SSMService:
    def __init__(self, region_name: str = "us-east-1"):
        self.client = boto3.client("ssm", region_name=region_name)

    def get_parameter(self, name: str, with_decryption: bool = True) -> str:
        try:
            response = self.client.get_parameter(
                Name=name,
                WithDecryption=with_decryption
            )
            return response["Parameter"]["Value"]
        except Exception as e:
            raise RuntimeError(f"Error retrieving SSM parameter '{name}': {str(e)}") from e
