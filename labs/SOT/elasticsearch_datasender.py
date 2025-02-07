import os
import time
import random
from datetime import datetime, timezone
from elasticsearch import Elasticsearch

# Get Elasticsearch connection details from environment variables
ELASTICSEARCH_HOST = os.getenv("ELASTICSEARCH_HOST", "13.89.102.212")
ELASTICSEARCH_PORT = int(os.getenv("ELASTICSEARCH_PORT", 9200))
ELASTICSEARCH_USERNAME = os.getenv("ELASTICSEARCH_USERNAME", "filebeat")
ELASTICSEARCH_PASSWORD = os.getenv("ELASTICSEARCH_PASSWORD", "<pswd>")
INDEX_NAME = "dummy-data"

es1 = Elasticsearch(
    [
        {
            'host': ELASTICSEARCH_HOST,
            'port': ELASTICSEARCH_PORT,
            'scheme': 'http'  # Change to 'https' if SSL is enabled
        }
    ],
    basic_auth=(ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD)
)

def generate_dummy_data():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "value": random.randint(1, 100),
        "status": random.choice(["OK", "WARN", "ERROR"])
    }

def send_data_to_elasticsearch():
    while True:
        data = generate_dummy_data()
        response = es.index(index=INDEX_NAME, document=data)
        print(f"Sent data: {data}, Response: {response['result']}")
        time.sleep(10)  # Send data every 10 seconds

if __name__ == "__main__":
    send_data_to_elasticsearch()