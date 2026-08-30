from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository


def main() -> None:
    full_name = input("Admin full name: ").strip()
    email_input = input("Admin email: ").strip().lower()
    try:
        email = str(TypeAdapter(EmailStr).validate_python(email_input))
    except ValidationError as exc:
        raise SystemExit("A valid email address is required") from exc

    password = getpass("Admin password (minimum 8 characters): ")
    if len(password) < 8:
        raise SystemExit("Password must contain at least 8 characters")

    with SessionLocal() as db:
        repository = UserRepository(db)
        if repository.get_by_email(email):
            raise SystemExit("A user with this email already exists")
        repository.create(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
        )
    print("Admin account created successfully")


if __name__ == "__main__":
    main()
