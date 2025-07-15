export interface User {
  userId: string;
  userName: string;
  emailAddress: string;
  gender: string | null;
  ageRange: string;
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
  sprite_url: string | null;
  provider_id: string;
  provider_name: string;
  create_ts: string | null;
  updated_ts: string | null;
};
