from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import func
from alchemy_models.pokemon import Pokemon
from repository.postgresql_database import PostgresDatabase
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)

def create_pokemon_controller():
    @router.get("/pokemon")
    async def get_pokemon_by_region():
        session = None
        try:
            session = db.get_session()
            logger.info("Fetching Pokémon grouped by region")

            all_pokemons = (
                session.query(Pokemon)
                .order_by(Pokemon.generation, Pokemon.national_dex_id)
                .all()
            )

            region_map = {}

            for p in all_pokemons:
                if p.region not in region_map:
                    region_map[p.region] = []
                region_map[p.region].append(p.to_dict())
                
            formatted_sections = [
                {
                    "region": region,
                    "data": pokemons
                }
                for region, pokemons in region_map.items()
            ]

            return JSONResponse(content=formatted_sections)

        except Exception as e:
            logger.error(f"Error fetching Pokémon by region: {str(e)}", exc_info=True)
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

        finally:
            if session:
                session.close()

    return router