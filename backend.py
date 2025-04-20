# -*- coding: utf-8 -*- # Ensure UTF-8 encoding for broader character support
import os
import time
import json
import logging
import threading
from flask import Flask, request, jsonify, Response, url_for
from dotenv import load_dotenv

# --- Set cache environment variables BEFORE importing model libraries ---
os.environ['HF_HOME'] = '/tmp/.cache'
os.environ['TRANSFORMERS_CACHE'] = '/tmp/.cache'

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [%(funcName)s] - %(message)s')

# --- Load Environment Variables ---
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Define APP_BASE_URL, using the provided one as default if not set in .env
APP_BASE_URL = os.getenv("APP_BASE_URL", "https://ankys34-shl-back.hf.space/").rstrip('/')


# Now import model-related libraries AFTER setting environment variables
try:
    from supabase import create_client, Client
    from sentence_transformers import SentenceTransformer
    import google.generativeai as genai
except ImportError as e:
    logging.critical(f"Failed to import required libraries: {e}. Ensure dependencies are installed.")
    # Exit or handle gracefully if essential libraries are missing
    # For now, we'll let the initialization fail later, but logging it here is crucial.
    pass


# --- Configuration ---
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'
EXPECTED_EMBEDDING_DIMENSION = 384
DB_RETRIEVAL_COUNT = 6      # Fetch top 6 candidates from Supabase
MAX_FINAL_RECOMMENDATIONS = 3 # Ask LLM to return at most 3
DB_MATCH_THRESHOLD = 0.4 # Keep threshold relatively inclusive for retrieval
DB_FUNCTION_NAME = "match_products"
MAX_QUERY_RETRIES = 2
RETRY_QUERY_DELAY = 3
GEMINI_QUERY_EXPANSION_TEMP = 0.6
GEMINI_JSON_GENERATION_TEMP = 0.1 # Keep low for structured JSON

# --- Initialize Clients (Global Scope) ---
supabase_client = None
embed_model = None
gen_model = None
initialization_error_message = None
initialization_complete = False
initialization_thread = None

# --- Flask App Definition ---
app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.config['JSON_SORT_KEYS'] = False  # Preserve the order of keys in the JSON response
app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'  # Ensure proper content type

# --- Helper Function for Pretty JSON Response ---
def pretty_json_response(data, status_code=200):
    """Return a pretty-formatted JSON response with proper headers"""
    try:
        # Ensure data is serializable, handle potential errors during dump
        pretty_json = json.dumps(data, indent=2, ensure_ascii=False) # Added ensure_ascii=False for broader char support
    except TypeError as e:
        logging.error(f"Failed to serialize data to JSON: {e}. Data: {data}")
        pretty_json = json.dumps({"error": "Internal server error: Failed to serialize response.", "status": "internal_error"}, indent=2)
        status_code = 500

    response = Response(
        response=pretty_json,
        status=status_code,
        mimetype='application/json; charset=utf-8'
    )
    return response

# --- Async Initialization Function ---
def async_initialize():
    global supabase_client, embed_model, gen_model, initialization_error_message, initialization_complete
    try:
        logging.info("Initializing Supabase client...")
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Supabase URL/Key missing in environment variables.")
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logging.info("Supabase client initialized.")

        logging.info(f"Loading embedding model '{EMBEDDING_MODEL_NAME}'...")
        embed_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        actual_dimension = embed_model.get_sentence_embedding_dimension()
        if actual_dimension != EXPECTED_EMBEDDING_DIMENSION:
            raise ValueError(f"Embedding model dimension mismatch! Expected {EXPECTED_EMBEDDING_DIMENSION}, but got {actual_dimension}.")
        logging.info(f"Embedding model loaded.")

        logging.info("Initializing Gemini client...")
        if not GEMINI_API_KEY:
            raise ValueError("Gemini API Key missing in environment variables.")
        genai.configure(api_key=GEMINI_API_KEY)
        # It's good practice to specify the model generation configuration here if needed
        gen_model = genai.GenerativeModel(
             model_name='gemini-2.5-pro-preview-03-25', # Using gemini-1.5-flash as 2.0 isn't a standard public name yet
             # generation_config=genai.types.GenerationConfig(...) # Can be set here or per-call
             # safety_settings=... # Consider configuring safety settings
        )

        logging.info("Gemini client initialized.")

        initialization_complete = True
        logging.info("Initialization completed successfully")
    except Exception as e:
        logging.critical(f"CRITICAL ERROR DURING INITIALIZATION: {e}", exc_info=True)
        initialization_error_message = f"Server initialization failed: {e}"
        # Ensure components are None if initialization failed
        supabase_client = None
        embed_model = None
        gen_model = None
        initialization_complete = False # Explicitly set to false on error

