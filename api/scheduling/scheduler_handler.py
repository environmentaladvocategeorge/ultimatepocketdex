import json
import logging
import gc

import concurrent.futures
from functools import partial
from alchemy_models.card_set import CardSet
from repository.postgresql_database import PostgresDatabase
from services.ptcg_service import PTCGService

logger = logging.getLogger()
logger.setLevel(logging.INFO)

db = PostgresDatabase(
    host="ultimatepocketdx-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
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
        mapped_card_sets = ptcg_service.map_ptcg_sets_to_card_sets(ptcg_sets, session)

        updated_or_inserted_count = 0

        for new_set in mapped_card_sets:
            existing_set = session.query(CardSet).filter_by(
                provider_name=new_set.provider_name,
                provider_identifier=new_set.provider_identifier
            ).first()

            if existing_set:
                fields_to_check = ["set_name", "series_id", "set_card_count", "set_logo_url"]
                changed = any(
                    getattr(existing_set, field) != getattr(new_set, field)
                    for field in fields_to_check
                )

                if changed:
                    for field in fields_to_check:
                        setattr(existing_set, field, getattr(new_set, field))
                    session.add(existing_set)
                    updated_or_inserted_count += 1
            else:
                session.add(new_set)
                updated_or_inserted_count += 1

        session.commit()
        logger.info(f"Successfully synchronized {updated_or_inserted_count} card sets")

        total_cards_processed = 0
        
        for card_set in mapped_card_sets:
            logger.info(f"Processing cards for set: {card_set.set_name}")
            
            try:
                cards = ptcg_service.get_cards_for_set(card_set.provider_identifier)
                
                if cards:
                    cards_dict = {(card_set.card_set_id, card_set.series_id): cards}
                    mapped_cards = ptcg_service.map_ptcg_cards_to_cards(cards_dict)
                    
                    for i in range(0, len(mapped_cards), 500):
                        chunk = mapped_cards[i:i + 500]
                        session.add_all(chunk)
                        session.commit()
                        del chunk
                        gc.collect()
                    
                    total_cards_processed += len(mapped_cards)
                    logger.info(f"Processed {len(mapped_cards)} cards for set: {card_set.set_name}")
                
                del cards
                del mapped_cards
                gc.collect()
                
            except Exception as e:
                logger.error(f"Error processing set {card_set.set_name}: {str(e)}")
                session.rollback()
                continue
        
        logger.info(f"Successfully synchronized {total_cards_processed} cards total")
        
    except Exception as e:
        logger.error(f"Error during card sets sync: {str(e)}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()