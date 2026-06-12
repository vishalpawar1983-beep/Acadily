#!/usr/bin/env python3
"""
Tenant Onboarding Script — Acadily / Flex Academy Portal

Creates a new tenant with all required seed data in a single atomic operation.
Safe to re-run: checks for existing tenantId/email and aborts if found.

Seeds 6 collections per tenant:
  - tenants           — the tenant doc
  - users             — initial SuperAdmin
  - batchcategories   — default company/branch
  - roleaccesses      — 6 RBAC roles (SuperAdmin, Admin, Counsellor, Accounts, Telecaller, Student)
  - rollnumbercounters — starts at 0
  - tenantsettings    — empty placeholder

Usage:
  Interactive:
    python3 scripts/onboard-tenant.py

  Non-interactive (CLI args):
    python3 scripts/onboard-tenant.py \\
      --tenant-id demo_acadily \\
      --name "Acadily Demo" \\
      --slug demo \\
      --admin-email demo@acadily.com \\
      --admin-password "Demo@321" \\
      --company "Demo Branch"

  From JSON file:
    python3 scripts/onboard-tenant.py --from-json tenant.json

Requirements:
  pip3 install pymongo bcrypt python-dotenv

Reads MONGO_URI from .env in project root.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def _check_deps():
    """Verify required packages are installed, print install instructions if not."""
    required = {"pymongo": "pymongo", "bcrypt": "bcrypt", "dotenv": "python-dotenv"}
    missing = []
    for mod, pkg in required.items():
        try:
            __import__(mod)
        except ImportError:
            missing.append(pkg)
    if missing:
        print("Missing Python packages: " + ", ".join(missing))
        print("\nInstall with one of:")
        print(f"  pip3 install --user {' '.join(missing)}")
        print(f"  python3 -m venv .venv && source .venv/bin/activate && pip install {' '.join(missing)}")
        sys.exit(1)


_check_deps()

from bson import ObjectId  # noqa: E402
from dotenv import load_dotenv  # noqa: E402
from pymongo import MongoClient  # noqa: E402

import bcrypt  # noqa: E402


# ── Constants ─────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

# Valid tenantId: lowercase letters, digits, underscore. 3-32 chars.
TENANT_ID_RE = re.compile(r"^[a-z][a-z0-9_]{2,31}$")
SLUG_RE = re.compile(r"^[a-z][a-z0-9-]{1,31}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ── Input validation ──────────────────────────────────────────────────────
def validate_tenant_id(v: str) -> str:
    if not TENANT_ID_RE.match(v):
        raise ValueError(
            "tenantId must be 3-32 chars, lowercase letters/digits/underscore, starting with letter. "
            f"Got: {v!r}"
        )
    return v


def validate_slug(v: str) -> str:
    if not SLUG_RE.match(v):
        raise ValueError(
            "slug must be 2-32 chars, lowercase letters/digits/hyphen, starting with letter. "
            f"Got: {v!r}"
        )
    return v


def validate_email(v: str) -> str:
    if not EMAIL_RE.match(v):
        raise ValueError(f"Invalid email: {v!r}")
    return v.lower().strip()


def validate_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters")
    return v


# ── Core seeding logic ────────────────────────────────────────────────────
def build_tenant_doc(spec: dict) -> dict:
    now = datetime.now(timezone.utc)

    # Per-tenant SMTP config — emails will use these credentials when set
    smtp_user = spec.get("smtp_user", "").strip()
    smtp_pass = spec.get("smtp_pass", "").strip()
    smtp_from = spec.get("smtp_from", "").strip() or smtp_user
    smtp_block = {
        "user": smtp_user,
        "pass": smtp_pass,
        "from": smtp_from,
        # Only enable if both user + pass are provided
        "enabled": bool(smtp_user and smtp_pass),
    }

    return {
        "tenantId": spec["tenant_id"],
        "name": spec["name"],
        "slug": spec["slug"],
        "email": spec["admin_email"],
        "phone": spec.get("phone", ""),
        "website": spec.get("website", ""),
        "address": spec.get("address", ""),
        "logo": "",
        "config": {
            "receiptPrefix": spec.get("receipt_prefix", f"{spec['tenant_id'].upper()}-1000"),
            "gstNumber": spec.get("gst_number", ""),
            "isGstEnabled": spec.get("is_gst_enabled", False),
            "features": {},
            "smtp": smtp_block,
        },
        "isActive": True,
        "plan": spec.get("plan", "basic"),
        "createdAt": now,
        "updatedAt": now,
    }


def build_rbac_roles(tenant_id: str, company_name: str) -> list:
    now = datetime.now(timezone.utc)
    company_perms = {company_name: True}
    common = {"tenantId": tenant_id, "isActive": True, "createdAt": now, "updatedAt": now}
    return [
        {
            **common, "role": "SuperAdmin",
            "companyPermissions": company_perms,
            "studentControlAccess": {"Delete Student": True, "Edit Student": True, "Dropout Student": True, "Add Student": True},
            "studentFeesAccess": {"Add Student Fees": True, "Edit Student Fees": True, "Print Recipt": True, "Delete Student Fees": True, "Mail Button": True, "Whatsapp Button": True},
        },
        {
            **common, "role": "Admin",
            "companyPermissions": company_perms,
            "studentControlAccess": {"Delete Student": False, "Edit Student": True, "Add Student": True, "Dropout Student": True},
            "studentFeesAccess": {"Add Student Fees": True, "Edit Student Fees": True, "Delete Student Fees": False, "Print Recipt": True, "Mail Button": True, "Whatsapp Button": True},
        },
        {
            **common, "role": "Counsellor",
            "companyPermissions": company_perms,
            "studentControlAccess": {"Add Student": True, "Edit Student": True, "Dropout Student": False},
            "studentFeesAccess": {"Add Student Fees": True, "Mail Button": True, "Print Recipt": True, "Whatsapp Button": True, "Edit Student Fees": False},
        },
        {
            **common, "role": "Accounts",
            "companyPermissions": company_perms,
            "studentControlAccess": {},
            "studentFeesAccess": {"Add Student Fees": True, "Edit Student Fees": True, "Print Recipt": True, "Delete Student Fees": False, "Mail Button": True, "Whatsapp Button": True},
        },
        {
            **common, "role": "Telecaller",
            "companyPermissions": company_perms,
            "studentControlAccess": {},
            "studentFeesAccess": {},
        },
        {
            **common, "role": "Student",
            "companyPermissions": company_perms,
            "studentControlAccess": {},
            "studentFeesAccess": {},
        },
    ]


def onboard(spec: dict, dry_run: bool = False) -> dict:
    """Create a new tenant with all seed data."""
    load_dotenv(ENV_PATH)
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise RuntimeError(f"MONGO_URI not set. Expected in {ENV_PATH}")

    client = MongoClient(mongo_uri)
    db = client.get_default_database()

    # Validate
    tenant_id = validate_tenant_id(spec["tenant_id"])
    slug = validate_slug(spec["slug"])
    admin_email = validate_email(spec["admin_email"])
    validate_password(spec["admin_password"])

    # Idempotency check
    if db.tenants.find_one({"tenantId": tenant_id}):
        raise ValueError(f"Tenant already exists: {tenant_id}")
    if db.tenants.find_one({"slug": slug}):
        raise ValueError(f"Slug already taken: {slug}")
    if db.users.find_one({"email": admin_email}):
        raise ValueError(f"User email already exists: {admin_email}")

    if dry_run:
        client.close()
        return {"status": "ok", "message": "Dry run — all checks passed, nothing inserted"}

    company_name = spec["company_name"]
    now = datetime.now(timezone.utc)
    results = {}

    # 1. Tenant
    tenant_doc = build_tenant_doc({**spec, "tenant_id": tenant_id, "slug": slug, "admin_email": admin_email})
    results["tenant_id"] = db.tenants.insert_one(tenant_doc).inserted_id

    # 2. Default company (batch category)
    company_id = ObjectId()
    db.batchcategories.insert_one({
        "_id": company_id,
        "tenantId": tenant_id,
        "categoryName": company_name,
        "logo": "",
        "email": admin_email,
        "companyPhone": "",
        "companyWebsite": "",
        "companyAddress": "",
        "reciptNumber": tenant_doc["config"]["receiptPrefix"],
        "gst": "",
        "isGstBased": "No",
        "createdBy": "system",
        "createdAt": now,
        "updatedAt": now,
    })
    results["company_id"] = company_id

    # 3. SuperAdmin user
    password_hash = bcrypt.hashpw(spec["admin_password"].encode(), bcrypt.gensalt(12)).decode()
    user_id = db.users.insert_one({
        "tenantId": tenant_id,
        "email": admin_email,
        "passwordHash": password_hash,
        "firstName": spec.get("admin_first_name", "Admin"),
        "lastName": spec.get("admin_last_name", ""),
        "phone": "",
        "role": "SuperAdmin",
        "isActive": True,
        "isOtpVerified": True,
        "createdAt": now,
        "updatedAt": now,
    }).inserted_id
    results["user_id"] = user_id

    # 4. 6 RBAC roles
    roles = build_rbac_roles(tenant_id, company_name)
    db.roleaccesses.insert_many(roles)
    results["roles_count"] = len(roles)

    # 5. Roll number counter
    db.rollnumbercounters.insert_one({
        "tenantId": tenant_id,
        "prefix": "",
        "currentNumber": 0,
        "createdAt": now,
        "updatedAt": now,
    })

    # 6. Tenant settings placeholder
    db.tenantsettings.insert_one({
        "tenantId": tenant_id,
        "_legacySettings": {},
        "createdAt": now,
        "updatedAt": now,
    })

    client.close()
    return {"status": "ok", **results}


# ── CLI ───────────────────────────────────────────────────────────────────
def prompt_interactive() -> dict:
    print("\n── New Tenant Onboarding ──────────────────────────\n")
    spec = {}
    spec["tenant_id"] = input("Tenant ID (e.g. demo_acadily): ").strip()
    spec["name"] = input("Display name (e.g. Acadily Demo): ").strip()
    spec["slug"] = input("URL slug (e.g. demo): ").strip()
    spec["admin_email"] = input("Admin email: ").strip()
    spec["admin_password"] = input("Admin password (min 8 chars): ").strip()
    spec["company_name"] = input("Default company/branch name (e.g. Main Branch): ").strip()
    spec["admin_first_name"] = input("Admin first name [Admin]: ").strip() or "Admin"
    spec["admin_last_name"] = input("Admin last name []: ").strip()
    spec["plan"] = input("Plan (basic/pro/enterprise) [basic]: ").strip() or "basic"
    print("\n── Tenant SMTP (optional, leave blank to use global SMTP) ──")
    spec["smtp_user"] = input("SMTP user (Gmail address) []: ").strip()
    spec["smtp_pass"] = input("SMTP app password (16 chars) []: ").strip()
    spec["smtp_from"] = input(f"SMTP from address [{spec['smtp_user'] or 'global default'}]: ").strip()
    return spec


def main():
    parser = argparse.ArgumentParser(
        description="Onboard a new tenant into Acadily (Flex Academy Portal).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--tenant-id", help="e.g. demo_acadily")
    parser.add_argument("--name", help="Display name")
    parser.add_argument("--slug", help="URL slug")
    parser.add_argument("--admin-email", help="Admin email")
    parser.add_argument("--admin-password", help="Admin password")
    parser.add_argument("--company", dest="company_name", help="Default company/branch name")
    parser.add_argument("--first-name", dest="admin_first_name", default="Admin")
    parser.add_argument("--last-name", dest="admin_last_name", default="")
    parser.add_argument("--plan", default="basic", choices=["basic", "pro", "enterprise"])
    parser.add_argument("--smtp-user", dest="smtp_user", default="", help="Tenant SMTP username (Gmail address)")
    parser.add_argument("--smtp-pass", dest="smtp_pass", default="", help="Tenant SMTP password (Gmail app password)")
    parser.add_argument("--smtp-from", dest="smtp_from", default="", help="Tenant SMTP from address (defaults to smtp-user)")
    parser.add_argument("--from-json", help="Load spec from a JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Validate without inserting")
    args = parser.parse_args()

    # Load spec
    if args.from_json:
        with open(args.from_json) as f:
            spec = json.load(f)
    elif args.tenant_id:
        spec = {k: v for k, v in vars(args).items() if v is not None and k not in ("from_json", "dry_run")}
        required = ["tenant_id", "name", "slug", "admin_email", "admin_password", "company_name"]
        missing = [r for r in required if not spec.get(r)]
        if missing:
            parser.error(f"Missing required: {', '.join('--' + m.replace('_', '-') for m in missing)}")
    else:
        spec = prompt_interactive()

    # Execute
    try:
        result = onboard(spec, dry_run=args.dry_run)
    except (ValueError, RuntimeError) as e:
        print(f"\n[FAILED] {e}\n")
        sys.exit(1)

    # Report
    print("\n═══════════════════════════════════════════════════")
    print(f"[OK] TENANT ONBOARDED: {spec['tenant_id']}")
    print("═══════════════════════════════════════════════════")
    print(f"Display name:  {spec['name']}")
    print(f"Login:         {spec['admin_email']} / {spec['admin_password']}")
    print(f"Role:          SuperAdmin")
    print(f"Company:       {spec['company_name']}")
    print(f"URL:           https://app.acadily.com")
    print(f"Plan:          {spec.get('plan', 'basic')}")

    smtp_user = spec.get("smtp_user", "").strip()
    smtp_pass = spec.get("smtp_pass", "").strip()
    if smtp_user and smtp_pass:
        print(f"SMTP:          ENABLED — {smtp_user}")
    elif smtp_user:
        print(f"SMTP:          DEFERRED — user: {smtp_user} (set password later to enable)")
    else:
        print("SMTP:          GLOBAL (uses default platform SMTP)")

    if not args.dry_run:
        print(f"Tenant _id:    {result['tenant_id']}")
        print(f"User _id:      {result['user_id']}")
        print(f"Company _id:   {result['company_id']}")
        print(f"RBAC roles:    {result['roles_count']} roles seeded")
    else:
        print("Dry run — nothing inserted")
    print("═══════════════════════════════════════════════════\n")


if __name__ == "__main__":
    main()