# --- Start initialization in background thread ---
def start_initialization():
    global initialization_thread
    # Prevent starting multiple threads if called again
    if initialization_thread is None or not initialization_thread.is_alive():
        logging.info("Starting initialization in background thread")
        initialization_thread = threading.Thread(target=async_initialize)
        initialization_thread.daemon = True # Ensure thread exits when main process exits
        initialization_thread.start()
    else:
        logging.info("Initialization thread already running.")


# --- Helper Function for Embedding Text ---
def get_embedding_text(product):
    """Combines important fields for richer embedding context."""
    # Improved handling for potentially missing or None values
    parts = [
        f"Product: {product.get('product_name', '')}",
        f"Type: {', '.join(product.get('product_type', [])) if product.get('product_type') else ''}",
        f"Solution Type: {product.get('solution_type', '')}",
        f"Description: {product.get('description', '')}",
        f"Measures: {', '.join(product.get('measured_constructs', [])) if product.get('measured_constructs') else ''}",
        # Robust handling for job_roles and target_audience which might contain non-strings or None
        f"Roles: {', '.join(str(item).strip() for item in product.get('job_roles', []) if item and isinstance(str(item).strip(), str) and str(item).strip())}",
        f"Target Audience: {', '.join(str(item).strip() for item in product.get('target_audience', []) if item and isinstance(str(item).strip(), str) and str(item).strip())}"
    ]
    # Filter out parts that are empty after formatting (e.g., "Roles: ")
    return " | ".join(part for part in parts if ': ' in part and len(part.split(': ', 1)) > 1 and part.split(': ', 1)[1].strip())


# --- Query Expansion Function ---
def expand_query_with_llm(original_query: str) -> str:
    """Uses Gemini to expand the user query with related terms for better retrieval."""
    if not gen_model or not initialization_complete: # Also check initialization_complete
        logging.error("Gemini client not available for query expansion.")
        return original_query

    prompt = f"""Analyze the following user query about SHL assessments. Identify the core concepts, skills, or job roles mentioned. Generate a list of related keywords or synonyms that would be useful for searching a database of assessment product descriptions. Output ONLY the keywords, separated by commas. User Query: "{original_query}" Keywords only, comma-separated:"""
    try:
        logging.info(f"Expanding query: '{original_query}'")
        response = gen_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=GEMINI_QUERY_EXPANSION_TEMP)
        )

        # Check for content safely
        if response.parts:
            expanded_terms = response.text.strip()
            if expanded_terms: # Ensure terms are not empty
                combined_query = f"{original_query} | Relevant concepts: {expanded_terms}"
                logging.info(f"Expanded query for search: '{combined_query}'")
                return combined_query
            else:
                logging.warning("Query expansion resulted in empty terms. Falling back to original query.")
                return original_query
        # Handle blocked responses more explicitly
        elif hasattr(response, 'prompt_feedback') and response.prompt_feedback and response.prompt_feedback.block_reason:
             logging.warning(f"Query expansion failed. Reason: Response blocked ({response.prompt_feedback.block_reason}). Falling back.")
             return original_query
        else:
            logging.warning(f"Query expansion failed. Unknown reason (empty response?). Falling back.")
            return original_query
    except Exception as e:
        logging.error(f"Error during query expansion API call: {e}", exc_info=True)
        return original_query

