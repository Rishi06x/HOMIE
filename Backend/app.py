import os
import math
import random
import datetime
import jwt
import bcrypt
import requests as http_requests
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from flask_socketio import SocketIO, emit, join_room, leave_room

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"], supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading", http_compression=False)

# ── Config ──────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "fallback-secret")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# ── MongoDB ─────────────────────────────────────────────
client = MongoClient(MONGO_URI)
db = client["homie_db"]
users_collection = db["users"]
bookings_collection = db["bookings"]
reviews_collection = db["reviews"]
messages_collection = db["messages"]
promo_codes_collection = db["promo_codes"]
# Create indexes
users_collection.create_index("email", unique=True)
users_collection.create_index([("location", "2dsphere")])


# ═══════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════

def generate_token(user_id):
    """Generate a JWT token valid for 7 days."""
    payload = {
        "user_id": str(user_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = users_collection.find_one({"_id": ObjectId(data["user_id"])})
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token."}), 401
        except Exception as e:
            return jsonify({"error": f"Auth error: {str(e)}"}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def serialize_user(user):
    """Convert MongoDB user document to JSON-safe dict."""
    coords = None
    if user.get("location") and user["location"].get("coordinates"):
        coords = user["location"]["coordinates"]  # [lng, lat]

    return {
        "id": str(user["_id"]),
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role"),
        "location_text": user.get("location_text", ""),
        "location": {"lng": coords[0], "lat": coords[1]} if coords else None,
        "specialization": user.get("specialization"),
        "price_per_hour": user.get("price_per_hour"),
        "rating": user.get("rating", 0),
        "reviews_count": user.get("reviews_count", 0),
        "is_verified": user.get("is_verified", False),
        "is_online": user.get("is_online", False),
        "subscription_status": user.get("subscription_status", "free"),
        "created_at": user.get("created_at", "").isoformat() if user.get("created_at") else None,
        "bio": user.get("bio", "I am an experienced local professional. I might not have formal degrees, but my practical work and customer satisfaction speak for themselves!"),
        "portfolio_images": user.get("portfolio_images", [
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop'
        ]),
    }


# ── Geocoding (OpenStreetMap Nominatim — free, no API key) ──
def geocode_address(address):
    """
    Convert a text address to lat/lng coordinates using
    OpenStreetMap's free Nominatim geocoding API.
    Returns (lat, lng) tuple or None if not found.
    """
    try:
        res = http_requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": "HOMIE-App/1.0"},
            timeout=5
        )
        data = res.json()
        if data and len(data) > 0:
            lat = float(data[0]["lat"])
            lng = float(data[0]["lon"])
            return (lat, lng)
    except Exception as e:
        print(f"Geocoding error for '{address}': {e}")
    return None


# ── AI Scoring Engine ───────────────────────────────────
def calculate_ai_score(distance_km, rating, reviews_count, is_verified, is_online):
    """
    AI-powered scoring algorithm to rank professionals.
    
    Factors and weights:
      - Proximity (40%):  Closer workers score higher
      - Rating (30%):     Higher-rated workers score higher
      - Trust (20%):      More reviews = more trustworthy (log scale)
      - Availability (10%): Online & verified workers get a bonus
    
    Returns a score from 0 to 100.
    """
    # Proximity score: inverse distance, max out at 40 points
    # At 0km = 40pts, at 5km = 20pts, at 20km = 5pts, at 50km+ ≈ 0pts
    if distance_km <= 0:
        proximity_score = 40.0
    else:
        proximity_score = 40.0 * (1.0 / (1.0 + distance_km / 3.0))

    # Rating score: 0-5 star scale → 0-30 points
    rating_score = (rating / 5.0) * 30.0

    # Trust score: logarithmic scale of review count → 0-20 points
    # 0 reviews = 0, 10 reviews = 10, 100 reviews = 20
    trust_score = min(20.0, 10.0 * math.log10(reviews_count + 1))

    # Availability bonus: 0-10 points
    availability_score = 0.0
    if is_online:
        availability_score += 6.0
    if is_verified:
        availability_score += 4.0

    total = proximity_score + rating_score + trust_score + availability_score
    return round(min(100.0, total), 1)


# ═══════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════

@app.route("/auth/register", methods=["POST"])
def register():
    """Register a new user with email, password, location, and role-specific fields."""
    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "seeker")
    location_text = data.get("location", "").strip()

    # Provider-specific fields
    specialization = data.get("specialization", "")
    price_per_hour = data.get("price_per_hour", 0)

    # Validation
    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if role not in ("seeker", "provider"):
        return jsonify({"error": "Role must be 'seeker' or 'provider'"}), 400
    if not location_text:
        return jsonify({"error": "Location is required"}), 400

    # Check duplicate email
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "An account with this email already exists"}), 409

    # Geocode the address
    coords = geocode_address(location_text)
    if not coords:
        return jsonify({"error": "Could not find that location. Please enter a valid city or address."}), 400

    lat, lng = coords

    # Build user document
    new_user = {
        "name": name,
        "email": email,
        "password": hash_password(password),
        "role": role,
        "location_text": location_text,
        "location": {
            "type": "Point",
            "coordinates": [lng, lat]  # GeoJSON: [longitude, latitude]
        },
        "is_verified": False,
        "is_online": False,
        "subscription_status": "free",
        "created_at": datetime.datetime.utcnow(),
    }

    # Add provider-specific fields
    if role == "provider":
        new_user["specialization"] = specialization
        new_user["price_per_hour"] = float(price_per_hour) if price_per_hour else 30.0
        new_user["rating"] = 0.0
        new_user["reviews_count"] = 0

    result = users_collection.insert_one(new_user)
    new_user["_id"] = result.inserted_id

    token = generate_token(result.inserted_id)
    return jsonify({
        "token": token,
        "user": serialize_user(new_user),
    }), 201


