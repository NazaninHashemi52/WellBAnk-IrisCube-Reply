from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "WellBank CRM API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./wellbank.db"
    UPLOAD_DIR: str = "uploads"
    ANTHROPIC_API_KEY: str = ""  # Anthropic Claude API key for AI features

    class Config:
        env_file = ".env"


settings = Settings()
