#!/bin/bash

# node_modules/ の権限エラー回避
# https://qiita.com/yohm/items/047b2e68d008ebb0f001

set -ux



if [ "${ENV:-''}" = "DEV" ] ; then
  USER_ID=${LOCAL_UID:-9001}
  GROUP_ID=${LOCAL_GID:-9001}

  echo "Starting with UID : $USER_ID, GID: $GROUP_ID, pwd: $(pwd)"
  useradd -u $USER_ID -o -m user
  groupmod -g $GROUP_ID user
  export HOME=/home/user

  chown -R user:user node_modules/

  npm install
fi

# ブランチのデータスキーマの状態にDBを上書き
npx prisma db push --force-reset
npx prisma db seed
npx prisma generate

if [ "${ENV:-''}" = "DEV" ] ; then
  exec /usr/sbin/gosu user "$@"
else
  exec "$@"
fi
