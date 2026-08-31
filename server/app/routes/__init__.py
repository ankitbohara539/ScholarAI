from fastapi import APIRouter

from app.routes import admin, admin_students, admin_universities, auth, notifications, recommendations, students, universities

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(admin.router)
api_router.include_router(admin_universities.router)
api_router.include_router(admin_students.router)
api_router.include_router(universities.router)
api_router.include_router(notifications.router)
api_router.include_router(recommendations.router)

__all__ = ["api_router"]
