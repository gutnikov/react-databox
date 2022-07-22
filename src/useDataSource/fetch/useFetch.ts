import { DataSourceHookValue, DataSourceState, DataSourceInit } from '../types';
import { CancelRequest, UnaryCallOptions, useUnaryCall } from '../common/useUnaryCall';

export type FetchRequest = {
  url?: string;
  init?: RequestInit;
};

export type FetchResponse = {
  response: Response;
};

function fetchRequest(
  rq: FetchRequest | undefined,
  onUpdate: (upd: DataSourceState<FetchResponse>) => void,
): CancelRequest {
  // Reset a request if undefined request passed
  if (!rq) {
    onUpdate &&
      onUpdate({
        pending: false,
        error: undefined,
        value: undefined,
      });
    return () => false;
  }

  const { url, init } = rq;

  if (!url) {
    throw new Error(`Fetch url is undefined`);
  }

  const controller = new AbortController();
  const fetchPromise = fetch(url, { ...init, signal: controller.signal });

  function setPending(pending: boolean): void {
    onUpdate &&
      onUpdate({
        error: undefined,
        pending,
      });
  }
  function setValue(response: Response): void {
    onUpdate &&
      onUpdate({
        pending: false,
        error: undefined,
        value: {
          response,
        },
      });
  }
  function setError(error?: Error): void {
    // Consider AbortError as a normal case
    onUpdate &&
      onUpdate({
        pending: false,
        error: error?.name === 'AbortError' ? undefined : error,
      });
  }

  setPending(true);
  fetchPromise.then(setValue).catch(setError);

  return () => {
    controller.abort();
  };
}

export function useFetch(
  init: DataSourceInit<FetchRequest, UnaryCallOptions<FetchRequest, FetchResponse>>,
): DataSourceHookValue<FetchRequest, FetchResponse> {
  const { initialMessage, options } = init;
  return useUnaryCall({
    initialMessage,
    options: {
      ...options,
      performRequestFunction: fetchRequest,
    },
  });
}
