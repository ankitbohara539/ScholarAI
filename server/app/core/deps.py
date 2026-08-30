"""Backward-compatible imports for the original module name."""

from app.core.dependencies import get_current_user, require_roles

__all__ = ["get_current_user", "require_roles"]
