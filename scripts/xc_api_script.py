import csv
import os
import sys

try:
    import requests
except ImportError:
    print("The 'requests' library is not installed. Please install it using 'pip install requests'.")
    sys.exit(1)

# Constants
CSV_FILE = "input.csv"
ADHOC_FILE= "adhoc.csv"
REPORT_FILE= "report.csv"
ADD_API_URL = "https://nginx-busdev.console.ves.volterra.io/api/web/custom/namespaces/system/user_roles"
DELETE_API_URL = "https://nginx-busdev.console.ves.volterra.io/api/web/custom/namespaces/system/users/cascade_delete"

REQUEST = os.getenv("REQUEST", "ADD").upper()
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer APIToken {os.getenv('AUTH_TOKEN', 'your_token_here')}"
}
MODE = os.getenv("MODE", "multiple").lower()

# Function to make API call
def make_api_call(firstname, lastname, email):
    payload = {
        "name": email,  
        "email": email,
        "first_name": firstname,
        "last_name": lastname,
        "group_names": [
            "workshop-usergroup"
        ],
        "idm_type": "VOLTERRA_MANAGED"
    }

    delete_payload = {
        "email": email
    }
    try:
        if REQUEST == "ADD":
            response = requests.post(ADD_API_URL, json=payload, headers=HEADERS)
        elif REQUEST == "UPDATE":
            response = requests.put(ADD_API_URL, json=payload, headers=HEADERS)
        elif REQUEST == "DELETE":
            response = requests.post(DELETE_API_URL, json=delete_payload, headers=HEADERS)
        else:
            print(f"Unsupported request method: {REQUEST}")
            return

        if response.status_code in [200, 201]:
            print(f"Success ({REQUEST}): {firstname} {lastname} - {email}")
        else:
            print(f"Failed ({REQUEST}): {firstname} {lastname} - {email} | Status: {response.status_code} | Response: {response.text}")
    except requests.RequestException as e:
        print(f"Error ({REQUEST}): {firstname} {lastname} - {email} | {e}")

# Function to process CSV
def process_csv(file_path):
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            make_api_call(row['Buyer first name'], row['Buyer last name'], row['Buyer email'])
            # print(f"Firstname: {row['Buyer first name']} Lastname: {row['Buyer last name']} Email: {row['Buyer email']}")

# Function to process Adhoc CSV
def process_adhoc_csv(file_path):
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            make_api_call("user", "user", row['Buyer email'])
            # print(f"Firstname: user Lastname: user Email: {row['Buyer email']}")

# Function to handle single user from environment variables
def process_single_user():
    firstname = os.getenv("FIRSTNAME")
    lastname = os.getenv("LASTNAME")
    email = os.getenv("EMAIL")
    if not firstname or not lastname or not email:
        print("Missing FIRSTNAME, LASTNAME or EMAIL environment variables for single user addition.")
        sys.exit(1)
    make_api_call(firstname, lastname, email)

# Function to test max users that can be added/deleted
def test_max_users():
    for i in range(20):
        email = "s.jobs+" + str(i) + "@sjobs.com"
        print(f"Test Email{i}: {email}")
        # make_api_call("user","user",email)

# Function to report users login status
def report_users_login_status(file_path):
    try:
        response = requests.get(ADD_API_URL,headers=HEADERS)
        response.raise_for_status()
        
        data = response.json()

        users = data.get("items", [])

        if not isinstance(users, list):
            print("Unexpected format: 'items' should be a list.")
            return
        
        processed_data = []

        for user in users:
            groups = user.get("group_names", [])
            
            # Only include users in the "workshop-usergroup"
            # if "workshop-usergroup" not in groups:
            #     continue

            firstname = user.get("first_name", "")
            lastname = user.get("last_name", "")
            email = user.get("email", "")
            last_login = user.get("last_login_timestamp", "")

            logged_in = "yes" if last_login else "no"

            processed_data.append({
                "first_name": firstname,
                "last_name": lastname,
                "email": email,
                "last_login_timestamp": last_login,
                "Logged in?": logged_in
            })

            if processed_data:
                headers = ["first_name", "last_name", "email", "last_login_timestamp", "Logged in?"]

                with open(file_path, "w", newline="", encoding="utf-8") as csvfile:
                    writer = csv.DictWriter(csvfile, fieldnames=headers)
                    writer.writeheader()
                    writer.writerows(processed_data)

                print(f"Filtered CSV written to {file_path}")

            else:
                print("No users matched the group filter.")

    except requests.RequestException as e:
        print(f"API request Error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    if MODE == "single":
        process_single_user()
    elif MODE == "multiple":
        process_csv(CSV_FILE)
    elif MODE == "adhoc":
        process_adhoc_csv(ADHOC_FILE)
    elif MODE == "test":
        test_max_users()
    elif MODE == "report":
        report_users_login_status(REPORT_FILE)
    else:
        print("Invalid MODE specified. Use 'single', 'multiple', 'adhoc', 'test' or 'report'.")
