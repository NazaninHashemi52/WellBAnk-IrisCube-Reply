from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Client Manager API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./clients.db"
    UPLOAD_DIR: str = "uploads"   # <--- add this

    class Config:
        env_file = ".env"


settings = Settings()
