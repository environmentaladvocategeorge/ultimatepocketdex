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