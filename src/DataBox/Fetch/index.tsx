import { createDataBox, DataBoxProps, Cancellable, DataBoxHook, DataBoxComponent } from '..';

export type HttpRequestParams = {
  method?: 'get' | 'post';
  headers?: { [key: string]: string };
};

const defaults = {
  method: 'get',
  headers: {
    'Content-Type': 'application/json',
  },
};

function fetchRequest<RQ, V>(
  url: string,
  rq: RQ | undefined,
  params: HttpRequestParams | undefined,
  setPending: (p: boolean) => void,
  setValue: (v: V) => void,
  setError: (e: Error) => void,
): Cancellable {
  const { method, headers } = params || defaults;

  const requestString = rq ? JSON.stringify(rq) : '';
  const search =
    method === 'get' && requestString ? new URLSearchParams({ q: requestString }).toString() : '';
  const urlWithSearch = `${url}${search.length ? '?' : ''}${search}`;

  const controller = new AbortController();
  const fetchPromise = fetch(urlWithSearch, {
    ...defaults,
    method,
    headers,
    body: method === 'post' ? requestString : undefined,
    signal: controller.signal,
  });

  setPending(true);
  fetchPromise
    .then((data) => data.json())
    .then(setValue)
    .catch(setError)
    .finally(() => {
      setPending(false);
    });

  return () => {
    controller.abort();
  };
}

export type FetchDataBoxProps<RQ, V> = DataBoxProps<RQ, V, HttpRequestParams>;

export function createFetchDataBox<RQ, V>(
  url: string,
  params: HttpRequestParams,
): [DataBoxHook<RQ, V, HttpRequestParams>, DataBoxComponent<RQ, V, HttpRequestParams>] {
  return createDataBox<RQ, V, HttpRequestParams>(url, params, fetchRequest);
}
