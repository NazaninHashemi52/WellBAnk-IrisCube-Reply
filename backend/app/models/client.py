from pydantic import BaseModel


class Client(BaseModel):
    id: int
    name: str
    profession: str
    segment: str
