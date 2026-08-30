from fastapi import status


class AppException(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class DuplicateEmailException(AppException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_409_CONFLICT, "An account with this email already exists")


class InvalidCredentialsException(AppException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")


class InvalidTokenException(AppException):
    def __init__(self, detail: str = "Invalid or expired authentication token") -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail)


class ForbiddenException(AppException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, "You do not have permission to access this resource")
