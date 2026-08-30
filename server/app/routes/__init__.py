from fastapi import APIRouter

from app.routes import admin, auth, students

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(admin.router)

__all__ = ["api_router"]
