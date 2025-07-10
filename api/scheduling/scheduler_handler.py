import json
import logging
from repository.postgresql_database import PostgresDatabase
from services.ptcg_service import PTCGService

logger = logging.getLogger()
logger.setLevel(logging.INFO)

db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)
ptcg_service = PTCGService()

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")

    event_type = event.get("event_type")
    if not event_type:
        logger.error("No event_type provided in event payload.")
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Missing event_type in payload"})
        }

    try:
        if event_type == "synchronize_card_sets":
            synchronize_card_sets()
        else:
            logger.warning(f"Unknown event_type: {event_type}")
            return {
                "statusCode": 400,
                "body": json.dumps({"message": f"Unknown event_type: {event_type}"})
            }

        return {
            "statusCode": 200,
            "body": json.dumps({"message": f"Event {event_type} processed successfully"})
        }
    except Exception as e:
        logger.error(f"Error processing event {event_type}: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"})
        }


def synchronize_card_sets():
    logger.info("Starting card sets synchronization")

    session = db.get_session()
    try:
        ptcg_sets = ptcg_service.get_sets()
        card_sets = ptcg_service._map_ptcg_sets_to_card_sets(ptcg_sets, session)
        session.add_all(card_sets)
        session.commit()
        logger.info(f"Successfully synchronized {len(card_sets)} card sets")
    except Exception as e:
        logger.error(f"Error during card sets sync: {str(e)}", exc_info=True)
        raise
    finally:
        session.close()
