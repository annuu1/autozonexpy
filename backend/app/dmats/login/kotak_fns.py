
from neo_api_client import NeoAPI

def on_message(message):
    print(message)
    
def on_error(error_message):
    print(error_message)

def on_close(message):
    print(message)
    
def on_open(message):
    print(message)

#First initialize session and generate session token
def kotak_login():
    client = NeoAPI(consumer_key="cus86mW4sL74SQcbWxrE9xJ9O9sa",
    consumer_secret="kXb9SoaGI7hfGu58GmvDhhrWxuUa",environment="prod")
    client.login(mobilenumber="+917348393452", password="Bindu@9919")
    client.session_2fa("991975")

    try:
        return client
    except Exception as e:
        print("Exception when calling Holdings->holdings: %s\n" % e)
        return None