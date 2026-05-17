import os
from pymongo import MongoClient
from bson import ObjectId
import datetime
import random
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["homie_db"]
users_collection = db["users"]

# Clear existing providers to start fresh
users_collection.delete_many({"role": "provider"})

names = [
    "Rahul Sharma", "Priya Patel", "Amit Singh", "Sneha Reddy", "Vikram Malhotra",
    "Anjali Gupta", "Sanjay Verma", "Deepa Iyer", "Arjun Kapoor", "Meera Nair",
    "Rohan Deshmukh", "Kavita Joshi", "Sunil Yadav", "Pooja Hegde", "Karan Johar",
    "Suhana Khan", "Abhishek Bachchan", "Aishwarya Rai", "Ranveer Singh", "Deepika Padukone"
]

specializations = ["cleaning", "repairs", "electrical", "plumbing", "salon", "painting"]

# Bangalore-ish coordinates for variety
locations = [
    {"text": "Indiranagar, Bangalore", "lat": 12.9719, "lng": 77.6412},
    {"text": "Koramangala, Bangalore", "lat": 12.9352, "lng": 77.6245},
    {"text": "HSR Layout, Bangalore", "lat": 12.9101, "lng": 77.6450},
    {"text": "Whitefield, Bangalore", "lat": 12.9698, "lng": 77.7499},
    {"text": "Jayanagar, Bangalore", "lat": 12.9308, "lng": 77.5838}
]

providers = []

for name in names:
    spec = random.choice(specializations)
    loc = random.choice(locations)
    
    # Random but realistic rating
    rating = round(random.uniform(3.8, 4.9), 1)
    reviews = random.randint(10, 150)
    price = random.choice([199, 299, 399, 499, 599, 999])
    
    provider = {
        "name": name,
        "email": name.lower().replace(" ", ".") + "@example.com",
        "password": "hashed_password_placeholder", # In real app use proper hash
        "role": "provider",
        "specialization": spec,
        "price_per_hour": price,
        "rating": rating,
        "reviews_count": reviews,
        "is_verified": random.choice([True, True, False]), # Mostly verified
        "is_online": random.choice([True, True, True, False]), # Mostly online
        "location_text": loc["text"],
        "location": {
            "type": "Point",
            "coordinates": [loc["lng"], loc["lat"]]
        },
        "created_at": datetime.datetime.utcnow()
    }
    providers.append(provider)

users_collection.insert_many(providers)
print(f"Successfully injected {len(providers)} mock professionals!")
