import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.db.session import SessionLocal
from app.services.auth_service import AuthService
from app.services.table_service import TableService
from app.schemas.table import TableCreate


def main() -> None:
    db = SessionLocal()
    try:
        AuthService().seed_admin_user(db)
        TableService().ensure_standing_table(db)
        for i in range(1, 11):
            try:
                TableService().create_table(db, TableCreate(number=i, is_active=True))
            except Exception as exc:
                print(f"Table {i} already exists or error: {exc}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
