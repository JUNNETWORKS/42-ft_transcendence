#!/bin/bash

# node_modules/ の権限エラー回避
# https://qiita.com/yohm/items/047b2e68d008ebb0f001

set -ux

USER_ID=${LOCAL_UID:-9001}
GROUP_ID=${LOCAL_GID:-9001}

echo "Starting with UID : $USER_ID, GID: $GROUP_ID, pwd: $(pwd)"
useradd -u $USER_ID -o -m user
groupmod -g $GROUP_ID user
export HOME=/home/user

chown -R user:user node_modules/

# ブランチのデータスキーマの状態にDBを上書き
npx prisma db push
npx prisma db seed
npx prisma generate

exec /usr/sbin/gosu user "$@"
