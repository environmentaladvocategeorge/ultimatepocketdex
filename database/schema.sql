-- USERS TABLE
CREATE TABLE "User" (
    user_id UUID PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    gender VARCHAR(50),
    age_range VARCHAR(50) NOT NULL,
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CARD SERIES TABLE
CREATE TABLE "CardSeries" (
    series_id UUID PRIMARY KEY,
    series_name VARCHAR(255) NOT NULL,
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CardSet" (
    card_set_id UUID PRIMARY KEY,
    set_name VARCHAR(255) NOT NULL UNIQUE,
    provider_name VARCHAR(100) NOT NULL,
    provider_identifier VARCHAR(255) NOT NULL,
    series_id UUID NOT NULL REFERENCES "CardSeries"(series_id) ON DELETE CASCADE,
    set_card_count INTEGER,
    set_release_date TIMESTAMPTZ,
    set_logo_url VARCHAR(1024),
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider_name, provider_identifier)
);

CREATE TABLE "Card" (
    card_id UUID PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    provider_identifier VARCHAR(255) NOT NULL,
    series_id UUID NOT NULL REFERENCES "CardSeries"(series_id) ON DELETE CASCADE,
    card_set_id UUID NOT NULL REFERENCES "CardSet"(card_set_id) ON DELETE CASCADE,
    card_name VARCHAR(255) NOT NULL,
    card_number VARCHAR(50) NOT NULL,
    card_rarity VARCHAR(100),
    types VARCHAR(50)[] DEFAULT '{}',
    latest_price_id UUID,
    card_image_url VARCHAR(1024),
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider_name, provider_identifier)
);

CREATE TABLE "CardPriceHistory" (
    price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES "Card"(card_id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Card"
ADD CONSTRAINT fk_latest_price
FOREIGN KEY (latest_price_id)
REFERENCES "CardPriceHistory"(price_id)
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE "Pokemon" (
    pokemon_id UUID PRIMARY KEY,
    national_dex_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    generation INTEGER NOT NULL,
    region VARCHAR(50) NOT NULL,
    types VARCHAR(50)[] NOT NULL DEFAULT '{}',
    sprite_url VARCHAR(1024),
    provider_id VARCHAR(255) NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider_name, provider_id)
);