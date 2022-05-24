import {
  Cancellable,
  DataSourceHookValue,
  DataSourceInit,
  DataSourceStateListener,
  useDataSource,
} from '..';

export * from '..';

export type RequestSerializer<RQ> = (req: RQ | undefined) => string;
export type ResponseDeserializer<V> = (res: unknown) => V | undefined;

export type HttpRequestParams<RQ, V> = {
  url: string;
  method?: 'get' | 'post';
  headers?: { [key: string]: string };
  serializer?: RequestSerializer<RQ | undefined>;
  deserializer?: ResponseDeserializer<V>;
};

const defaults = {
  method: 'get',
  headers: {
    'Content-Type': 'application/json',
  },
  serializer: (rq: unknown): string => (rq ? `q=${JSON.stringify(rq)}` : ''),
  deserializer: (res: Body) => res.json(),
};

function fetchRequest<RQ, V>(
  rq: RQ | undefined,
  params: HttpRequestParams<RQ, V> | undefined,
  onUpdate: DataSourceStateListener<RQ, V> | undefined,
): Cancellable {
  const { url, method, headers, serializer, deserializer } = { ...defaults, ...params };
  const srlReq = serializer(rq);

  if (!url) {
    throw new Error('url is undefined');
  }

  let getUrl = url;
  if (method === 'get' && srlReq) {
    getUrl = `${url}?${srlReq}`;
  }

  const controller = new AbortController();
  const fetchPromise = fetch(method === 'get' ? getUrl : url, {
    ...defaults,
    method,
    headers,
    body: method === 'post' ? srlReq : undefined,
    signal: controller.signal,
  });

  function setPending(pending: boolean): void {
    onUpdate &&
      onUpdate({
        error: undefined,
        pending,
      });
  }
  function setValue(value?: V): void {
    onUpdate &&
      onUpdate({
        pending: false,
        error: undefined,
        value,
      });
  }
  function setError(error?: Error): void {
    // Consider AbortError as a normal case
    if (error?.name === 'AbortError') {
      return;
    }
    onUpdate &&
      onUpdate({
        pending: false,
        error,
      });
  }

  setPending(true);
  fetchPromise.then(deserializer).then(setValue).catch(setError);

  return () => {
    controller.abort();
  };
}

export type FetchDataSourceInit<RQ, V> = Omit<
  DataSourceInit<RQ, V, HttpRequestParams<RQ, V>>,
  'performRequestFunction'
>;
export type FetchDataSourceHookValue<RQ, V> = DataSourceHookValue<RQ, V>;

export function useFetchDataSource<RQ, V>(
  url: string,
  init: FetchDataSourceInit<RQ, V>,
): FetchDataSourceHookValue<RQ, V> {
  return useDataSource({
    ...init,
    performRequestFunction: fetchRequest,
    params: { ...init.params, url },
  });
}
