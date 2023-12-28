"""Backward-compatible import for deployments that used this module."""

from .asgi import application

__all__ = ["application"]