@app.route("/auth/login", methods=["POST"])
def login():
    """Login with email & password."""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password(password, user["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(user["_id"])
    return jsonify({
        "token": token,
        "user": serialize_user(user),
    }), 200


@app.route("/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    """Returns the currently authenticated user's data."""
    return jsonify({"user": serialize_user(current_user)}), 200

@app.route("/api/users/verify", methods=["PUT"])
@token_required
def verify_user(current_user):
    """Mark a user as verified in the database."""
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"is_verified": True}}
    )
    return jsonify({"message": "Account verified successfully", "is_verified": True}), 200


# ═══════════════════════════════════════════════════════
#  PROFESSIONAL ROUTES
# ═══════════════════════════════════════════════════════

@app.route("/api/professionals/nearby", methods=["GET"])
@token_required
def get_nearby_professionals(current_user):
    """
    AI-Powered Recommendation Engine:
    Find professionals near the customer and rank them
    using our scoring algorithm.
    
    Query params:
      - category: filter by specialization (optional)
      - search: search by name or title (optional)
      - radius: search radius in km (default: 50)
    """
    # Get customer's location
    user_location = current_user.get("location")
    if not user_location or not user_location.get("coordinates"):
        return jsonify({"error": "Your location is not set"}), 400

    category = request.args.get("category", "").strip()
    search = request.args.get("search", "").strip()
    radius_km = float(request.args.get("radius", 50))

    # Convert km to meters for MongoDB
    radius_meters = radius_km * 1000

    # Build match filter
    match_filter = {"role": "provider"}
    if category and category != "all":
        match_filter["specialization"] = category
    if search:
        match_filter["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"specialization": {"$regex": search, "$options": "i"}},
        ]

    # MongoDB $geoNear aggregation — finds professionals sorted by distance
    pipeline = [
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": user_location["coordinates"]  # [lng, lat]
                },
                "distanceField": "distance_meters",
                "maxDistance": radius_meters,
                "spherical": True,
                "query": match_filter
            }
        },
        {"$limit": 20}
    ]

    professionals = list(users_collection.aggregate(pipeline))

    # Apply AI scoring to each professional
    results = []
    for pro in professionals:
        distance_km = pro.get("distance_meters", 0) / 1000.0
        rating = pro.get("rating", 0)
        reviews = pro.get("reviews_count", 0)
        is_verified = pro.get("is_verified", False)
        is_online = pro.get("is_online", False)

        ai_score = calculate_ai_score(distance_km, rating, reviews, is_verified, is_online)

        results.append({
            "id": str(pro["_id"]),
            "name": pro.get("name", ""),
            "email": pro.get("email", ""),
            "specialization": pro.get("specialization", ""),
            "rating": rating,
            "reviews_count": reviews,
            "price_per_hour": pro.get("price_per_hour", 0),
            "distance_km": round(distance_km, 1),
            "is_verified": is_verified,
            "is_online": is_online,
            "location_text": pro.get("location_text", ""),
            "ai_score": ai_score,
            "bio": pro.get("bio", ""),
            "portfolio_images": pro.get("portfolio_images", []),
        })

    # Sort by AI score (highest first)
    results.sort(key=lambda x: x["ai_score"], reverse=True)

    return jsonify({
        "professionals": results,
        "total": len(results),
        "radius_km": radius_km,
    }), 200


