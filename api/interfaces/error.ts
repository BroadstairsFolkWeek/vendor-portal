type ErrorWrapper<T> = {
  code: T;
  message?: string;
};

export type OrError<T, U, V = ErrorWrapper<U> | null> = readonly [V, T | null];

export function success<T>(result: T): readonly [null, T] {
  return [null, result];
}

export function error<T>(
  code: T,
  message?: string
): readonly [ErrorWrapper<T>, null] {
  if (message) {
    return [{ code, message }, null];
  } else {
    return [{ code }, null];
  }
}
