/**
 * `asyncProc`が, 少なくとも`leastDurationInMs`ミリ秒経ってから解決されるようにする.
 * @param leastDurationInMs 最小経過時間
 * @param asyncProc 非同期処理
 * @returns
 */
export async function stall<U>(
  leastDurationInMs: number,
  asyncProc: () => Promise<U>
): Promise<U> {
  return new Promise<U>((res, rej) => {
    let returnValue: { data: U } | null = null;
    let errorValue: { error: any } | null = null;
    let timedOut = false;
    let finished = false;

    // この timeout が終了するまで resolve も reject もされない
    setTimeout(() => {
      timedOut = true;

      if (finished) {
        return;
      }
      if (errorValue) {
        returnValue = null;
        finished = true;
        rej(errorValue.error);
      } else if (returnValue) {
        errorValue = null;
        finished = true;
        res(returnValue.data);
      }
    }, leastDurationInMs);

    try {
      asyncProc().then(
        (result) => {
          returnValue = { data: result };
          if (!timedOut) {
            return;
          }
          if (finished) {
            return;
          }
          errorValue = null;
          finished = true;
          res(returnValue.data);
        },
        (e) => {
          errorValue = { error: e };
          if (!timedOut) {
            return;
          }
          if (finished) {
            return;
          }
          returnValue = null;
          finished = true;
          rej(errorValue.error);
        }
      );
    } catch (e) {
      errorValue = { error: e };
      if (!timedOut) {
        return;
      }
      if (finished) {
        return;
      }
      returnValue = null;
      finished = true;
      rej(errorValue.error);
    }
  });
}
