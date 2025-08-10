from fastapi import APIRouter, HTTPException, status
from typing import Any
# Assuming kotak_login_controller is in app.controllers.kotakControllers
from app.controllers.kotakControllers import kotak_login_controller
from neo_api_client.exceptions import ApiValueError
from fastapi import Body
from app.utils.autozonex_data_service import collection, init_db

from app.models.kotakneo_models import PlaceOrderRequest

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

@router.get("/positions", response_model=Any)
async def kotak_positions():
    global GLOBAL_KOTAK_CLIENT # Declare global usage

    # Get the authenticated client (will login if not already)
    client = await get_authenticated_kotak_client()

    try:
        # Attempt the operation with the client
        positions_data = client.positions()
        return positions_data
    except Exception as e:
        # This is where you handle token expiration errors (e.g., 401 from the SDK)
        # Without SDK docs, you might need to inspect the exception `e`
        # For example, if `e` is an HTTPException with status 401:
        # if isinstance(e, HTTPException) and e.status_code == status.HTTP_401_UNAUTHORIZED:
        print(f"Error accessing positions (possibly token expired): {e}")

        # Invalidate the current client and try re-login ONCE
        GLOBAL_KOTAK_CLIENT = None # Mark for re-login
        print("Attempting to re-login due to potential token expiration...")
        try:
            client = await get_authenticated_kotak_client() # This will force a new login
            positions_data = client.positions() # Retry the operation
            return positions_data
        except Exception as retry_e:
            print(f"Failed after re-login attempt for positions: {retry_e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve positions even after re-login: {retry_e}"
            )

@router.post("/place-order", response_model=Any)
async def kotak_place_order(order_request: PlaceOrderRequest):
    global GLOBAL_KOTAK_CLIENT

    client = await get_authenticated_kotak_client()

    try:
        response = client.place_order(
            exchange_segment=order_request.exchange_segment,
            product=order_request.product,
            price=order_request.price,
            order_type=order_request.order_type,
            quantity=order_request.quantity,
            validity=order_request.validity,
            trading_symbol=order_request.trading_symbol,
            transaction_type=order_request.transaction_type,
            amo=order_request.amo,
            disclosed_quantity=order_request.disclosed_quantity,
            market_protection=order_request.market_protection,
            pf=order_request.pf,
            trigger_price=order_request.trigger_price,
            tag=order_request.tag
        )

        # Check if the response contains an error
        if isinstance(response, dict) and "Error" in response:
            error = response["Error"]
            error_message = str(error) if isinstance(error, Exception) else str(error)
            return {
                "status": "error",
                "error_message": error_message
            }

        return response

    except ApiValueError as e:
        print(f"ApiValueError placing order: {e}")
        return {
            "status": "error",
            "error_type": "ApiValueError",
            "error_message": str(e)
        }

    except Exception as e:
        print(f"Unexpected error placing order: {e}")
        return {
            "status": "error",
            "error_type": "Exception",
            "error_message": str(e)
        }