# --- RAG Core Function ---
def get_product_recommendation_backend_robust(original_query: str):
    """Performs the enhanced RAG process: Expand -> Retrieve -> Select -> Generate JSON. Returns (dict, status_code)"""
    # Check if initialization is complete or failed
    if not initialization_complete:
        if initialization_error_message:
            logging.error(f"Initialization previously failed: {initialization_error_message}")
            return {"error": f"Server is unavailable due to initialization failure: {initialization_error_message}", "status": "unavailable"}, 503
        else:
            logging.warning("Initialization not yet complete.")
            return {"error": "Server is still initializing. Please try again shortly.", "status": "initializing"}, 503

    # Check required clients are available (belt-and-suspenders check)
    if not supabase_client or not embed_model or not gen_model:
         logging.critical("A required client (Supabase, Embed, Gemini) is None despite initialization supposedly complete.")
         return {"error": "Internal server error: Core components missing.", "status": "internal_error"}, 500

    if not original_query or not isinstance(original_query, str) or original_query.isspace():
        logging.warning("Received invalid query.")
        return {"error": "Query parameter is missing, empty, or not a string.", "status": "bad_request"}, 400

    # Default responses defined once
    default_error_response = {"error": "An internal error occurred during recommendation generation.", "status": "error"}
    default_error_code = 500
    no_match_json_response_dict = {
        "status": "no_match",
        "message": f"No products found matching the initial criteria for query: '{original_query}'. Try rephrasing or broadening your search.",
        "recommended_assessments": []
    }

    try:
        # 1. Expand Query
        expanded_query = expand_query_with_llm(original_query)

        # 2. Embed Expanded Query
        logging.info(f"Embedding expanded query for retrieval...")
        try:
            query_embedding = embed_model.encode(expanded_query).tolist()
        except Exception as e:
            logging.error(f"Failed to encode query: {e}", exc_info=True)
            return {"error": f"Failed to process query for embedding: {e}", "status": "embedding_error"}, 500


        # 3. Query Supabase using Expanded Query Embedding
        logging.info(f"Searching for top {DB_RETRIEVAL_COUNT} relevant products...")
        matches = []
        last_db_error = None
        for attempt in range(MAX_QUERY_RETRIES):
            try:
                # Ensure supabase_client is valid before calling rpc
                if not supabase_client:
                     raise ConnectionError("Supabase client is not initialized.")

                response = supabase_client.rpc(
                    DB_FUNCTION_NAME,
                    {
                        'query_embedding': query_embedding,
                        'match_threshold': DB_MATCH_THRESHOLD,
                        'match_count': DB_RETRIEVAL_COUNT
                    }
                ).execute()

                # Check response structure (depends on Supabase client version)
                if hasattr(response, 'data') and response.data is not None:
                    matches = response.data
                elif isinstance(response, list): # Handle cases where it might return a list directly
                     matches = response
                else:
                     # Log unexpected response structure
                     logging.warning(f"Supabase RPC returned unexpected response structure: {type(response)}, Content: {response}")
                     matches = [] # Assume no matches if structure is wrong

                logging.info(f"Initial retrieval found {len(matches)} candidates (Attempt {attempt + 1}).")
                last_db_error = None # Reset error on success
                break # Exit loop on success
            except Exception as e:
                last_db_error = e
                logging.error(f"Supabase RPC error (Attempt {attempt + 1}/{MAX_QUERY_RETRIES}): {e}", exc_info=True)
                if attempt < MAX_QUERY_RETRIES - 1:
                    logging.info(f"Retrying Supabase query in {RETRY_QUERY_DELAY} seconds...")
                    time.sleep(RETRY_QUERY_DELAY)
                else:
                    logging.error("Supabase search failed after all retries.")
                    # Use last_db_error in the response
                    return {"error": f"Database search failed after {MAX_QUERY_RETRIES} retries: {last_db_error}", "status": "db_error"}, 503

        # If loop finished due to retries failing
        if last_db_error:
             return {"error": f"Database search failed: {last_db_error}", "status": "db_error"}, 503


        if not matches:
            logging.warning(f"No candidates found matching threshold {DB_MATCH_THRESHOLD} for expanded query '{expanded_query}'.")
            # Return the structured no-match response
            return no_match_json_response_dict, 200 # It's not an error, just no matches found

        # 4. Format Context for Final LLM
        logging.info(f"Preparing context with {len(matches)} candidates for AI selection...")
        context_data_for_llm = []
        seen_product_ids = set() # Avoid duplicates if DB returns them somehow
        for match in matches:
            if isinstance(match, dict) and match.get('product_id') not in seen_product_ids:
                product_id = match.get('product_id') # Get product_id for the JSON output
                if not product_id:
                    logging.warning(f"Skipping match due to missing 'product_id': {match.get('product_name')}")
                    continue

                context_data_for_llm.append({
                    # Ensure all required fields for the final JSON are present here
                    "product_id": product_id, # Use product_id from the match
                    "url": match.get('url'),
                    "adaptive_irt": match.get('adaptive_irt'), # Keep boolean or source format
                    "description": match.get('description'),
                    "duration_minutes": match.get('duration_minutes'), # Keep number or None
                    "remote_testing": match.get('remote_testing'), # Keep boolean or source format
                    "product_type": match.get('product_type', []),
                    "product_name": match.get('product_name'),
                    # Include similarity score for context, though not required in final JSON
                    "similarity_score": match.get('similarity')
                })
                seen_product_ids.add(product_id)
            else:
                if not isinstance(match, dict):
                     logging.warning(f"Skipping unexpected match item format: {type(match)}, Content: {match}")
                # else: duplicate product_id, already logged if needed

        if not context_data_for_llm:
             logging.warning("No valid candidates remaining after filtering for context.")
             return no_match_json_response_dict, 200


        # 5. Construct Prompt for Final JSON Generation
        context_json_string = json.dumps(context_data_for_llm, indent=2, ensure_ascii=False) # ensure_ascii=False here too

        # Updated prompt asking for specific conversion and explicit no-match JSON
        prompt = f"""You are an AI assistant generating JSON recommendations for SHL assessments based on provided context.
        Analyze the user's original query and the provided context, which contains potentially relevant products found in the database.

        Original User Query: "{original_query}"

        Product Data Context (Top candidates retrieved, sorted by relevance):
        ```json
        {context_json_string}
        ```

        Your Task:
        1. Select the **BEST** and **MOST RELEVANT** products from the context that directly address the *original user query*.
        2. Choose **AT MOST {MAX_FINAL_RECOMMENDATIONS}** products. Prioritize direct relevance to the original query over similarity score alone.
        3. If the original query was broad (e.g., 'technical skills'), include products from the context that clearly fit that category (like specific coding tests, technical simulations), up to the limit of {MAX_FINAL_RECOMMENDATIONS}.
        4. Generate **ONLY** a single, valid JSON object as your response. Do not include any text before or after the JSON object, including markdown fences like ```json or ```.

        JSON Output Instructions:
        - The JSON object MUST have a top-level key: "recommended_assessments", which is a JSON array.
        - The array should contain **0 to {MAX_FINAL_RECOMMENDATIONS}** product objects, ordered by relevance to the original query.
        - Each product object MUST have these keys IN THIS EXACT ORDER:
          - "product_id": string (from context's 'product_id')
          - "product_name": string (from context's 'product_name')
          - "url": string (from context's 'url', ensure it's not null, use "" if missing)
          - "adaptive_support": string ("Yes" if context 'adaptive_irt' is true/non-empty, otherwise "No")
          - "description": string (from context's 'description')
          - "duration": number or null (from context's 'duration_minutes')
          - "remote_support": string ("Yes" if context 'remote_testing' is true/non-empty, otherwise "No")
          - "test_type": array of strings (from context's 'product_type', ensure it's an array)
        - Use ONLY data provided in the context. Convert boolean/source values for 'adaptive_support' and 'remote_support' to "Yes" or "No" strings. Ensure 'test_type' is always an array. Handle nulls appropriately for 'duration' and provide default "" for missing 'url'.

        - **Crucially**: If *none* of the products in the provided context are a good match for the *original user query*, output EXACTLY this JSON object:
          `{{"status": "no_relevant_match_in_context", "message": "While related products were retrieved, none closely matched the specific request.", "recommended_assessments": []}}`

        Generate the JSON output now.
        """

        # 6. Call Gemini for Final JSON Generation
        logging.info(f"Sending final generation prompt to Gemini (asking for max {MAX_FINAL_RECOMMENDATIONS} results)...")
        try:
            gemini_response = gen_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=GEMINI_JSON_GENERATION_TEMP,
                    # Explicitly ask for JSON output if the model supports it
                    # response_mime_type="application/json" # Uncomment if using a model/version supporting this
                )
            )
            # logging.debug(f"Raw Gemini Response Text: {gemini_response.text}") # Be cautious logging potentially large/sensitive raw responses

            if gemini_response.parts:
                recommendation_json_string = gemini_response.text
                logging.info("Received text response from Gemini, attempting to parse as JSON.")

                # --- Robust JSON Cleaning ---
                cleaned_json_string = recommendation_json_string.strip()
                # Remove potential markdown fences (```json ... ``` or ``` ... ```)
                if cleaned_json_string.startswith("```json"):
                    cleaned_json_string = cleaned_json_string[7:]
                elif cleaned_json_string.startswith("```"):
                     cleaned_json_string = cleaned_json_string[3:]

                if cleaned_json_string.endswith("```"):
                    cleaned_json_string = cleaned_json_string[:-3]

                # Final strip after removing fences
                cleaned_json_string = cleaned_json_string.strip()
                # --- End JSON Cleaning ---

                logging.debug(f"Cleaned JSON string attempt: '{cleaned_json_string}'") # Log the cleaned string

                if not cleaned_json_string:
                     logging.error("Gemini response was empty after cleaning attempts.")
                     return {"error": "AI model returned an empty response after cleaning.", "status": "ai_error"}, 502

                try:
                    # Attempt to parse the cleaned string
                    parsed_json = json.loads(cleaned_json_string)
                    logging.info("Response successfully parsed as JSON.")

                    # --- Add status and message if missing (and recommendations exist) ---
                    if "status" not in parsed_json:
                        if isinstance(parsed_json.get("recommended_assessments"), list) and len(parsed_json["recommended_assessments"]) > 0:
                             parsed_json["status"] = "success"
                             parsed_json["message"] = "Successfully retrieved recommendations."
                        else:
                             # If recommendations array is missing or empty, assume no relevant match based on prompt instructions
                             parsed_json["status"] = "no_relevant_match_in_context"
                             parsed_json["message"] = parsed_json.get("message", "AI selected no relevant products from the provided context.")
                             if "recommended_assessments" not in parsed_json:
                                 parsed_json["recommended_assessments"] = []
                    # --- End status handling ---

                    # Validate structure minimally (presence of recommended_assessments array)
                    if not isinstance(parsed_json.get("recommended_assessments"), list):
                        logging.error(f"Parsed JSON lacks 'recommended_assessments' list. Parsed: {parsed_json}")
                        raise json.JSONDecodeError("Parsed JSON missing 'recommended_assessments' list.", cleaned_json_string, 0)

                    # Return the parsed dictionary and status code
                    return parsed_json, 200

                except json.JSONDecodeError as json_e:
                    logging.error(f"Gemini did not return valid JSON after cleaning: {json_e}. Cleaned String: '{cleaned_json_string}'. Raw Response (start): '{recommendation_json_string[:200]}...'")
                    # Return error dictionary
                    return {"error": f"AI model returned text that could not be parsed as JSON after cleaning. Check logs for details.", "raw_start": recommendation_json_string[:200], "status": "ai_error"}, 502

            # Handle blocked responses explicitly
            elif hasattr(gemini_response, 'prompt_feedback') and gemini_response.prompt_feedback and gemini_response.prompt_feedback.block_reason:
                 block_reason = gemini_response.prompt_feedback.block_reason
                 logging.warning(f"Gemini response blocked. Reason: {block_reason}")
                 # Return error dictionary
                 return {"error": f"AI response blocked by content safety filter ({block_reason}). Try rephrasing query or check context.", "status": "ai_blocked"}, 400
            else:
                # Handle other unexpected empty responses
                logging.warning("Gemini returned an empty or unexpected response structure.")
                 # Return error dictionary
                return {"error": "AI model returned an empty or unparseable response.", "status": "ai_error"}, 502

        except Exception as e:
            # Catch potential errors during the API call itself
            logging.error(f"Error calling Gemini API or processing its response: {e}", exc_info=True)
            # Return error dictionary
            return {"error": f"An error occurred communicating with the AI model: {e}", "status": "ai_error"}, 502

    except Exception as e:
        # Catch-all for unexpected errors in the main RAG flow
        logging.error(f"Unexpected error in RAG process for query '{original_query}': {e}", exc_info=True)
        # Return default error dictionary
        return default_error_response, default_error_code


