from pinecone import Pinecone, ServerlessSpec
from .ssm_service import SSMService

class PineconeService:
    def __init__(self, index_name, api_key_path, region_name: str = "us-east-1"):
        self.index_name = index_name
        self.ssm_service = SSMService(region_name=region_name)

        self.api_key = self.ssm_service.get_parameter(api_key_path)
        if not self.api_key:
            raise RuntimeError("Pinecone API key could not be retrieved from SSM.")

        self.pc = Pinecone(api_key=self.api_key)
        self._ensure_index()

    def _ensure_index(self):
        existing_indexes = self.pc.list_indexes().names()
        if self.index_name not in existing_indexes:
            self.pc.create_index(
                name=self.index_name,
                dimension=512,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
    
    def verify(self):
        try:
            self.get_index().describe_index_stats()
        except Exception as e:
            raise RuntimeError(f"Failed to verify Pinecone index '{self.index_name}': {str(e)}")

    def get_index(self):
        return self.pc.Index(self.index_name)
    
    def query_index(self, embeddings: list[float], k: int = 10):
        if not isinstance(embeddings, list) or not embeddings:
            raise ValueError("Embeddings must be a non-empty list of floats.")
        
        index = self.get_index()
        response = index.query(vector=embeddings, top_k=k, include_metadata=True)
        return response
