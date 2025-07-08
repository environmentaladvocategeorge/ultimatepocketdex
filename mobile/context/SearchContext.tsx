import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SearchTerm {
  id: number;
  term: string;
}

interface SearchContextType {
  recentSearches: SearchTerm[];
  addSearchTerm: (term: string) => void;
  deleteSearchTerm: (id: number) => void;
  clearSearches: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

export const SearchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [recentSearches, setRecentSearches] = useState<SearchTerm[]>([]);

  useEffect(() => {
    const loadSearches = async () => {
      try {
        const searches = await AsyncStorage.getItem("recentSearches");
        if (searches) {
          setRecentSearches(JSON.parse(searches));
        }
      } catch (error) {
        console.error("Failed to load searches:", error);
      }
    };
    loadSearches();
  }, []);

  const saveSearches = async (searches: SearchTerm[]) => {
    try {
      await AsyncStorage.setItem("recentSearches", JSON.stringify(searches));
    } catch (error) {
      console.error("Failed to save searches:", error);
    }
  };

  const addSearchTerm = (term: string) => {
    if (term.trim() != "") {
      const newSearch: SearchTerm = { id: Date.now(), term };
      const updatedSearches = [...recentSearches, newSearch];
      setRecentSearches(updatedSearches);
      saveSearches(updatedSearches);
    }
  };

  const deleteSearchTerm = (id: number) => {
    const updatedSearches = recentSearches.filter((search) => search.id !== id);
    setRecentSearches(updatedSearches);
    saveSearches(updatedSearches);
  };

  const clearSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem("recentSearches");
  };

  return (
    <SearchContext.Provider
      value={{ recentSearches, addSearchTerm, deleteSearchTerm, clearSearches }}
    >
      {children}
    </SearchContext.Provider>
  );
};
