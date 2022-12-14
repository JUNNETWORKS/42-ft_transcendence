export const jwtConstants = {
  secret: process.env.AUTH_JWT_SECRET!,
};

export const passwordConstants = {
  secret: process.env.AUTH_HMAC_SECRET!,
  pepper: process.env.AUTH_HMAC_PEPPER!,
};

export const ftConstants = {
  // 認可コード`code`を取得するためのURL
  authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
  // 認可コードをアクセストークンに交換するためのURL
  tokenURL: 'https://api.intra.42.fr/oauth/token',
  // 42auth
  clientID: process.env.AUTH_FT_CLIENT_ID!,
  // 42auth
  clientSecret: process.env.AUTH_FT_CLIENT_SECRET!,
  // callbackURL: 'http://localhost:3000/auth/callback_ft',
  callbackURL: 'http://localhost:5173/auth',
};