@app.route("/api/professionals/status", methods=["PUT"])
@token_required
def update_status(current_user):
    """Toggle professional online/offline status."""
    if current_user.get("role") != "provider":
        return jsonify({"error": "Only professionals can update status"}), 403

    data = request.get_json()
    is_online = data.get("is_online", False)

    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"is_online": bool(is_online)}}
    )

    return jsonify({"is_online": bool(is_online)}), 200

@app.route("/api/professionals/stats", methods=["GET"])
@token_required
def get_professional_stats(current_user):
    """Get real-time stats for professional dashboard."""
    # Remove strict role-gate to allow all authenticated users who reach this dashboard to see their stats (which will be 0 if not a pro)
    user_id = str(current_user["_id"])
    
    # Calculate stats from bookings
    pipeline = [
        {"$match": {"provider_id": user_id, "status": "completed"}},
        {"$group": {
            "_id": None,
            "total_earnings": {"$sum": "$total_amount"},
            "completed_jobs": {"$sum": 1}
        }}
    ]
    result = list(bookings_collection.aggregate(pipeline))
    
    stats = {
        "earnings": 0,
        "completed_jobs": 0,
        "rating": current_user.get("rating", 0.0),
        "reviews_count": current_user.get("reviews_count", 0)
    }
    
    if result:
        stats["earnings"] = round(result[0].get("total_earnings", 0), 2)
        stats["completed_jobs"] = result[0].get("completed_jobs", 0)
        
    return jsonify({"stats": stats}), 200

@app.route("/api/professionals/profile", methods=["PUT"])
@token_required
def update_pro_profile(current_user):
    """Update professional bio and portfolio images."""
    if current_user.get("role") != "provider":
        return jsonify({"error": "Only providers can update profile"}), 403

    data = request.get_json()
    bio = data.get("bio")
    portfolio_images = data.get("portfolio_images", [])

    update_data = {}
    if bio is not None:
        update_data["bio"] = bio
    if portfolio_images is not None:
        update_data["portfolio_images"] = portfolio_images

    if update_data:
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )

    return jsonify({"message": "Profile updated successfully"}), 200

# ── Health Check & Catalog ────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "HOMIE API"}), 200

