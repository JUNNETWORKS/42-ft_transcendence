/**
 * レスポンスを運べるエラークラス
 */
export class APIError extends Error {
  constructor(message: string, readonly response: Response) {
    super(message);
  }

  get status() {
    return this.response.status;
  }

  get messageForUser() {
    switch (this.status) {
      case 401:
        return '認証に失敗しました';
      default:
        return 'エラーが発生しました';
    }
  }
}
