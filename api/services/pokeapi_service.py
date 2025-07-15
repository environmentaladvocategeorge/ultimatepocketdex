import requests
from typing import List, Dict, Union


class PokeAPIService:
    def __init__(self):
        self.POKE_API_BASE_URL: str = "https://pokeapi.co/api/v2/"

    def get_pokemon_details(self, name_or_id: Union[str, int]) -> Dict:
        """
        Fetch and return details for a specific Pokémon by name or ID.
        """
        url = f"{self.POKE_API_BASE_URL}pokemon/{name_or_id}/"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def get_all_pokemons(self, limit: int = 10000, offset: int = 0) -> List[Dict]:
        """
        Fetch all Pokémon summaries and return their detailed info using get_pokemon_details.
        """
        url = f"{self.POKE_API_BASE_URL}pokemon?limit={limit}&offset={offset}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        all_details = []
        for pokemon in data["results"]:
            details = self.get_pokemon_details(pokemon["name"])
            all_details.append(details)

        return all_details

    