import logging
import json
import datetime
import contextvars
import re
import os
import gzip
from logging.handlers import TimedRotatingFileHandler
from app.config import get_settings

request_id_var = contextvars.ContextVar("request_id", default="-")

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.datetime.fromtimestamp(record.created, datetime.timezone.utc).isoformat(),
            "level": record.levelname,
            "service": record.name,
            "correlation_id": request_id_var.get(),
            "message": record.getMessage(),
        }
        
        # Add extra properties passed in 'extra' dict
        for key, value in record.__dict__.items():
            if key not in ["args", "asctime", "created", "exc_info", "exc_text", "filename", "funcName", "levelname", "levelno", "lineno", "module", "msecs", "message", "msg", "name", "pathname", "process", "processName", "relativeCreated", "stack_info", "thread", "threadName"]:
                log_record[key] = value

        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)

        raw_json = json.dumps(log_record)
        
        # Scrub secrets
        raw_json = re.sub(r'sk-[a-zA-Z0-9_\-]+', 'sk-***', raw_json)
        raw_json = re.sub(r'pk_[a-zA-Z0-9_\-]+', 'pk_***', raw_json)
        raw_json = re.sub(r'Bearer\s+[a-zA-Z0-9_\-\.]+', 'Bearer ***', raw_json)
        raw_json = re.sub(r'AIzaSy[a-zA-Z0-9_\-\.]+', 'AIzaSy***', raw_json)
        raw_json = re.sub(r'postgres(ql\+asyncpg)?://[^:]+:[^@]+@', 'postgresql://***:***@', raw_json)
        
        return raw_json

def namer(name):
    return name + ".gz"

def rotator(source, dest):
    try:
        with open(source, "rb") as f_in:
            with gzip.open(dest, "wb") as f_out:
                f_out.writelines(f_in)
        os.remove(source)
    except Exception:
        pass

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

_all_handler = None
def get_all_handler():
    global _all_handler
    if _all_handler is None:
        all_file = os.path.join(LOG_DIR, "all.log")
        _all_handler = TimedRotatingFileHandler(all_file, when="midnight", interval=1, backupCount=30)
        _all_handler.setFormatter(JSONFormatter())
        _all_handler.rotator = rotator
        _all_handler.namer = namer
    return _all_handler

def setup_logger(name, filename):
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
        
    logger.setLevel(level)
    logger.propagate = False
    
    formatter = JSONFormatter()
    
    # stdout stream
    sh = logging.StreamHandler()
    sh.setFormatter(formatter)
    logger.addHandler(sh)
    
    # specific concern file
    specific_file = os.path.join(LOG_DIR, filename)
    fh = TimedRotatingFileHandler(specific_file, when="midnight", interval=1, backupCount=30)
    fh.setFormatter(formatter)
    fh.rotator = rotator
    fh.namer = namer
    logger.addHandler(fh)
    
    # combined all.log file
    logger.addHandler(get_all_handler())
    
    return logger

app_logger = setup_logger("app", "app.log")
rag_logger = setup_logger("rag", "rag.log")
db_logger = setup_logger("db", "db.log")
chroma_logger = setup_logger("chroma", "chromadb.log")