# --- Flask Routes ---

# --- Base Route ---
@app.route('/', methods=['GET'])
def base_route():
    """Provides basic API information and available endpoints."""
    status_code = 200 # API is up if this route is reached
    response_data = {
        "status": "ok",
        "message": "SHL Recommendation API is running.",
        "endpoints": {
            "base": {
                "method": "GET",
                "url": f"{APP_BASE_URL}/",
                "description": "This endpoint, providing API info and available routes."
            },
            "health": {
                "method": "GET",
                "url": f"{APP_BASE_URL}/health",
                "description": "Check the health and initialization status of the API components."
            },
            "recommend": {
                "method": "POST",
                "url": f"{APP_BASE_URL}/recommend",
                "description": "Get product recommendations based on a natural language query.",
                "body_example": {"query": "assessment for collaborative software engineers"}
            }
        },
        "version": "1.0.0" # Optional: Add an API version
    }
    # Check initialization status to provide more context if needed
    if not initialization_complete:
        if initialization_error_message:
            response_data["status"] = "partially_available_initialization_failed"
            response_data["message"] = f"SHL Recommendation API base is running, but backend components failed to initialize: {initialization_error_message}"
            status_code = 503 # Service Unavailable due to backend failure
        else:
            response_data["status"] = "initializing"
            response_data["message"] = "SHL Recommendation API is running, but backend components are still initializing. Functionality may be limited."
            status_code = 503 # Service Unavailable as it's not ready

    return pretty_json_response(response_data, status_code)


