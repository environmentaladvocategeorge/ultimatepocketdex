import uuid

class UUIDGenerator:
    def __init__(self, namespace: str = None):
        if namespace:
            self.namespace = uuid.UUID(namespace)
        else:
            self.namespace = uuid.UUID("b7e8c7b6-2b1a-4e7a-9e2f-1a2b3c4d5e6f")

    def generate(self, name: str) -> uuid.UUID:
        """Generate a deterministic UUID from a string."""
        return uuid.uuid5(self.namespace, name)

    def to_str(self, uuid_obj: uuid.UUID) -> str:
        """Convert UUID object to string."""
        return str(uuid_obj)

    def from_str(self, uuid_str: str) -> uuid.UUID:
        """Convert string to UUID object."""
        return uuid.UUID(uuid_str)