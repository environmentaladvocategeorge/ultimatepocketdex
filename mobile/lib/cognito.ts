import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: "us-east-1_xH4eylHX0",
  ClientId: "2kvg45kqfaaecdpaphi6tkddui",
};

export const userPool = new CognitoUserPool(poolData);

export const signInUser = (emailAddress: string, password: string) => {
  if (!emailAddress || !password) {
    return;
  }

  const authenticationData = {
    Username: emailAddress,
    Password: password,
  };
  const authenticationDetails = new AuthenticationDetails(authenticationData);

  const user = new CognitoUser({
    Username: emailAddress,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authenticationDetails, {
      onSuccess: (data) => {
        resolve(data);
      },
      onFailure: (err) => {
        reject(err);
      },
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

export const reAuthenticateUser = (
  callback: (error: Error | null, result: CognitoUserSession | null) => void
) => {
  const cognitoUser = userPool.getCurrentUser();

  if (cognitoUser) {
    cognitoUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          console.error("Failed to get session:", err);
          callback(err, null);
        } else {
          if (session && session.isValid()) {
            callback(null, session);
          } else {
            const refreshToken = session?.getRefreshToken();

            if (refreshToken) {
              cognitoUser.refreshSession(
                refreshToken,
                (refreshErr, newSession) => {
                  if (refreshErr) {
                    console.error("Failed to refresh session:", refreshErr);
                    callback(refreshErr, null);
                  } else {
                    callback(null, newSession);
                  }
                }
              );
            } else {
              console.error("No refresh token available");
              callback(new Error("No refresh token available"), null);
            }
          }
        }
      }
    );
  } else {
    callback(new Error("No current user found"), null);
  }
};