@router.get('/set-stop-loss', response_model=Any)
async def kotak_set_stop_loss():
    global GLOBAL_KOTAK_CLIENT

    client = await get_authenticated_kotak_client()

    try:
        await init_db()

        # 1) Load open journals with valid stop loss
        journals = await collection.find({"status": "Open", "stopLoss": {"$gt": 0}}).to_list(length=1000)

        # 2) Fetch holdings
        holdings_data = client.holdings()

        # 3) Build lookup: symbol -> stopLoss
        journal_stop_loss_map = {
            j["symbol"]: j["stopLoss"] for j in journals if "symbol" in j and "stopLoss" in j
        }

        # 4) You MUST map each holding to the ScripMaster pTrdSymbol expected by API.
        #    Implement a cache that maps (symbol, exchangeSegment) -> pTrdSymbol.
        #    For example, preload ScripMaster for NSE CM and store pTrdSymbol by pSymbol/displaySymbol.
        #    Here we assume a function get_ptrdsymbol(symbol, exchange_segment) that returns correct pTrdSymbol string.
        #    You need to implement this using client.scrip_master() and local cache.
        def get_ptrdsymbol(symbol: str, exchange_segment: str) -> str | None:
            # TODO: Implement from your ScripMaster cache.
            # Fall back to f"{symbol}-EQ" ONLY if verified from ScripMaster that this matches pTrdSymbol.
            return None  # placeholder

        results = []

        # 5) Iterate holdings and place stop loss orders
        for holding in holdings_data.get("data", []):
            display_symbol = holding.get("displaySymbol")
            exch_seg = holding.get("exchangeSegment")  # e.g., "nse_cm"
            qty = holding.get("sellableQuantity") or holding.get("quantity")
            last_close = holding.get("closingPrice")

            if not display_symbol or not exch_seg or not qty:
                results.append({display_symbol or "UNKNOWN": {"status": "skipped", "reason": "missing holding fields"}})
                continue

            if display_symbol not in journal_stop_loss_map:
                results.append({display_symbol: {"status": "skipped", "reason": "stop loss not found or invalid in journal"}})
                continue

            sl_trigger = journal_stop_loss_map[display_symbol]

            # Resolve trading symbol (pTrdSymbol)
            pTrdSymbol = get_ptrdsymbol(display_symbol, exch_seg)
            if not pTrdSymbol:
                # As a fallback (not guaranteed for all symbols), try SYMBOL-EQ if on NSE CM.
                # Strongly recommended: replace with true pTrdSymbol lookup from ScripMaster.
                if exch_seg == "nse_cm":
                    pTrdSymbol = f"{display_symbol}-EQ"
                else:
                    results.append({display_symbol: {"status": "error", "error_type": "SymbolMapError", "error_message": "Missing pTrdSymbol mapping"}})
                    continue

            # Choose SL-M to reduce pricing constraints: price must be "0", and trigger_price must be string.
            # If you need SL (limit), ensure trigger_price < price for SELL and both are strings.
            order_type = "SL-M"  # or "SL"
            transaction_type = "S"  # SELL
            validity = "DAY"
            product = "CNC"  # For holdings delivery usually CNC; use NRML/MIS only if intended. Check your use-case.

            # Convert required fields to strings per docs
            str_qty = str(qty)
            str_trigger = str(sl_trigger)

            # For SL-M, price must be "0". For SL, set a sensible limit below trigger for a sell stop.
            if order_type == "SL-M":
                price_str = "0"
            else:
                # Example: 0.5% below trigger for sell SL limit
                limit_price = max(0.0, float(sl_trigger) * 0.995)
                price_str = f"{limit_price:.2f}"

            try:
                response = client.place_order(
                    exchange_segment=exch_seg,          # e.g., "nse_cm"
                    product=product,                    # "CNC" for selling holdings; confirm per requirement
                    price=price_str,                    # string
                    order_type=order_type,              # "SL-M" or "SL"
                    quantity=str_qty,                   # string
                    validity=validity,                  # "DAY"
                    trading_symbol=pTrdSymbol,          # MUST be pTrdSymbol from ScripMaster
                    transaction_type=transaction_type,  # "S"
                    amo="NO",                           # string "NO" per docs default
                    disclosed_quantity="0",             # string
                    market_protection="0",              # string
                    pf="N",                             # string default
                    trigger_price=str_trigger,          # string
                    tag="stop-loss-auto22"                # optional tag as string
                )

                if isinstance(response, dict) and "Error" in response:
                    error = response["Error"]
                    error_message = str(error) if isinstance(error, Exception) else str(error)
                    results.append({display_symbol: {"status": "error", "error_type": "ResponseError", "error_message": error_message}})
                else:
                    results.append({display_symbol: {"status": "success", "response": response}})

            except ApiValueError as api_err:
                results.append({display_symbol: {"status": "error", "error_type": "ApiValueError", "error_message": str(api_err)}})
            except Exception as e:
                results.append({display_symbol: {"status": "error", "error_type": "Exception", "error_message": str(e)}})

        return {"stop_loss_order_results": results}

    except Exception as e:
        GLOBAL_KOTAK_CLIENT = None
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process stop loss orders: {e}"
        )
