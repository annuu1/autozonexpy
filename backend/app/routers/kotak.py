from fastapi import APIRouter, HTTPException, status
from typing import Any
# Assuming kotak_login_controller is in app.controllers.kotakControllers
from app.controllers.kotakControllers import kotak_login_controller
import time

router = APIRouter(prefix="/kotak", tags=["kotak"])

# Global variable to store the authenticated client
# In a real-world scenario, especially for multi-user apps,
# you'd manage this per-user or use a proper cache.
GLOBAL_KOTAK_CLIENT = None
# You might also want to store token expiry if the client doesn't handle it
GLOBAL_KOTAK_CLIENT_TOKEN_EXPIRY_TIME = 0 # Unix timestamp

# --- Helper function to get or refresh the client ---
async def get_authenticated_kotak_client():
    global GLOBAL_KOTAK_CLIENT, GLOBAL_KOTAK_CLIENT_TOKEN_EXPIRY_TIME

    # Check if client exists and if its token is likely still valid
    # This check depends on whether the client object itself indicates token expiry
    # or if you need to calculate it based on the 'expires_in' value.
    # If the client handles automatic refresh internally, this check might be simpler.
    # Let's assume for now, we just check if client exists and rely on its internal refresh or API 401 error.

    # Option A: Rely on API 401 response (simpler initial implementation)
    # The client will try to use an expired token, the API will return 401,
    # and then we'll try to re-login.
    if GLOBAL_KOTAK_CLIENT:
        # If client exists, assume it's good for now.
        # We will handle potential 401s during actual operation calls.
        return GLOBAL_KOTAK_CLIENT

    # If client does not exist, log in
    print("No existing Kotak client found, attempting initial login...")
    try:
        new_client = kotak_login_controller()
        if not new_client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Initial login to Kotak failed."
            )
        GLOBAL_KOTAK_CLIENT = new_client
        # If kotak_login_controller returns a client, it likely holds the token.
        # If it also gives you an expiry, store it:
        # GLOBAL_KOTAK_CLIENT_TOKEN_EXPIRY_TIME = time.time() + new_client.get_token_expiry_seconds()
        print("Kotak client successfully initialized.")
        return GLOBAL_KOTAK_CLIENT
    except Exception as e:
        print(f"Error during initial Kotak client login: {e}")
        # Re-raise as HTTPException or handle appropriately
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize Kotak client: {e}"
        )


@router.post("/login", response_model=Any)
async def kotak_login_endpoint():
    # This endpoint's purpose shifts to *ensuring* the client is logged in
    # and perhaps returning a status, rather than returning the token directly
    # from kotak_login_controller (unless you modify kotak_login_controller
    # to return the token data).
    try:
        client = await get_authenticated_kotak_client()
        return {"message": "Kotak client authenticated and ready."}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error during login: {e}")


@router.get("/holdings", response_model=Any)
async def kotak_holdings():
    global GLOBAL_KOTAK_CLIENT # Declare global usage

    # Get the authenticated client (will login if not already)
    client = await get_authenticated_kotak_client()

    try:
        # Attempt the operation with the client
        holdings_data = client.holdings()
        return holdings_data
    except Exception as e:
        # This is where you handle token expiration errors (e.g., 401 from the SDK)
        # Without SDK docs, you might need to inspect the exception `e`
        # For example, if `e` is an HTTPException with status 401:
        # if isinstance(e, HTTPException) and e.status_code == status.HTTP_401_UNAUTHORIZED:
        print(f"Error accessing holdings (possibly token expired): {e}")

        # Invalidate the current client and try re-login ONCE
        GLOBAL_KOTAK_CLIENT = None # Mark for re-login
        print("Attempting to re-login due to potential token expiration...")
        try:
            client = await get_authenticated_kotak_client() # This will force a new login
            holdings_data = client.holdings() # Retry the operation
            return holdings_data
        except Exception as retry_e:
            print(f"Failed after re-login attempt for holdings: {retry_e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve holdings even after re-login: {retry_e}"
            )