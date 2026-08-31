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


class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class ConflictException(AppException):
    def __init__(self, detail: str) -> None:
        super().__init__(status.HTTP_409_CONFLICT, detail)


class BusinessRuleException(AppException):
    def __init__(self, detail: str) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class ModelUnavailableException(AppException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_503_SERVICE_UNAVAILABLE, "Recommendation model is currently unavailable")