@app.route("/api/catalog", methods=["GET"])
def get_catalog():
    categories = [
        {
            "id": "c1",
            "name": "Cleaning",
            "icon": "✨",
            "services": [
                {"id": "s1", "name": "Deep Home Cleaning", "price": 1499, "duration": "4 hrs"},
                {"id": "s2", "name": "Sofa Cleaning", "price": 499, "duration": "1 hr"},
                {"id": "s3", "name": "Bathroom Cleaning", "price": 399, "duration": "45 mins"},
                {"id": "s_insp_1", "name": "Expert Inspection (Cleaning)", "price": 99, "duration": "30 mins", "is_inspection": True},
            ]
        },
        {
            "id": "c2",
            "name": "Repairs",
            "icon": "🔧",
            "services": [
                {"id": "s4", "name": "AC Service", "price": 599, "duration": "1.5 hrs"},
                {"id": "s5", "name": "Washing Machine Repair", "price": 499, "duration": "1 hr"},
                {"id": "s6", "name": "Refrigerator Repair", "price": 549, "duration": "1.5 hrs"},
                {"id": "s_insp_2", "name": "Expert Inspection (Repairs)", "price": 99, "duration": "30 mins", "is_inspection": True},
            ]
        },
        {
            "id": "c3",
            "name": "Electrical & Plumbing",
            "icon": "⚡",
            "services": [
                {"id": "s7", "name": "Switch Board Repair", "price": 199, "duration": "30 mins"},
                {"id": "s8", "name": "Ceiling Fan Repair", "price": 249, "duration": "45 mins"},
                {"id": "s9", "name": "Tube Light / Bulb Fitting", "price": 149, "duration": "30 mins"},
                {"id": "s10", "name": "MCB & Fuse Repair", "price": 299, "duration": "1 hr"},
                {"id": "s11", "name": "Wiring Issues", "price": 499, "duration": "1.5 hrs"},
                {"id": "s12", "name": "Tap/Pipe Leakage", "price": 199, "duration": "30 mins"},
                {"id": "s13", "name": "Washbasin Blockage", "price": 249, "duration": "45 mins"},
                {"id": "s_insp_3", "name": "Expert Inspection (Elec/Plumb)", "price": 99, "duration": "30 mins", "is_inspection": True},
            ]
        },
        {
            "id": "c4",
            "name": "Salon & Spa",
            "icon": "✂️",
            "services": [
                {"id": "s14", "name": "Men's Haircut", "price": 199, "duration": "30 mins"},
                {"id": "s15", "name": "Women's Haircut & Styling", "price": 499, "duration": "1 hr"},
                {"id": "s16", "name": "Facial & Cleanup", "price": 599, "duration": "1 hr"},
                {"id": "s17", "name": "Manicure & Pedicure", "price": 799, "duration": "1.5 hrs"},
                {"id": "s18", "name": "Full Body Massage", "price": 999, "duration": "1.5 hrs"},
                {"id": "s19", "name": "Bridal Makeup Package", "price": 2999, "duration": "3 hrs"},
                {"id": "s20", "name": "Hair Coloring & Highlights", "price": 1499, "duration": "2 hrs"},
            ]
        },
        {
            "id": "c5",
            "name": "Painting",
            "icon": "🎨",
            "services": [
                {"id": "s21", "name": "Single Room Painting", "price": 2499, "duration": "1 day"},
                {"id": "s22", "name": "Full Home Painting", "price": 8999, "duration": "3-5 days"},
                {"id": "s23", "name": "Texture Wall Finish", "price": 3999, "duration": "2 days"},
                {"id": "s24", "name": "Waterproofing Treatment", "price": 1999, "duration": "1 day"},
                {"id": "s25", "name": "Wood Polish & Varnish", "price": 999, "duration": "4 hrs"},
                {"id": "s_insp_4", "name": "Expert Inspection (Painting)", "price": 99, "duration": "30 mins", "is_inspection": True},
            ]
        }
    ]
    return jsonify({"categories": categories}), 200

# ═══════════════════════════════════════════════════════
#  GROWTH & ENGAGEMENT
# ═══════════════════════════════════════════════════════

@app.route("/api/subscription/upgrade", methods=["POST"])
@token_required
def upgrade_subscription(current_user):
    """Upgrade user to Homie Plus."""
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"subscription_status": "homie_plus"}}
    )
    return jsonify({"message": "Upgraded to Homie Plus successfully!", "subscription_status": "homie_plus"}), 200

# Insert mock promo codes on startup
promo_codes_collection.update_one(
    {"code": "WELCOME10"},
    {"$set": {"discount_percent": 10, "max_discount": 20, "is_active": True}},
    upsert=True
)

@app.route("/api/promo/validate", methods=["POST"])
@token_required
def validate_promo(current_user):
    data = request.get_json()
    code = data.get("code", "").upper()
    promo = promo_codes_collection.find_one({"code": code, "is_active": True})
    if not promo:
        return jsonify({"error": "Invalid or expired promo code"}), 400
    
    return jsonify({
        "message": "Promo code applied",
        "discount_percent": promo["discount_percent"],
        "max_discount": promo["max_discount"]
    }), 200


