import logging
from uvicorn.config import LOGGING_CONFIG
import uvicorn
import sys
import os

class CustomFormatter(logging.Formatter):
    def format(self, record):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        record.pathname = os.path.relpath(record.pathname, base_dir)
        return super().format(record)

def get_logger(name: str = __name__):
    logger = logging.getLogger(name)
    handler = logging.StreamHandler(sys.stdout)
    formatter = CustomFormatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(pathname)s:%(lineno)d]"
    )
    handler.setFormatter(formatter)
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
    return logger

LOGGING_CONFIG["loggers"]['uvicorn']["handlers"] = ["console"]
LOGGING_CONFIG["loggers"]['uvicorn.error']["handlers"] = ["console"]
LOGGING_CONFIG["loggers"]['uvicorn.access']["handlers"] = ["console"]