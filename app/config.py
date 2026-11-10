"""Configuration loading for LastWord.

Production uses AWS SSM Parameter Store (SecureString values).
Local/non-production uses environment variables with optional .env loading.
"""

from __future__ import annotations

import os
from typing import Any, Dict

import boto3
from dotenv import load_dotenv


class Config:
    """Base configuration object for the Flask application."""

    ENV = os.getenv("ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "mysql+pymysql://localhost:3306/lastword"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SCAN_SECRET = os.getenv("SCAN_SECRET", "")


class ProductionConfig(Config):
    """Production settings loaded from AWS SSM Parameter Store."""


class DevelopmentConfig(Config):
    """Local development settings loaded from environment/.env."""


def _load_from_ssm(parameter_names: list[str]) -> Dict[str, str]:
    """Fetch and decrypt values from AWS Systems Manager Parameter Store."""

    ssm = boto3.client("ssm")
    response = ssm.get_parameters(Names=parameter_names, WithDecryption=True)
    found = {item["Name"]: item["Value"] for item in response.get("Parameters", [])}
    missing = [name for name in parameter_names if name not in found]
    if missing:
        raise RuntimeError(f"Missing required SSM parameters: {missing}")
    return found


def load_config() -> Dict[str, Any]:
    """Return Flask config values from SSM in production, else from .env/env vars."""

    env = os.getenv("ENV", "development").lower()

    if env == "production":
        param_prefix = os.getenv("SSM_PREFIX", "/lastword/prod")
        names = [
            f"{param_prefix}/SECRET_KEY",
            f"{param_prefix}/DATABASE_URL",
            f"{param_prefix}/SCAN_SECRET",
        ]
        params = _load_from_ssm(names)
        return {
            "ENV": "production",
            "SECRET_KEY": params[f"{param_prefix}/SECRET_KEY"],
            "SQLALCHEMY_DATABASE_URI": params[f"{param_prefix}/DATABASE_URL"],
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "SCAN_SECRET": params[f"{param_prefix}/SCAN_SECRET"],
        }

    # Local/non-production: load from .env if present.
    load_dotenv()
    return {
        "ENV": env,
        "SECRET_KEY": os.getenv("SECRET_KEY", DevelopmentConfig.SECRET_KEY),
        "SQLALCHEMY_DATABASE_URI": os.getenv(
            "DATABASE_URL", DevelopmentConfig.SQLALCHEMY_DATABASE_URI
        ),
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "SCAN_SECRET": os.getenv("SCAN_SECRET", ""),
    }