# ═══════════════════════════════════════════════════════
#  BOOKINGS
# ═══════════════════════════════════════════════════════

@app.route("/api/bookings/auto-match", methods=["POST"])
@token_required
def auto_match_booking(current_user):
    """
    Service-First Workflow: 
    Finds the best pro automatically based on category and location.
    Applies combo discounts and surge pricing.
    """
    data = request.get_json()
    category = data.get("category", "cleaning")
    services = data.get("services", [])
    base_amount = data.get("total_amount", 0)
    scheduled_date = data.get("scheduled_date")
    scheduled_time = data.get("scheduled_time")
    
    # 1. Find nearby online pros
    user_location = current_user.get("location")
    if not user_location:
        return jsonify({"error": "Please set your location first"}), 400

    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": user_location["coordinates"]},
                "distanceField": "distance_meters",
                "maxDistance": 10000, # 10km radius for auto-match
                "spherical": True,
                "query": {"role": "provider", "specialization": category, "is_online": True}
            }
        },
        {"$sort": {"rating": -1}}, # Priority to top-rated
        {"$limit": 1}
    ]
    
    best_pros = list(users_collection.aggregate(pipeline))
    if not best_pros:
        return jsonify({"error": "No professionals available in your area right now"}), 404
    
    provider = best_pros[0]
    
    # 2. Advanced Pricing Logic
    final_amount = base_amount
    
    # Combo Discount: 10% off if booking 3 or more services
    combo_discount = 0
    if len(services) >= 3:
        combo_discount = base_amount * 0.10
        final_amount -= combo_discount

    # Surge Pricing: 1.2x between 5 PM and 9 PM
    surge_multiplier = 1.0
    current_hour = datetime.datetime.now().hour
    if 17 <= current_hour <= 21:
        surge_multiplier = 1.2
        final_amount *= surge_multiplier

    final_amount = round(final_amount, 2)
    job_otp = str(random.randint(1000, 9999))

    booking = {
        "customer_id": str(current_user["_id"]),
        "customer_name": current_user.get("name"),
        "customer_location": current_user.get("location_text"),
        "provider_id": str(provider["_id"]),
        "provider_name": provider.get("name"),
        "services": services,
        "base_amount": base_amount,
        "combo_discount": combo_discount,
        "surge_multiplier": surge_multiplier,
        "total_amount": final_amount,
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "status": "pending",
        "job_otp": job_otp,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }

    result = bookings_collection.insert_one(booking)
    booking["_id"] = str(result.inserted_id)
    
    return jsonify({
        "message": "We found a match!",
        "booking": booking,
        "provider": {
            "name": provider["name"],
            "rating": provider.get("rating"),
            "distance_km": round(provider["distance_meters"] / 1000, 1)
        }
    }), 201



