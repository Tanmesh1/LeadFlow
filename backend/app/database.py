from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings


class MongoDB:
    client: AsyncIOMotorClient | None = None
    database: AsyncIOMotorDatabase | None = None


mongodb = MongoDB()


async def connect_to_mongo() -> None:
    settings = get_settings()
    mongodb.client = AsyncIOMotorClient(settings.mongo_uri)
    mongodb.database = mongodb.client[settings.mongo_db_name]
    await create_indexes()


async def create_indexes() -> None:
    if mongodb.database is None:
        raise RuntimeError("MongoDB connection has not been initialized.")

    leads = mongodb.database["leads"]
    await leads.create_index("status")
    await leads.create_index("nextFollowUp")
    await leads.create_index("updatedAt")


async def close_mongo_connection() -> None:
    if mongodb.client is not None:
        mongodb.client.close()
        mongodb.client = None
        mongodb.database = None


def get_database() -> AsyncIOMotorDatabase:
    if mongodb.database is None:
        raise RuntimeError("MongoDB connection has not been initialized.")
    return mongodb.database
