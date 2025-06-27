from neo_api_client import NeoAPI

# Callback functions for WebSocket events
def on_message(message):
    print("WebSocket Message:", message)

def on_error(error_message):
    print("WebSocket Error:", error_message)

def on_close(message):
    print("WebSocket Closed:", message)

def on_open(message):
    print("WebSocket Opened:", message)

# Initialize the client (use your actual consumer_key and consumer_secret)
client = NeoAPI(
    consumer_key="cus86mW4sL74SQcbWxrE9xJ9O9sa",
    consumer_secret="kXb9SoaGI7hfGu58GmvDhhrWxuUa",
    environment="prod",  # Using UAT for testing
    access_token=None,
    neo_fin_key=None
)

# Set up callbacks
client.on_message = on_message
client.on_error = on_error
client.on_close = on_close
client.on_open = on_open

print("Attempting login...")
# Initiate login
try:
    response = client.login(mobilenumber="+917348393452", password="Naina@7557")
    print("Login Response:", response)
except Exception as e:
    print("Login Error:", e)

print("Completing 2FA...")
# Complete 2FA with OTP
try:
    response = client.session_2fa(OTP="991975")
    print("2FA Response:", response)
except Exception as e:
    print("2FA Error:", e)

# Subscribe to sample instrument tokens (replace with valid tokens)
instrument_tokens = [
    {"instrument_token": "NSE:RELIANCE-EQ", "exchange_segment": "nse_cm"},
    {"instrument_token": "NSE:INFY-EQ", "exchange_segment": "nse_cm"}
]

print("Subscribing to WebSocket feed...")
try:
    print(client.holdings())
    client.subscribe(instrument_tokens=instrument_tokens, isIndex=False, isDepth=False)
    print("Subscription successful")
except Exception as e:
    print("Subscription Error:", e)

# Optionally subscribe to order feed
print("Subscribing to order feed...")
try:
    client.subscribe_to_orderfeed()
    print("Order feed subscription successful")
except Exception as e:
    print("Order Feed Subscription Error:", e)