@app.route("/api/bookings", methods=["POST"])
@token_required
def create_booking(current_user):
    """Customer creates a booking with a professional."""
    if current_user.get("role") not in ["seeker", "customer"]:
        return jsonify({"error": "Only customers can book professionals"}), 403

    data = request.get_json()
    provider_id = data.get("provider_id")
    issue_description = data.get("issue_description", "")
    
    # New fields for cart & scheduling
    services = data.get("services", [])
    base_amount = data.get("total_amount", 0)
    scheduled_date = data.get("scheduled_date")
    scheduled_time = data.get("scheduled_time")
    promo_code = data.get("promo_code", "").upper()

    if not provider_id:
        return jsonify({"error": "provider_id is required"}), 400

    # Dynamic Pricing (Surge Pricing) 
    current_hour = datetime.datetime.now().hour
    # Apply 1.2x multiplier between 5 PM and 8 PM
    surge_multiplier = 1.2 if 17 <= current_hour <= 20 else 1.0
    
    total_amount = base_amount * surge_multiplier

    # Apply Homie Plus discount
    if current_user.get("subscription_status") == "homie_plus":
        total_amount = total_amount * 0.9 # 10% discount for members
        
    # Apply Promo Code
    if promo_code:
        promo = promo_codes_collection.find_one({"code": promo_code, "is_active": True})
        if promo:
            discount = total_amount * (promo["discount_percent"] / 100)
            if "max_discount" in promo and discount > promo["max_discount"]:
                discount = promo["max_discount"]
            total_amount -= discount

    total_amount = round(total_amount, 2)

    # Generate a random 4-digit OTP for starting the job later
    job_otp = str(random.randint(1000, 9999))

    booking = {
        "customer_id": str(current_user["_id"]),
        "customer_name": current_user.get("name"),
        "customer_location": current_user.get("location_text"),
        "customer_coords": current_user.get("location", {}).get("coordinates"),
        "provider_id": provider_id,
        "issue_description": issue_description,
        "services": services,
        "base_amount": base_amount,
        "surge_multiplier": surge_multiplier,
        "total_amount": total_amount,
        "promo_applied": promo_code,
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "status": "pending",  # pending -> accepted -> en_route -> in_progress -> completed
        "diagnostics_images": [],
        "job_otp": job_otp,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }

    result = bookings_collection.insert_one(booking)
    booking["_id"] = str(result.inserted_id)
    
    return jsonify({"message": "Booking created successfully", "booking": booking}), 201


@app.route("/api/bookings", methods=["GET"])
@token_required
def get_bookings(current_user):
    """Get bookings for the current user (either customer or provider)."""
    user_id = str(current_user["_id"])
    
    # Query bookings where this user is either the customer OR the provider
    query = {"$or": [{"customer_id": user_id}, {"provider_id": user_id}]}
        
    bookings = list(bookings_collection.find(query).sort("created_at", -1))
    for b in bookings:
        b["_id"] = str(b["_id"])
        # Mark the user's relationship to this booking
        b["is_provider"] = (b.get("provider_id") == user_id)
        b["is_customer"] = (b.get("customer_id") == user_id)
        # Hide OTP from provider — only the customer should see the actual code
        if b["is_provider"] and b["status"] not in ["in_progress", "completed"]:
            b["job_otp"] = "***" 

    return jsonify({"bookings": bookings}), 200


@app.route("/api/bookings/<booking_id>/status", methods=["PUT"])
@token_required
def update_booking_status(current_user, booking_id):
    """Provider updates the booking status (e.g., accepted, en_route)."""
    data = request.get_json()
    new_status = data.get("status")
    
    valid_statuses = ["accepted", "en_route", "arrived", "completed", "declined"]
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400

    user_id = str(current_user["_id"])
    
    try:
        booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        return jsonify({"error": "Invalid booking ID"}), 400
        
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    
    # Verify user is a party to this booking
    if booking.get("provider_id") != user_id and booking.get("customer_id") != user_id:
        return jsonify({"error": "You are not authorized for this booking"}), 403

    bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": new_status, "updated_at": datetime.datetime.utcnow()}}
    )

    if new_status == "arrived":
        socketio.emit('notification', {
            'type': 'otp',
            'title': 'Provider Arrived!',
            'message': f'Your provider {current_user.get("name")} has arrived. Your OTP is {booking.get("job_otp")}',
            'job_otp': booking.get("job_otp")
        }, to=booking["customer_id"])

    return jsonify({"message": f"Booking status updated to {new_status}"}), 200


@app.route("/api/bookings/<booking_id>/diagnostics", methods=["PUT"])
@token_required
def add_diagnostics(current_user, booking_id):
    """Customer adds pre-service diagnostics (images/details)."""

    data = request.get_json()
    image_url = data.get("image_url")
    details = data.get("details", "")

    if not image_url:
        return jsonify({"error": "image_url is required"}), 400

    booking = bookings_collection.find_one({"_id": ObjectId(booking_id), "customer_id": str(current_user["_id"])})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$push": {"diagnostics_images": {"url": image_url, "details": details, "added_at": datetime.datetime.utcnow()}}}
    )

    return jsonify({"message": "Diagnostics added successfully"}), 200


