from mongoengine import connect
import os
from dotenv import load_dotenv
from mongoengine import connect

load_dotenv()

def start_db():
    connect(
        db="taskdb",
        host=os.getenv("MONGO_URL"),
    )
