export const jwtConstants = {
  secret: 'test_jwt_secret',
};

export const ftConstants = {
  authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
  tokenURL: 'https://api.intra.42.fr/oauth/token',
  // TODO: .envファイルに出す
  clientID: '32a5ce9ef2773462375aac9a37dfc0a258eab0f01e395242798d2c89a819f4d1',
  // TODO: .envファイルに出す
  clientSecret:
    'a661083b44077d176c14161d9ab18ef000ad8930f57c17ae72d1b85508da264b',
  callbackURL: 'http://localhost:3000/auth/callback_ft',
};
