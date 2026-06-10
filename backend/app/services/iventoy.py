import httpx

from ..config import IVENTOY_API_URL


class IventoyClient:
    def __init__(self):
        self.base = IVENTOY_API_URL
        self.client = httpx.Client(base_url=self.base, timeout=10)

    def get_status(self) -> dict:
        r = self.client.get("/api/status")
        r.raise_for_status()
        return r.json()

    def list_isos(self) -> list[dict]:
        try:
            r = self.client.get("/api/iso/list")
            r.raise_for_status()
            return r.json().get("data", [])
        except Exception:
            return []

    def add_iso(self, filename: str) -> bool:
        try:
            r = self.client.post(f"/api/iso/add?path={filename}")
            return r.is_success
        except Exception:
            return False

    def remove_iso(self, filename: str) -> bool:
        try:
            r = self.client.post(f"/api/iso/remove?path={filename}")
            return r.is_success
        except Exception:
            return False

    def list_clients(self) -> list[dict]:
        try:
            r = self.client.get("/api/client/list")
            r.raise_for_status()
            return r.json().get("data", [])
        except Exception:
            return []
