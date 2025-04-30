import requests
import time
import hmac
import hashlib
import os

API_KEY = os.getenv("BINANCE_API_KEY")
SECRET_KEY = os.getenv("BINANCE_HMAC_KEY")

base_url = "https://api.binance.com"
endpoint = "/sapi/v1/capital/deposit/hisrec"

# Step 1: Create query string with timestamp
timestamp = int(time.time() * 1000)
query_string = f"timestamp={timestamp}"

# Step 2: Create HMAC SHA256 signature
signature = hmac.new(
    SECRET_KEY.encode('utf-8'),
    query_string.encode('utf-8'),
    hashlib.sha256
).hexdigest()

# Step 3: Add signature to query
full_query = f"{query_string}&signature={signature}"

# Step 4: Send GET request
headers = {
    "X-MBX-APIKEY": API_KEY
}

response = requests.get(f"{base_url}{endpoint}?{full_query}", headers=headers)

# Output the result
print(response.json())
