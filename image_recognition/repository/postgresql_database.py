import os
import importlib
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from alchemy_models import Base

class PostgresDatabase:
    def __init__(self, host, database, user, password, port=5432):
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.port = port

        connection_string = f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"
        self.engine = create_engine(connection_string)
        session_factory = sessionmaker(bind=self.engine)
        self.Session = scoped_session(session_factory)

    def init_db(self):
        """Import models dynamically and create tables"""
        self._import_models()
        Base.metadata.create_all(self.engine)

    def _import_models(self):
        """Dynamically import all model files from alchemy_models"""
        repo_dir = os.path.dirname(__file__)
        alchemy_models_dir = os.path.join(repo_dir, '..', 'alchemy_models')
        sys.path.append(alchemy_models_dir)

        for filename in os.listdir(alchemy_models_dir):
            if filename.endswith(".py") and filename != "__init__.py":
                module_name = f"alchemy_models.{filename[:-3]}" 
                importlib.import_module(module_name)
    
    def get_session(self):
        """Return a database session"""
        return self.Session()