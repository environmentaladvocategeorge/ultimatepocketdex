import json
import logging

import concurrent.futures
from alchemy_models.card_set import CardSet
from alchemy_models.card import Card
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
        all_mapped_card_sets = ptcg_service.map_ptcg_sets_to_card_sets(ptcg_sets, session)

        updated_or_inserted_total = 0

        BATCH_SIZE = 20
        for i in range(0, len(all_mapped_card_sets), BATCH_SIZE):
            batch_sets = all_mapped_card_sets[i:i + BATCH_SIZE]
            cards_by_set_and_series = {}

            for new_set in batch_sets:
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
                        updated_or_inserted_total += 1
                else:
                    session.add(new_set)
                    updated_or_inserted_total += 1

            session.commit()

            def get_cards_for_set_with_key(card_set: CardSet):
                return (
                    (card_set.card_set_id, card_set.series_id),
                    ptcg_service.get_cards_for_set(card_set.provider_identifier)
                )

            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                future_to_set = {
                    executor.submit(get_cards_for_set_with_key, card_set): card_set
                    for card_set in batch_sets
                }
                for future in concurrent.futures.as_completed(future_to_set):
                    key, cards = future.result()
                    cards_by_set_and_series[key] = cards

            logger.info(f"Retrieved {len(cards_by_set_and_series)} sets with cards in batch {i // BATCH_SIZE + 1}")

            mapped_cards = ptcg_service.map_ptcg_cards_to_cards(cards_by_set_and_series)
            for card, price_history in mapped_cards:
                existing_card = session.query(Card).filter_by(card_id=card.card_id).first()
                if existing_card:
                    session.add(price_history)
                    existing_card.latest_price_id = price_history.price_id
                    session.add(existing_card)
                else:
                    session.add(card)
                    session.add(price_history)

            session.commit()
            logger.info(f"Successfully synchronized {len(mapped_cards)} cards in batch {i // BATCH_SIZE + 1}")

            session.expunge_all()
            session.flush()
            cards_by_set_and_series.clear()
            mapped_cards.clear()

        logger.info(f"Finished synchronizing all sets. Total sets upserted: {updated_or_inserted_total}")

    except Exception as e:
        logger.error(f"Error during card sets sync: {str(e)}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()