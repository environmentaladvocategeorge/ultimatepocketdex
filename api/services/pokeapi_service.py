import requests
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed

class PokeAPIService:
    def __init__(self):
        self.POKE_API_BASE_URL: str = "https://pokeapi.co/api/v2/"

    def get_pokemon_details(self, name: str) -> Dict:
        """
        Fetch and return detailed info for a given Pokémon by name.
        """
        url = f"{self.POKE_API_BASE_URL}pokemon/{name}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def get_all_pokemons(self, limit: int = 10000, offset: int = 0, batchSize: int = 30 ) -> List[Dict]:
        """
        Fetch all Pokémon summaries and return their detailed info using concurrent requests (max 30 at a time).
        """
        url = f"{self.POKE_API_BASE_URL}pokemon?limit={limit}&offset={offset}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        pokemon_names = [pokemon["name"] for pokemon in data["results"]]

        all_details = []

        for i in range(0, len(pokemon_names), batchSize):
            chunk = pokemon_names[i:i+batchSize]
            print(f"Fetching batch {i//batchSize + 1} of {len(pokemon_names) // batchSize + 1}...")

            with ThreadPoolExecutor(max_workers=batchSize) as executor:
                futures = {executor.submit(self.get_pokemon_details, name): name for name in chunk}
                for future in as_completed(futures):
                    name = futures[future]
                    try:
                        details = future.result()
                        all_details.append(details)
                    except Exception as e:
                        print(f"Failed to fetch {name}: {e}")

        return all_details
