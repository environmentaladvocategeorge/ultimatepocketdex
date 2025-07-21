import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoIdToken,
  CognitoAccessToken,
  CognitoRefreshToken,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: "us-east-1_xH4eylHX0",
  ClientId: "2kvg45kqfaaecdpaphi6tkddui",
};

export const userPool = new CognitoUserPool(poolData);

export const signInUser = (emailAddress: string, password: string) => {
  if (!emailAddress || !password) return;

  const authDetails = new AuthenticationDetails({
    Username: emailAddress,
    Password: password,
  });

  const user = new CognitoUser({
    Username: emailAddress,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: async (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        await AsyncStorage.setItem(
          "cognitoSession",
          JSON.stringify({
            username: emailAddress,
            idToken,
            accessToken,
            refreshToken,
          })
        );

        resolve(session);
      },
      onFailure: (err) => reject(err),
    });
  });
};

export const signUpUser = (
  username: string,
  emailAddress: string,
  password: string
) => {
  if (!username || !emailAddress || !password) {
    return;
  }

  const attributeList = [
    new CognitoUserAttribute({ Name: "email", Value: emailAddress }),
  ];

  return new Promise((resolve, reject) => {
    userPool.signUp(username, password, attributeList, [], (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

export const confirmUserSignUp = (
  username: string,
  password: string,
  verificationCode: string
) => {
  const user = new CognitoUser({
    Username: username,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    user.confirmRegistration(verificationCode, true, (err, confirmResult) => {
      if (err) {
        reject(err);
        return;
      }

      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      user.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          resolve(session);
        },
        onFailure: (authError) => {
          reject(authError);
        },
      });
    });
  });
};

export const reAuthenticateUser = async (
  callback: (error: Error | null, result: CognitoUserSession | null) => void
) => {
  try {
    const raw = await AsyncStorage.getItem("cognitoSession");
    if (!raw) return callback(new Error("No session stored"), null);

    const { username, idToken, accessToken, refreshToken } = JSON.parse(raw);

    let session = new CognitoUserSession({
      IdToken: new CognitoIdToken({ IdToken: idToken }),
      AccessToken: new CognitoAccessToken({ AccessToken: accessToken }),
      RefreshToken: new CognitoRefreshToken({ RefreshToken: refreshToken }),
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.setSignInUserSession(session);

    if (!session.isValid()) {
      try {
        session = await refreshUserSession(username, refreshToken);
        cognitoUser.setSignInUserSession(session);
      } catch (refreshErr) {
        return callback(
          new Error("Stored session is invalid or expired and refresh failed"),
          null
        );
      }
    }

    return callback(null, session);
  } catch (e) {
    return callback(e as Error, null);
  }
};

export const refreshUserSession = async (
  username: string,
  refreshToken: string
): Promise<CognitoUserSession> => {
  const cognitoUser = new CognitoUser({
    Username: username,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.refreshSession(
      new CognitoRefreshToken({ RefreshToken: refreshToken }),
      async (err, session) => {
        if (err) return reject(err);

        await AsyncStorage.setItem(
          "cognitoSession",
          JSON.stringify({
            username,
            idToken: session.getIdToken().getJwtToken(),
            accessToken: session.getAccessToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken(),
          })
        );
        resolve(session);
      }
    );
  });
};
