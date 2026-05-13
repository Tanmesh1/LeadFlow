import argparse
import asyncio
import sys
from datetime import UTC, datetime, time, timedelta
from pathlib import Path
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_DIR))

from app.config import get_settings  # noqa: E402


SEED_SOURCE = "leadflow-demo-seed"


def at_today(hour: int, minute: int = 0) -> datetime:
    today = datetime.now(UTC).date()
    return datetime.combine(today, time(hour=hour, minute=minute), tzinfo=UTC)


def days_ago(days: int, hour: int, minute: int = 0) -> datetime:
    return at_today(hour, minute) - timedelta(days=days)


def days_from_now(days: int, hour: int, minute: int = 0) -> datetime:
    return at_today(hour, minute) + timedelta(days=days)


def lead_document(
    lead_id: ObjectId,
    *,
    name: str,
    email: str,
    phone: str,
    company: str,
    source: str,
    status: str,
    notes: str,
    created_at: datetime,
) -> dict[str, Any]:
    return {
        "_id": lead_id,
        "name": name,
        "email": email,
        "phone": phone,
        "company": company,
        "source": source,
        "notes": notes,
        "status": status,
        "createdAt": created_at,
        "updatedAt": created_at,
        "seedSource": SEED_SOURCE,
    }


def discussion_document(
    lead_id: ObjectId,
    *,
    content: str,
    created_by: str,
    created_at: datetime,
    follow_up_at: datetime | None = None,
) -> dict[str, Any]:
    return {
        "_id": ObjectId(),
        "leadId": lead_id,
        "content": content,
        "createdBy": created_by,
        "followUpAt": follow_up_at,
        "createdAt": created_at,
        "updatedAt": created_at,
        "seedSource": SEED_SOURCE,
    }


