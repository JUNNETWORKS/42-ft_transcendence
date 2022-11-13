# 42-ft_transcendence

## Prismaを使う上での注意点

schema.prismaを編集したとき、`npx prisma migrate dev`を実行すること。
既存のデータベースからのマイグレーション用のSQLファイルが生成されるので、一緒にプッシュよろ。