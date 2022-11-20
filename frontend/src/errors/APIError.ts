/**
 * レスポンスを運べるエラークラス
 */
export class APIError extends Error {
  constructor(message: string, readonly response: Response) {
    super(message);
  }
}
