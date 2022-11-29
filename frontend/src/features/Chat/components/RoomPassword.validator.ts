export const validateRoomPasswordError = (response: string) => {
  switch (response) {
    case 'not found':
      return 'チャットルームが存在しません';
    case 'joined already':
      return '既に入室しています';
    case 'no password':
      return 'パスワードを入力してください';
    case 'invalid password':
      return 'パスワードが間違えています';
    default:
      return 'チャットルームの入室に失敗しました';
  }
};
