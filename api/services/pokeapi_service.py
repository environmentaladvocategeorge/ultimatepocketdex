from pydantic import ValidationError
import requests
from typing import List, Union
from alchemy_models.pokemon import Pokemon
from response_models.pokeapi import PokemonDetailResponse, PokemonListResponseModel, PokemonType


class PokeAPIService:
    def __init__(self):
        self.POKE_API_BASE_URL: str = "https://pokeapi.co/api/v2/"
        self.REQUEST_TIMEOUT = 30

    def _get_generation(self, dex_number: int) -> int:
        if dex_number <= 0:
            raise ValueError("Dex number must be a positive integer.")
        
        if 1 <= dex_number <= 151:
            return 1
        elif 152 <= dex_number <= 251:
            return 2
        elif 252 <= dex_number <= 386:
            return 3
        elif 387 <= dex_number <= 493:
            return 4
        elif 494 <= dex_number <= 649:
            return 5
        elif 650 <= dex_number <= 721:
            return 6
        elif 722 <= dex_number <= 809:
            return 7
        elif 810 <= dex_number <= 905:
            return 8
        elif 906 <= dex_number <= 1025:
            return 9
        else:
            raise ValueError("Dex number is out of known range.")
        
    def _get_region_by_generation(self, generation: int) -> str:
        generation_to_region = {
            1: "Kanto",
            2: "Johto",
            3: "Hoenn",
            4: "Sinnoh",
            5: "Unova",
            6: "Kalos",
            7: "Alola",
            8: "Galar",
            9: "Paldea",
        }
        return generation_to_region.get(generation, "Unknown")
    
    def _format_pokemon_name(self, raw_name: str) -> str:
        exceptions = {
            "ho-oh": "Ho-Oh",
            "porygon-z": "Porygon-Z",
            "type-null": "Type: Null",
            "jangmo-o": "Jangmo-o",
            "hakamo-o": "Hakamo-o",
            "kommo-o": "Kommo-o",
            "mr.mime": "Mr. Mime",
            "mime.jr": "Mime Jr.",
            "mr.rime": "Mr. Rime",
            "tapu.koko": "Tapu Koko",
            "sirfetchd": "Sirfetch’d",
            "flabebe": "Flabébé",
        }

        key = raw_name.lower()
        if key in exceptions:
            return exceptions[key]

        words = raw_name.replace("-", " ").replace(".", " ").split()
        return " ".join(word.capitalize() for word in words)

    def _extract_type_names(self, types_array: List[PokemonType]) -> List[str]:
        sorted_types = sorted(types_array, key=lambda t: t.slot)
        return [t.type.name for t in sorted_types]

    def get_pokemon_details(self, name_or_id: Union[str, int]) -> Pokemon:
        url = f"{self.POKE_API_BASE_URL}pokemon/{name_or_id}/"
        response = requests.get(url, timeout=self.REQUEST_TIMEOUT)
        response.raise_for_status()
        
        try:
            data = PokemonDetailResponse(**response.json())
        except ValidationError as e:
            raise RuntimeError(f"Failed to parse Pokémon detail response: {e}")
        
        national_dex_id = data.id
        gen = self._get_generation(national_dex_id)
        region = self._get_region_by_generation(gen)
        name = self._format_pokemon_name(data.species.name)
        pokemon = Pokemon(
            national_dex_id=national_dex_id,
            name=name,
            generation=gen,
            region=region,
            types=self._extract_type_names(data.types),
            sprite_url=data.sprites.front_default,
            provider_id=str(national_dex_id),
            provider_name="pokeapi"
        )
        return pokemon

    def get_all_pokemons(self, limit: int = 1025, offset: int = 0) -> List[Pokemon]:
        url = f"{self.POKE_API_BASE_URL}pokemon?limit={limit}&offset={offset}"
        response = requests.get(url, timeout=self.REQUEST_TIMEOUT)
        response.raise_for_status()

        parsed = PokemonListResponseModel(**response.json())

        all_details = []
        for pokemon in parsed.results:
            details = self.get_pokemon_details(pokemon.name)
            all_details.append(details)

        return all_details