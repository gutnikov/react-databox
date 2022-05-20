import { Cancellable, DataSourceHookValue, DataSourceInit, Handle, useDataSource } from '..';

export type RequestSerializer<RQ> = (req: RQ | undefined) => string;
export type ResponseDeserializer<V> = (res: unknown) => V | undefined;

export type HttpRequestParams<RQ, V> = {
  method?: 'get' | 'post';
  headers?: { [key: string]: string };
  serializer: RequestSerializer<RQ | undefined>;
  deserializer: ResponseDeserializer<V>;
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
  handle: Handle,
  url: string,
  rq: RQ | undefined,
  params: HttpRequestParams<RQ, V> | undefined,
  onUpdate: (handle: string, req: RQ | undefined, p: boolean, e?: Error, v?: V) => void,
): Cancellable {
  const { method, headers, serializer, deserializer } = { ...defaults, ...params };
  const srlReq = serializer(rq);

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

  function setPending(p: boolean): void {
    onUpdate(handle, rq, p);
  }
  function setValue(v?: V): void {
    onUpdate(handle, rq, false, undefined, v);
  }
  function setError(e?: Error): void {
    onUpdate(handle, rq, false, e, undefined);
  }

  setPending(true);
  fetchPromise
    .then(deserializer)
    .then(setValue)
    .catch(setError)
    .finally(() => {
      // TODO: a bug, response is reset. Change onUpdate to distinct functions
      setPending(false);
    });

  return () => {
    controller.abort();
  };
}

export type FetchDataSourceInit<RQ, V> = Partial<DataSourceInit<RQ, V, HttpRequestParams<RQ, V>>>;

export function useFetchDataSource<RQ, V>(
  init: FetchDataSourceInit<RQ, V>,
): DataSourceHookValue<RQ, V> {
  return useDataSource({ ...init, performRequest: fetchRequest });
}

export * from '..';
