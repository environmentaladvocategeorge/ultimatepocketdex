import json
import logging

import concurrent.futures
from functools import partial
from alchemy_models.card_set import CardSet
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

        updated_or_inserted_count = 0
        batch_size = 50

        for i in range(0, len(ptcg_sets), batch_size):
            ptcg_set_batch = ptcg_sets[i:i+batch_size]
            mapped_card_sets = ptcg_service.map_ptcg_sets_to_card_sets(ptcg_set_batch, session)

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
            del mapped_card_sets
            del ptcg_set_batch

        logger.info(f"Successfully synchronized {updated_or_inserted_count} card sets")

        all_card_sets = session.query(CardSet).all()
        batch_size = 25
        total_cards_synced = 0

        for i in range(0, len(all_card_sets), batch_size):
            card_set_batch = all_card_sets[i:i+batch_size]

            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                future_to_key = {
                    executor.submit(
                        lambda cs: ((cs.card_set_id, cs.series_id), ptcg_service.get_cards_for_set(cs.provider_identifier)),
                        card_set
                    ): card_set
                    for card_set in card_set_batch
                }

                for future in concurrent.futures.as_completed(future_to_key):
                    key, ptcg_card_list = future.result()
                    mapped_cards = ptcg_service.map_ptcg_cards_to_cards({key: ptcg_card_list})
                    session.add_all(mapped_cards)
                    session.commit()
                    total_cards_synced += len(mapped_cards)
                    del ptcg_card_list
                    del mapped_cards

            del card_set_batch
            del future_to_key

        logger.info(f"Successfully synchronized {total_cards_synced} cards")
    except Exception as e:
        logger.error(f"Error during card sets sync: {str(e)}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()