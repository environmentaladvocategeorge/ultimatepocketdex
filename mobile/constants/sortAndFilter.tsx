import { FontAwesome5 } from "@expo/vector-icons";
import { colors } from "./theme";

export type SortOption = {
  name: string;
  icon: React.ReactNode;
  sort: string;
};

export const sortOptions = [
  {
    name: "Price Descending",
    icon: (
      <FontAwesome5 name="sort-amount-up-alt" size={12} color={colors.white} />
    ),
    sort: "price_desc",
  },
  {
    name: "Price Ascending",
    icon: <FontAwesome5 name="sort-amount-up" size={12} color={colors.white} />,
    sort: "price_asc",
  },
  {
    name: "A-Z",
    icon: <FontAwesome5 name="sort-alpha-up" size={12} color={colors.white} />,
    sort: "name_asc",
  },
  {
    name: "Z-A",
    icon: (
      <FontAwesome5 name="sort-alpha-up-alt" size={12} color={colors.white} />
    ),
    sort: "name_desc",
  },
];