@app.route("/api/bookings/<booking_id>/start", methods=["POST"])
@token_required
def start_job_with_otp(current_user, booking_id):
    """Provider starts the job by submitting the OTP provided by the customer."""

    data = request.get_json()
    otp_submitted = data.get("otp")

    try:
        booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        return jsonify({"error": "Invalid booking ID format"}), 400
        
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    user_id = str(current_user["_id"])
    if booking.get("provider_id") != user_id and booking.get("customer_id") != user_id:
        return jsonify({"error": "You are not authorized for this booking"}), 403

    if booking.get("status") != "arrived":
        return jsonify({"error": f"Cannot start job from status '{booking.get('status')}'. Provider must mark as arrived first."}), 400

    if str(booking.get("job_otp")) != str(otp_submitted):
        return jsonify({"error": "Invalid OTP. Please ask the customer for the correct 4-digit code."}), 400

    bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": "in_progress", "updated_at": datetime.datetime.utcnow()}}
    )

    return jsonify({"message": "OTP verified successfully. Job started!"}), 200

# ═══════════════════════════════════════════════════════
#  CANCELLATION & RESCHEDULING
# ═══════════════════════════════════════════════════════

@app.route("/api/bookings/<booking_id>/cancel", methods=["PUT"])
@token_required
def cancel_booking(current_user, booking_id):
    """Cancel a booking. Applies a fee if canceled by customer when already accepted/en_route."""
    try:
        booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        return jsonify({"error": "Invalid booking ID format"}), 400
        
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    user_id = str(current_user["_id"])
    if booking.get("provider_id") != user_id and booking.get("customer_id") != user_id:
        return jsonify({"error": "You are not authorized for this booking"}), 403

    if booking.get("status") in ["in_progress", "completed", "cancelled"]:
        return jsonify({"error": f"Cannot cancel a booking in '{booking.get('status')}' status"}), 400

    update_data = {
        "status": "cancelled",
        "updated_at": datetime.datetime.utcnow(),
        "cancelled_by": user_id
    }

    # Cancellation fee logic for customers
    if booking.get("customer_id") == user_id and booking.get("status") in ["accepted", "en_route", "arrived"]:
        update_data["cancellation_fee"] = 50.0  # Flat ₹50 fee for late cancellation

    bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )

    return jsonify({"message": "Booking cancelled successfully", "cancellation_fee": update_data.get("cancellation_fee", 0)}), 200


@app.route("/api/bookings/<booking_id>/reschedule", methods=["PUT"])
@token_required
def reschedule_booking(current_user, booking_id):
    """Reschedule a booking to a new date and time."""
    data = request.get_json()
    new_date = data.get("scheduled_date")
    new_time = data.get("scheduled_time")

    if not new_date or not new_time:
        return jsonify({"error": "Both scheduled_date and scheduled_time are required"}), 400

    try:
        booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        return jsonify({"error": "Invalid booking ID format"}), 400
        
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    user_id = str(current_user["_id"])
    if booking.get("customer_id") != user_id:
        return jsonify({"error": "Only the customer can reschedule"}), 403

    if booking.get("status") not in ["pending", "accepted"]:
        return jsonify({"error": f"Cannot reschedule a booking in '{booking.get('status')}' status"}), 400

    bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {
            "scheduled_date": new_date,
            "scheduled_time": new_time,
            "updated_at": datetime.datetime.utcnow()
        }}
    )

    return jsonify({"message": "Booking rescheduled successfully"}), 200


# ═══════════════════════════════════════════════════════
#  REVIEWS & CATALOG
# ═══════════════════════════════════════════════════════