@app.route('/recommend', methods=['POST'])
def recommend_assessments():
    # Start initialization only if needed and not already running/finished
    if not initialization_complete and (initialization_thread is None or not initialization_thread.is_alive()):
        start_initialization()

    # Check status *after* potentially starting initialization
    if not initialization_complete:
        if initialization_error_message:
            # Use the pretty_json_response helper
            return pretty_json_response({"error": initialization_error_message, "status": "unavailable"}, 503)
        else:
            # Still initializing
            return pretty_json_response({"error": "Server is initializing. Please try again shortly.", "status": "initializing"}, 503)

    start_time = time.time()
    request_id = os.urandom(4).hex() # Simple request ID for logging correlation
    logging.info(f"[Req ID: {request_id}] Received request on /recommend endpoint.")

    if not request.is_json:
        logging.warning(f"[Req ID: {request_id}] Request content type is not application/json.")
        return pretty_json_response({"error": "Request must be JSON.", "status": "bad_request"}, 415) # Use 415 Unsupported Media Type

    data = request.json
    if not data or 'query' not in data:
        logging.warning(f"[Req ID: {request_id}] Request JSON missing 'query' parameter.")
        return pretty_json_response({"error": "Missing 'query' in JSON request body.", "status": "bad_request"}, 400)

    original_query = data['query']

    # Basic validation of the query itself
    if not isinstance(original_query, str) or not original_query.strip():
         logging.warning(f"[Req ID: {request_id}] Invalid 'query' provided (not a non-empty string).")
         return pretty_json_response({"error": "'query' must be a non-empty string.", "status": "bad_request"}, 400)

    logging.info(f"[Req ID: {request_id}] Processing original query: '{original_query[:100]}...'")

    # Call the backend function which now returns (dict, status_code)
    result_data, status_code = get_product_recommendation_backend_robust(original_query)

    end_time = time.time()
    processing_time = end_time - start_time
    logging.info(f"[Req ID: {request_id}] Request processed in {processing_time:.2f} seconds. Status code: {status_code}. Result status: {result_data.get('status', 'N/A')}")

    # Use the pretty_json_response helper for consistent output
    return pretty_json_response(result_data, status_code)


