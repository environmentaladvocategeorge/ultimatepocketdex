import { pokemonTypeColors } from "@/constants/theme";

export const getGradientColors = (types: string[] | undefined): string[] => {
  if (!types || types.length === 0) return ["#4d7cc9"];

  const colors = types
    .map((type) => {
      const found = pokemonTypeColors.find(
        (t) => t.type.toLowerCase() === type.toLowerCase()
      );
      return found ? found.color : null;
    })
    .filter(Boolean) as string[];

  if (colors.length === 1) colors.push(colors[0]);

  return colors.length > 0 ? colors : ["#4d7cc9"];
};
