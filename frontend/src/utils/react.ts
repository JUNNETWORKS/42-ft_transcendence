export function onEnter(
  proc: (e: React.KeyboardEvent<HTMLInputElement>) => void
): (e: React.KeyboardEvent<HTMLInputElement>) => void {
  return (e) => {
    if (e.key !== 'Enter') {
      return;
    }
    e.preventDefault();
    proc(e);
  };
}