@app.route("/api/reviews", methods=["POST"])
@token_required
def add_review(current_user):
    """Customer submits a review after completing a job."""
    if current_user.get("role") not in ["seeker", "customer"]:
        return jsonify({"error": "Only customers can submit reviews"}), 403

    data = request.get_json()
    provider_id = data.get("provider_id")
    booking_id = data.get("booking_id")
    rating = data.get("rating")
    text = data.get("text", "")

    if not provider_id or not booking_id or rating is None:
        return jsonify({"error": "provider_id, booking_id, and rating are required"}), 400

    try:
        rating = float(rating)
        if rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
    except ValueError:
        return jsonify({"error": "Invalid rating format"}), 400

    # Ensure booking is completed and belongs to this user
    booking = bookings_collection.find_one({"_id": ObjectId(booking_id), "customer_id": str(current_user["_id"])})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    
    if booking.get("status") != "completed":
        return jsonify({"error": "Can only review completed jobs"}), 400

    # Prevent duplicate reviews for the same booking
    if reviews_collection.find_one({"booking_id": booking_id}):
        return jsonify({"error": "You have already reviewed this booking"}), 409

    review = {
        "provider_id": provider_id,
        "customer_id": str(current_user["_id"]),
        "customer_name": current_user.get("name"),
        "booking_id": booking_id,
        "rating": rating,
        "text": text,
        "created_at": datetime.datetime.utcnow()
    }
    reviews_collection.insert_one(review)

    # Update provider's average rating and count
    provider = users_collection.find_one({"_id": ObjectId(provider_id)})
    if provider:
        old_count = provider.get("reviews_count", 0)
        old_rating = provider.get("rating", 0.0)
        
        new_count = old_count + 1
        new_rating = ((old_rating * old_count) + rating) / new_count
        
        users_collection.update_one(
            {"_id": ObjectId(provider_id)},
            {"$set": {"rating": round(new_rating, 2), "reviews_count": new_count}}
        )

    return jsonify({"message": "Review submitted successfully"}), 201


@app.route("/api/professionals/<provider_id>/reviews", methods=["GET"])
def get_provider_reviews(provider_id):
    """Get all reviews for a specific provider."""
    reviews = list(reviews_collection.find({"provider_id": provider_id}).sort("created_at", -1))
    for r in reviews:
        r["_id"] = str(r["_id"])
    return jsonify({"reviews": reviews}), 200

# ═══════════════════════════════════════════════════════
#  REAL-TIME SOCKETS (Chat & Location)
# ═══════════════════════════════════════════════════════

@app.route("/api/bookings/<booking_id>/messages", methods=["GET"])
@token_required
def get_booking_messages(current_user, booking_id):
    messages = list(messages_collection.find({"booking_id": booking_id}).sort("timestamp", 1))
    for m in messages:
        m["_id"] = str(m["_id"])
    return jsonify({"messages": messages}), 200

@socketio.on('join')
def on_join(data):
    """User joins a room using their user ID to receive direct messages and updates."""
    user_id = data.get('user_id')
    if user_id:
        join_room(user_id)
        emit('system', {'msg': f'Connected to real-time server'}, to=user_id)

@socketio.on('send_message')
def on_send_message(data):
    """Send an in-app chat message between customer and provider."""
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    booking_id = data.get('booking_id')
    text = data.get('text')

    message = {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "booking_id": booking_id,
        "text": text,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    # Save to database
    messages_collection.insert_one(message.copy())
    
    # Send to receiver in real-time
    emit('receive_message', message, to=receiver_id)
    # Also echo back to sender so their UI updates
    emit('receive_message', message, to=sender_id)

@socketio.on('update_location')
def on_update_location(data):
    """Provider sends their live location."""
    provider_id = data.get('provider_id')
    customer_id = data.get('customer_id')
    lat = data.get('lat')
    lng = data.get('lng')

    # Emit to the specific customer waiting for this provider
    emit('location_update', {
        "provider_id": provider_id,
        "lat": lat,
        "lng": lng
    }, to=customer_id)

# ═══════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 50)
    print("  🏠 HOMIE Backend API (Production-Ready MVP)")
    print(f"  MongoDB: {MONGO_URI}")
    print("  Socket.IO Real-Time Engine Active")
    print("  Routes:")
    print("    POST /auth/register")
    print("    POST /auth/login")
    print("    GET  /auth/me")
    print("    GET  /api/professionals/nearby")
    print("    PUT  /api/professionals/status")
    print("=" * 50)
    socketio.run(app, debug=True, port=5000, use_reloader=False)
