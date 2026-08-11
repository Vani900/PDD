import asyncio
import os
import sys
from dotenv import load_dotenv

# Set sys.path so backend app modules resolve cleanly in IDE and scripts
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Load backend .env file
load_dotenv(os.path.join(backend_path, ".env"))

# Set UTF-8 encoding for stdout
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import select
# pyrefly: ignore [missing-import]
from app.infrastructure.database.session import AsyncSessionLocal
# pyrefly: ignore [missing-import]
from app.infrastructure.database.models.users import User
# pyrefly: ignore [missing-import]
from app.infrastructure.database.models.organizations import Organization, NGORequirement, DonationMatch
# pyrefly: ignore [missing-import]
from app.infrastructure.database.models.donations import Donation

async def main():
    async with AsyncSessionLocal() as session:
        print("\n### 👤 Users Table (`users`)\n")
        users = (await session.execute(select(User).limit(20))).scalars().all()
        print("| ID | Name | Email | Role | Is Verified |")
        print("| :--- | :--- | :--- | :--- | :--- |")
        for u in users:
            name = f"{u.first_name or ''} {u.last_name or ''}".strip() or "N/A"
            print(f"| `{str(u.id)[:8]}...` | {name} | {u.email} | `{u.role}` | {u.is_verified} |")

        print("\n### 🏢 NGOs Table (`organizations`)\n")
        orgs = (await session.execute(select(Organization).limit(20))).scalars().all()
        print("| ID | Organization Name | City | Status | Type |")
        print("| :--- | :--- | :--- | :--- | :--- |")
        for o in orgs:
            print(f"| `{str(o.id)[:8]}...` | {o.name} | {o.city} | `{o.status}` | `{o.org_type}` |")

        print("\n### 🎁 Donations Table (`donations`)\n")
        donations = (await session.execute(select(Donation).order_by(Donation.created_at.desc()).limit(20))).scalars().all()
        print("| ID | Tracking # | Title | Type | City | Status |")
        print("| :--- | :--- | :--- | :--- | :--- | :--- |")
        for d in donations:
            print(f"| `{str(d.id)[:8]}...` | `{d.tracking_number}` | {d.title or 'N/A'} | `{d.donation_type}` | {d.pickup_city} | `{d.status}` |")

        print("\n### 📋 NGO Requirements/Demands Table (`ngo_requirements`)\n")
        reqs = (await session.execute(select(NGORequirement).order_by(NGORequirement.created_at.desc()).limit(20))).scalars().all()
        print("| ID | Item Name | Category | City | Urgency | Status |")
        print("| :--- | :--- | :--- | :--- | :--- | :--- |")
        for r in reqs:
            print(f"| `{str(r.id)[:8]}...` | {r.item_name} | `{r.category}` | {r.city} | `{r.urgency}` | `{r.status}` |")

        print("\n### 🔄 Donation Matches Table (`donation_matches`)\n")
        matches = (await session.execute(select(DonationMatch).order_by(DonationMatch.created_at.desc()).limit(20))).scalars().all()
        print("| Match ID | Donation ID | Requirement ID | Status | Requested Message | Response Message |")
        print("| :--- | :--- | :--- | :--- | :--- | :--- |")
        for m in matches:
            req_str = f"`{str(m.requirement_id)[:8]}...`" if m.requirement_id else "N/A"
            req_msg = m.request_message[:30] + "..." if m.request_message and len(m.request_message) > 30 else (m.request_message or "-")
            res_msg = m.response_message[:30] + "..." if m.response_message and len(m.response_message) > 30 else (m.response_message or "-")
            print(f"| `{str(m.id)[:8]}...` | `{str(m.donation_id)[:8]}...` | {req_str} | `{m.status}` | {req_msg} | {res_msg} |")

if __name__ == "__main__":
    asyncio.run(main())
