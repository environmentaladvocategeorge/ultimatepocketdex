export interface User {
  userId: string;
  userName: string;
  emailAddress: string;
  createTs: string;
  updatedTs: string;
}

export type SortOption = {
  name: string;
  icon: React.ReactNode;
  sort: string;
};

export type Pokemon = {
  pokemon_id: string;
  national_dex_id: number;
  name: string;
  generation: number;
  region: string;
  types: string[];
  sprite_url: string;
  provider_id: string;
  provider_name: string;
  create_ts: string;
  updated_ts: string;
};

export interface CardSet {
  card_set_id: string;
  set_name: string;
  provider_name: string;
  provider_identifier: string;
  series_id: string;
  series_name: string;
  set_card_count: number;
  set_release_date: string;
  set_logo_url: string;
  create_ts: string;
  updated_ts: string;
}

export interface Card {
  card_id: string;
  provider_name: string;
  provider_identifier: string;

  series_id: string;
  series_name?: string | null;

  card_set_id: string;
  card_set_name?: string | null;

  card_name: string;
  card_number: string;
  card_rarity: string;
  card_image_url: string;

  types: string[];

  create_ts: string | null;
  updated_ts: string | null;

  latest_price?: CardPriceHistory | null;
}

export interface CardPriceHistory {
  price_id: string;
  card_id: string;
  price: number;
  recorded_at: string;
}
