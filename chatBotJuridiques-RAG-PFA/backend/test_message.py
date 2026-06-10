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
        # Create a session
        print("--- POST /chats ---")
        response = client.post("/chats", json={"titre": "Test Session"})
        print(f"Status: {response.status_code}")
        session_id = response.json()["id"]
        print(f"Session ID: {session_id}")
        
        # Send a message
        print(f"\n--- POST /chats/{session_id}/messages ---")
        response = client.post(f"/chats/{session_id}/messages", json={
            "contenu": "ما هي شروط استخراج رخصة القيادة في المغرب؟"
        })
        print(f"Status: {response.status_code}")
        try:
            print(f"Body: {response.json()}")
        except Exception as e:
            print(f"Failed to parse JSON: {e}")
            print(f"Raw text: {response.text}")

if __name__ == "__main__":
    run_tests()
