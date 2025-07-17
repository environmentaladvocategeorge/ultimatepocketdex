import json
import logging

import concurrent.futures
from alchemy_models.card_set import CardSet
from alchemy_models.card import Card
from repository.postgresql_database import PostgresDatabase
from services.ptcg_service import PTCGService
from services.pokeapi_service import PokeAPIService

logger = logging.getLogger()
logger.setLevel(logging.INFO)

db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)
ptcg_service = PTCGService()
poke_api_service = PokeAPIService()

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
        elif event_type == "synchronize_pokemon":
            synchronize_pokemon()
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

def synchronize_pokemon():
    logger.info("Starting pokemon synchronization")

    try:
        session = db.get_session()
        pokemons = poke_api_service.get_all_pokemons()
        logger.info(f"Fetched {len(pokemons)} pokemons")

        session.add_all(pokemons)
        session.commit()

        logger.info("Pokemons synchronized successfully")
    except Exception as e:
        logger.error(f"Error during pokemon sync: {str(e)}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()


def synchronize_card_sets():
    logger.info("Starting card sets synchronization")

    try:
        session = db.get_session()
        ptcg_sets = ptcg_service.get_sets()
        all_mapped_card_sets = ptcg_service.map_ptcg_sets_to_card_sets(ptcg_sets, session)

        updated_or_inserted_total = 0
        BATCH_SIZE = 50

        for i in range(0, len(all_mapped_card_sets), BATCH_SIZE):
            batch_sets = all_mapped_card_sets[i:i + BATCH_SIZE]
            updated_or_inserted_total += upsert_card_sets(batch_sets, session)

            cards_by_set_and_series = retrieve_cards_by_set(batch_sets)
            logger.info(f"Retrieved {len(cards_by_set_and_series)} sets with cards in batch {i // BATCH_SIZE + 1}")

            mapped_cards = ptcg_service.map_ptcg_cards_to_cards(cards_by_set_and_series)
            upsert_cards_with_prices(mapped_cards, session)

            logger.info(f"Successfully synchronized {len(mapped_cards)} cards in batch {i // BATCH_SIZE + 1}")

            session.expunge_all()
            session.flush()

        logger.info(f"Finished synchronizing all sets. Total sets upserted: {updated_or_inserted_total}")

    except Exception as e:
        logger.error(f"Error during card sets sync: {str(e)}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()


def upsert_card_sets(card_sets, session):
    count = 0
    # Build identifiers for filtering
    identifier_pairs = [
        (cs.provider_name, cs.provider_identifier) for cs in card_sets
    ]

    # Fetch existing sets in one query
    existing_sets = session.query(CardSet).filter(
        tuple_(CardSet.provider_name, CardSet.provider_identifier).in_(identifier_pairs)
    ).all()
    existing_lookup = {
        (s.provider_name, s.provider_identifier): s for s in existing_sets
    }

    sets_to_update = []
    sets_to_insert = []

    for new_set in card_sets:
        key = (new_set.provider_name, new_set.provider_identifier)
        existing_set = existing_lookup.get(key)

        if existing_set:
            if existing_set.set_card_count != new_set.set_card_count:
                existing_set.set_card_count = new_set.set_card_count
                sets_to_update.append(existing_set)
                count += 1
        else:
            sets_to_insert.append(new_set)
            count += 1

    if sets_to_update:
        session.add_all(sets_to_update)
    if sets_to_insert:
        session.add_all(sets_to_insert)

    session.commit()
    return count


def retrieve_cards_by_set(card_sets):
    def get_cards(card_set):
        return (card_set.card_set_id, card_set.series_id), ptcg_service.get_cards_for_set(card_set.provider_identifier)

    cards_by_key = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_set = {
            executor.submit(get_cards, card_set): card_set for card_set in card_sets
        }
        for future in concurrent.futures.as_completed(future_to_set):
            key, cards = future.result()
            cards_by_key[key] = cards
    return cards_by_key


def upsert_cards_with_prices(mapped_cards, session):
    for card, price_history in mapped_cards:
        existing_card = session.query(Card).filter_by(card_id=card.card_id).first()
        if existing_card:
            session.add(price_history)
            session.flush()
            existing_card.latest_price_id = price_history.price_id
            session.add(existing_card)
        else:
            session.add(card)
            session.flush()
            session.add(price_history)
            session.flush()
            card.latest_price_id = price_history.price_id
            session.add(card)

    session.commit()
