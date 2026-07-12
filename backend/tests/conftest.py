import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")
os.environ.setdefault(
    "DATABASE_URL", "postgresql+psycopg://smms:smms@localhost:5432/smms_test"
)
