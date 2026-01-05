from typing import List, Optional
from fastapi import APIRouter

from app.models.client import Client

router = APIRouter(prefix="/clients", tags=["clients"])

# Temporary in-memory "DB"
CLIENTS_DB = [
    Client(id=1, name="Mario Rossi", profession="Doctor", segment="Gold"),
    Client(id=2, name="Anna Bianchi", profession="Engineer", segment="Silver"),
    Client(id=3, name="Mario Rossi", profession="Teacher", segment="Bronze"),
]


@router.get("/", response_model=List[Client])
def list_clients(
    client_id: Optional[int] = None,
    name: Optional[str] = None,
    profession: Optional[str] = None,
    segment: Optional[str] = None,
):
    """
    GET /api/v1/clients?client_id=1&name=Mario&segment=Gold
    """
    results = CLIENTS_DB

    if client_id is not None:
        results = [c for c in results if c.id == client_id]

    if name is not None:
        name_lower = name.lower()
        results = [c for c in results if name_lower in c.name.lower()]

    if profession is not None:
        profession_lower = profession.lower()
        results = [c for c in results if profession_lower in c.profession.lower()]

    if segment is not None:
        segment_lower = segment.lower()
        results = [c for c in results if segment_lower in c.segment.lower()]

    return results
