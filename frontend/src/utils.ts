type Many<T> = T | ReadonlyArray<T>;

/**
 * オブジェクト`obj`のプロパティのうち, `props`に書かれたものだけを残したものを返す.\
 * 元の`obj`は破壊しない.
 * @param obj
 * @param props
 * @returns
 */
export function pick<T extends object, U extends keyof T>(
  obj: T,
  ...props: Array<Many<U>>
): Pick<T, U> {
  const d: any = {};
  props.forEach((key) => {
    d[key] = (obj as any)[key];
  });
  return d;
}

/**
 * 配列`array`を, 「`array`の各要素に関数`value`を適用した値」を使って昇順にソートしたものを返す.\
 * 元の`array`は変更しない.
 * @param array
 * @param value
 * @returns
 */
export function sortBy<T, U>(array: T[], value: (a: T) => U) {
  const decorated = array.map((e) => ({ e, v: value(e) }));
  decorated.sort((a, b) => {
    if (a.v < b.v) {
      return -1;
    } else if (a.v > b.v) {
      return +1;
    }
    return 0;
  });
  return decorated.map((d) => d.e);
}

/**
 * 配列`array`を, 「`array`の各要素に関数`value`を適用した値」に関してユニークになるよう要素を除去したものを返す.\
 * 除去されるのは後から登場したもの.\
 * 元の`array`は変更しない.
 * @param array
 * @param value
 * @returns
 */
export function uniqBy<T, U>(array: T[], value: (a: T) => U) {
  const mem: any = {};
  const uniqufied = array.filter((a) => {
    const v = value(a);
    if (mem[v]) {
      return false;
    }
    mem[v] = true;
    return true;
  });
  return uniqufied;
}

/**
 * オブジェクト `obj` のキーを列挙した配列を返す.\
 * `Object.keys`とは異なり, 配列の要素の型は obj のキーの型になる.
 * @param obj
 * @returns
 */
export function keys<T extends object>(obj: T) {
  return Object.keys(obj) as unknown as Array<keyof typeof obj>;
}

/**
 * 配列`array`を, 「`array`の各要素に関数`value`を適用した値」をキーとしたマップに変換したものを返す.
 * @param array
 * @param value
 * @returns
 */
export function keyBy<T>(
  array: T[],
  value: (a: T) => string
): { [key: string]: T } {
  const r: any = {};
  array.forEach((a) => {
    r[value(a)] = a;
  });
  return r;
}