@app.route('/health', methods=['GET'])
def health_check():
    # Start initialization if it hasn't been started yet (e.g., health check is the first hit)
    if not initialization_complete and (initialization_thread is None or not initialization_thread.is_alive()):
        start_initialization()

    status_code = 503 # Default to unhealthy/initializing
    response_data = {
        "status": "initializing",
        "message": "Server components are currently initializing.",
         "components": {
            "supabase_client_needed": SUPABASE_URL is not None,
            "embedding_model_needed": True,
            "gen_model_needed": GEMINI_API_KEY is not None,
            "supabase_client_ready": supabase_client is not None,
            "embedding_model_ready": embed_model is not None,
            "gen_model_ready": gen_model is not None
        }
    }

    if initialization_error_message:
        status_code = 503
        response_data["status"] = "unhealthy"
        response_data["message"] = f"Initialization failed: {initialization_error_message}"
    elif initialization_complete:
        # All components should be ready if initialization_complete is True
        if supabase_client and embed_model and gen_model:
            status_code = 200
            response_data["status"] = "healthy"
            response_data["message"] = "All components initialized successfully."
        else:
             # This case indicates a potential logic error in initialization reporting
             status_code = 500
             response_data["status"] = "error"
             response_data["message"] = "Internal inconsistency: Initialization marked complete, but components are missing."
             logging.critical("Health check inconsistency: initialization_complete=True but components are None.")

    # Update component readiness in the response regardless of overall status
    response_data["components"]["supabase_client_ready"] = supabase_client is not None
    response_data["components"]["embedding_model_ready"] = embed_model is not None
    response_data["components"]["gen_model_ready"] = gen_model is not None


    return pretty_json_response(response_data, status_code)


# --- Run Flask App ---
if __name__ == '__main__':
    # Start initialization in background immediately when script runs directly
    start_initialization()

    # Read PORT environment variable, default to 8080 common for cloud containers
    port = int(os.environ.get("PORT", 7860)) # Changed default from 8080 back to 7860 if that's preferred

    # Use Gunicorn in production, but for direct run `python app_flask_robust.py`, Flask's dev server is used.
    # Set debug=False for production-like behavior even in direct run (Gunicorn ignores this).
    # Consider using Waitress or another production-grade server if not using Gunicorn.
    logging.info(f"Starting Flask development server on host 0.0.0.0 port {port}")
    logging.warning("Running with Flask's development server. Use Gunicorn or another WSGI server for production.")
    app.run(debug=False, host='0.0.0.0', port=port)
