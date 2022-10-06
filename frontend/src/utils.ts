type Many<T> = T | ReadonlyArray<T>;

export function pick<T extends object, U extends keyof T>(
  object: T,
  ...props: Array<Many<U>>
): Pick<T, U> {
  const d: any = {};
  props.forEach((key) => {
    d[key] = (object as any)[key];
  });
  return d;
}

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
