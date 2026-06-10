import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_current_user

# Override the authentication dependency
def mock_get_current_user():
    return "test_clerk_id_123"

app.dependency_overrides[get_current_user] = mock_get_current_user

def run_tests():
    with TestClient(app) as client:
        print("--- Testing Health Check ---")
        response = client.get("/")
        print(f"Status: {response.status_code}, Body: {response.json()}")
        
        print("\n--- Testing POST /auth/sync ---")
        response = client.post("/auth/sync", json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test_bot@example.com",
            "image_url": "http://example.com/image.png"
        })
        print(f"Status: {response.status_code}, Body: {response.json()}")
        
        print("\n--- Testing GET /users/me ---")
        response = client.get("/users/me")
        print(f"Status: {response.status_code}, Body: {response.json()}")

        print("\n--- Testing GET /chats ---")
        response = client.get("/chats")
        print(f"Status: {response.status_code}, Body: {response.json()}")
        
        print("\n--- Testing GET /files ---")
        response = client.get("/files")
        print(f"Status: {response.status_code}, Body: {response.json()}")

if __name__ == "__main__":
    run_tests()
