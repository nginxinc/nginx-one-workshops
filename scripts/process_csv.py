import csv
# import requests

# Constants
CSV_FILE = "./registrants_original.csv"  # Replace with your CSV file path
API_URL = "https://example.com/api"  # Replace with the actual API endpoint
HEADERS = {"Content-Type": "application/json"}  # Adjust headers as needed

# Function to make API call
def make_api_call(firstname, lastname, email):
    payload = {
        "firstname": firstname,
        "lastname": lastname,
        "email": email
    }
    try:
        response = requests.post(API_URL, json=payload, headers=HEADERS)
        if response.status_code == 200:
            print(f"Success: {firstname} {lastname} - {email}")
        else:
            print(f"Failed: {firstname} {lastname} - {email} | Status: {response.status_code} | Response: {response.text}")
    except requests.RequestException as e:
        print(f"Error: {firstname} {lastname} - {email} | {e}")

# Read CSV and process each row
def process_csv(file_path):
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # make_api_call(row["Buyer first name"], row["Buyer last name"], row["Buyer email"])
            print(f"Firstname: {row["Buyer first name"]} Lastname: {row["Buyer last name"]} Email: {row["Buyer email"]}")

if __name__ == "__main__":
    process_csv(CSV_FILE)