export const jwtConstants = {
  secret: process.env.AUTH_JWT_SECRET,
};

export const ftConstants = {
  // 認可コード`code`を取得するためのURL
  authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
  // 認可コードをアクセストークンに交換するためのURL
  tokenURL: 'https://api.intra.42.fr/oauth/token',
  // TODO: .envファイルに出す
  clientID: process.env.AUTH_FT_CLIENT_ID,
  // TODO: .envファイルに出す
  clientSecret: process.env.AUTH_FT_CLIENT_SECRET,
  // callbackURL: 'http://localhost:3000/auth/callback_ft',
  callbackURL: 'http://localhost:5173/auth',
};
