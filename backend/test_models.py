import requests
import json

GROQ_API_KEY = "gsk_your_groq_api_key"
url = "https://api.groq.com/openai/v1/models"

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    models = response.json().get('data', [])
    
    # Filter out only the model IDs
    model_ids = [m['id'] for m in models]
    
    with open('models.json', 'w', encoding='utf-8') as f:
        json.dump(model_ids, f, indent=4)
        
    print(f"Successfully retrieved {len(model_ids)} Groq models. Saved to models.json.")
    print("Available Groq Models:")
    for m in model_ids:
        print(f"- {m}")
except Exception as e:
    print("Error:", e)