def build_seed_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    leads_by_key = {
        "mira": ObjectId(),
        "owen": ObjectId(),
        "priya": ObjectId(),
        "marcus": ObjectId(),
        "elena": ObjectId(),
        "ben": ObjectId(),
        "sophia": ObjectId(),
    }

    leads = [
        lead_document(
            leads_by_key["mira"],
            name="Mira Shah",
            email="mira.shah@northstarbi.com",
            phone="+1 415-555-0174",
            company="Northstar BI",
            source="LinkedIn outreach",
            status="qualified",
            notes="VP Operations evaluating workflow automation for a 45-person revenue team.",
            created_at=days_ago(18, 10, 15),
        ),
        lead_document(
            leads_by_key["owen"],
            name="Owen Brooks",
            email="owen@harborandfinch.com",
            phone="+1 206-555-0148",
            company="Harbor & Finch",
            source="Website demo request",
            status="proposal_sent",
            notes="Needs multi-location lead routing before their summer expansion.",
            created_at=days_ago(12, 14, 20),
        ),
        lead_document(
            leads_by_key["priya"],
            name="Priya Nair",
            email="priya.nair@carebridgehealth.com",
            phone="+1 312-555-0188",
            company="CareBridge Health",
            source="Referral",
            status="contacted",
            notes="Referral from existing customer. Interested in faster follow-up SLAs.",
            created_at=days_ago(7, 9, 5),
        ),
        lead_document(
            leads_by_key["marcus"],
            name="Marcus Chen",
            email="marcus.chen@atlasware.io",
            phone="+1 646-555-0191",
            company="Atlasware",
            source="Product webinar",
            status="won",
            notes="Closed annual plan after security and CRM integration review.",
            created_at=days_ago(29, 11, 30),
        ),
        lead_document(
            leads_by_key["elena"],
            name="Elena Torres",
            email="elena@brightleaf.studio",
            phone="+1 512-555-0133",
            company="Brightleaf Studio",
            source="Cold email",
            status="lost",
            notes="Liked product but budget was pushed to next quarter.",
            created_at=days_ago(21, 15, 45),
        ),
        lead_document(
            leads_by_key["ben"],
            name="Ben Whitaker",
            email="ben.whitaker@redwoodlogistics.com",
            phone="+1 303-555-0162",
            company="Redwood Logistics",
            source="Trade show scan",
            status="new",
            notes="Asked for a practical follow-up after meeting at OpsTech Expo.",
            created_at=days_ago(2, 16, 10),
        ),
        lead_document(
            leads_by_key["sophia"],
            name="Sophia Martin",
            email="sophia.martin@greenlineenergy.com",
            phone="+1 617-555-0182",
            company="Greenline Energy",
            source="Partner intro",
            status="qualified",
            notes="Comparing LeadFlow against two enterprise CRM add-ons.",
            created_at=days_ago(14, 13, 0),
        ),
    ]

    discussions = [
        discussion_document(
            leads_by_key["mira"],
            content="Discovery call went well. Mira confirmed their main pain is leads sitting untouched after webinars. Current process relies on spreadsheets and one coordinator assigning owners manually.",
            created_by="Avery Stone",
            created_at=days_ago(16, 11, 0),
            follow_up_at=days_ago(12, 10, 0),
        ),
        discussion_document(
            leads_by_key["mira"],
            content="Sent workflow mapping notes and a sample dashboard. She asked whether managers can see overdue follow-ups by rep and export weekly CSV summaries.",
            created_by="Avery Stone",
            created_at=days_ago(10, 15, 30),
            follow_up_at=days_ago(3, 9, 30),
        ),
        discussion_document(
            leads_by_key["mira"],
            content="Left voicemail after missed stakeholder review. Need to re-engage and offer a shorter buying committee walkthrough.",
            created_by="Jordan Lee",
            created_at=days_ago(3, 9, 20),
            follow_up_at=days_ago(1, 11, 0),
        ),
        discussion_document(
            leads_by_key["owen"],
            content="Owen requested demo for three franchise locations. He wants each location manager to own local leads while corporate tracks overall pipeline quality.",
            created_by="Jordan Lee",
            created_at=days_ago(11, 13, 15),
            follow_up_at=days_ago(8, 12, 0),
        ),
        discussion_document(
            leads_by_key["owen"],
            content="Demo completed with operations and finance. Strong interest in automated reminders and status aging. Finance asked for implementation timeline and annual pricing.",
            created_by="Avery Stone",
            created_at=days_ago(7, 16, 45),
            follow_up_at=days_ago(4, 14, 30),
        ),
        discussion_document(
            leads_by_key["owen"],
            content="Proposal sent for 18 seats with onboarding package. Owen said the team is targeting a decision this week if legal can review terms quickly.",
            created_by="Avery Stone",
            created_at=days_ago(2, 10, 10),
            follow_up_at=at_today(15, 0),
        ),
        discussion_document(
            leads_by_key["priya"],
            content="Intro call from CareBridge referral. Priya is evaluating whether LeadFlow can help their intake team respond to partner referrals within one business day.",
            created_by="Nina Patel",
            created_at=days_ago(6, 10, 40),
            follow_up_at=days_ago(4, 9, 0),
        ),
        discussion_document(
            leads_by_key["priya"],
            content="Shared healthcare implementation checklist. She asked for examples of notes hygiene, owner handoff, and how lost reasons are captured for reporting.",
            created_by="Nina Patel",
            created_at=days_ago(3, 12, 15),
            follow_up_at=at_today(11, 30),
        ),
        discussion_document(
            leads_by_key["marcus"],
            content="Atlasware webinar attendee. Marcus said their sales-assist team is growing quickly and they need a lightweight CRM workflow before adding Salesforce complexity.",
            created_by="Jordan Lee",
            created_at=days_ago(28, 14, 0),
            follow_up_at=days_ago(24, 10, 30),
        ),
        discussion_document(
            leads_by_key["marcus"],
            content="Technical review covered SSO expectations, API export needs, and audit history. No blocker found for the pilot.",
            created_by="Avery Stone",
            created_at=days_ago(20, 15, 10),
            follow_up_at=days_ago(17, 13, 0),
        ),
        discussion_document(
            leads_by_key["marcus"],
            content="Procurement approved annual plan for 32 users. Customer wants onboarding to begin next Monday with sales operations and two managers.",
            created_by="Avery Stone",
            created_at=days_ago(8, 17, 25),
        ),
        discussion_document(
            leads_by_key["elena"],
            content="Initial cold email response was positive. Elena manages a small studio and wanted a simpler way to keep inbound brand inquiries from getting buried.",
            created_by="Nina Patel",
            created_at=days_ago(19, 11, 50),
            follow_up_at=days_ago(15, 10, 0),
        ),
        discussion_document(
            leads_by_key["elena"],
            content="Demo focused on contact history and follow-up reminders. She liked the interface but asked whether there is a solo-founder discount.",
            created_by="Nina Patel",
            created_at=days_ago(13, 14, 5),
            follow_up_at=days_ago(9, 16, 0),
        ),
        discussion_document(
            leads_by_key["elena"],
            content="Elena passed for now because Q2 budget is already committed to hiring contractors. Good candidate to revisit next quarter with a smaller starter package.",
            created_by="Nina Patel",
            created_at=days_ago(5, 10, 35),
        ),
        discussion_document(
            leads_by_key["ben"],
            content="Met Ben at OpsTech Expo booth. He was interested in lead capture from trade shows and asked for a follow-up once he is back from travel.",
            created_by="Jordan Lee",
            created_at=days_ago(2, 16, 20),
            follow_up_at=days_from_now(1, 9, 15),
        ),
        discussion_document(
            leads_by_key["ben"],
            content="Sent concise recap with two customer stories from logistics teams. No qualification call scheduled yet.",
            created_by="Jordan Lee",
            created_at=days_ago(1, 10, 0),
        ),
        discussion_document(
            leads_by_key["sophia"],
            content="Partner intro with Sophia and RevOps lead. They need stronger pipeline visibility for commercial solar opportunities across five regional teams.",
            created_by="Avery Stone",
            created_at=days_ago(13, 12, 10),
            follow_up_at=days_ago(10, 12, 0),
        ),
        discussion_document(
            leads_by_key["sophia"],
            content="Qualification call confirmed roughly 60 users if rollout succeeds. They care most about lead source tracking, overdue follow-ups, and clean manager views.",
            created_by="Avery Stone",
            created_at=days_ago(8, 9, 45),
            follow_up_at=days_ago(5, 15, 0),
        ),
        discussion_document(
            leads_by_key["sophia"],
            content="Sent comparison notes against CRM add-ons. Sophia asked for implementation references and wants a technical stakeholder added to the next call.",
            created_by="Jordan Lee",
            created_at=days_ago(1, 14, 40),
            follow_up_at=days_from_now(3, 10, 0),
        ),
    ]

    latest_by_lead: dict[ObjectId, dict[str, Any]] = {}
    follow_up_by_lead: dict[ObjectId, datetime] = {}
    for discussion in discussions:
        lead_id = discussion["leadId"]
        if lead_id not in latest_by_lead or discussion["createdAt"] > latest_by_lead[lead_id]["createdAt"]:
            latest_by_lead[lead_id] = discussion
        if discussion["followUpAt"] is not None:
            follow_up_by_lead[lead_id] = discussion["followUpAt"]

    for lead in leads:
        latest = latest_by_lead.get(lead["_id"])
        if latest is None:
            continue
        lead["lastDiscussion"] = latest["content"]
        lead["lastDiscussionAt"] = latest["createdAt"]
        lead["updatedAt"] = latest["updatedAt"]
        if lead["_id"] in follow_up_by_lead:
            lead["nextFollowUp"] = follow_up_by_lead[lead["_id"]]

    return leads, discussions


async def seed_database(keep_existing_seed: bool) -> None:
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri)
    database = client[settings.mongo_db_name]

    try:
        leads_collection = database["leads"]
        discussions_collection = database["discussions"]

        if not keep_existing_seed:
            await discussions_collection.delete_many({"seedSource": SEED_SOURCE})
            await leads_collection.delete_many({"seedSource": SEED_SOURCE})

        leads, discussions = build_seed_data()
        await leads_collection.insert_many(leads)
        await discussions_collection.insert_many(discussions)

        await leads_collection.create_index("status")
        await leads_collection.create_index("nextFollowUp")
        await leads_collection.create_index("updatedAt")
        await discussions_collection.create_index("leadId")
        await discussions_collection.create_index("createdAt")
        await discussions_collection.create_index("seedSource")

        print(
            f"Seeded {len(leads)} leads and {len(discussions)} discussions "
            f"into MongoDB database '{settings.mongo_db_name}'."
        )
    finally:
        client.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed LeadFlow MongoDB with realistic CRM demo data.")
    parser.add_argument(
        "--keep-existing-seed",
        action="store_true",
        help="Append another seed batch instead of replacing prior LeadFlow seed data.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(seed_database(keep_existing_seed=args.keep_existing_seed))
