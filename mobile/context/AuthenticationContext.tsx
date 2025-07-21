import { reAuthenticateUser, refreshUserSession } from "@/lib/cognito";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthenticationContextType {
  user: CognitoUserSession | null;
  setUser: any;
  getToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  setIsAuthenticated: any;
  getUserName: () => string | null;
}

const AuthenticationContext = createContext<
  AuthenticationContextType | undefined
>(undefined);

export const AuthenticationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<CognitoUserSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    reAuthenticateUser((err, session) => {
      if (err) {
        setIsAuthenticated(false);
      } else {
        setUser(session);
        setIsAuthenticated(true);
      }
    });
  }, []);

  const getToken = async (): Promise<string | null> => {
    try {
      if (!user) return null;
      if (user.isValid()) {
        return user.getIdToken().getJwtToken();
      } else {
        const raw = await AsyncStorage.getItem("cognitoSession");
        if (!raw) return null;
        const { username, refreshToken } = JSON.parse(raw);
        const newSession = await refreshUserSession(username, refreshToken);
        setUser(newSession);
        return newSession.getIdToken().getJwtToken();
      }
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  };

  const getUserName = (): string | null => {
    return user?.getIdToken().payload?.["cognito:username"] || null;
  };

  return (
    <AuthenticationContext.Provider
      value={{
        user,
        setUser,
        getToken,
        isAuthenticated,
        setIsAuthenticated,
        getUserName,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};

export const useAuthentication = (): AuthenticationContextType => {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error(
      "useAuthentication must be used within an AuthenticationProvider"
    );
  }
  return context;
};
