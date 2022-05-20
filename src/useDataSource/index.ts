import { useState, useEffect } from 'react';

export type Cancellable = () => void;

export type PerformRequestFunction<RQ, V, P> = (
  handle: string,
  url: string,
  rq: RQ,
  params: P,
  onUpdate: (handle: string, request: RQ | undefined, p: boolean, e?: Error, v?: V) => void,
) => Cancellable;

export type DataSourceState<RQ, V> = {
  request?: RQ;
  pending?: boolean;
  error?: Error;
  value?: V | undefined;
};

type DataSourceStateListener<RQ, V> = (state: DataSourceState<RQ, V>) => void;
export type Handle = string;

export type DataSource<RQ, V, P> = {
  url: string;
  handle: Handle;
  request?: RQ;
  state: DataSourceState<RQ, V>;
  cancelRequest?: Cancellable;
  params?: P;
  debug?: boolean;
  performRequest: PerformRequestFunction<RQ, V, P>;
  listeners: DataSourceStateListener<RQ, V>[];
};

export type DataSourceInit<RQ, V, P> = Pick<
  DataSource<RQ, V, P>,
  'url' | 'request' | 'handle' | 'params' | 'debug' | 'performRequest'
>;

function log(handle: Handle, ...args: unknown[]): void {
  const item = dataSources[handle];
  if (item?.debug) {
    // eslint-disable-next-line
    console.log(handle, ':', ...args);
  }
}

const dataSources = {} as { [key: string]: DataSource<unknown, unknown, unknown> };
function tryGetDataSource(handle: string): DataSource<unknown, unknown, unknown> {
  const dataSource = dataSources[handle];
  if (!dataSource) {
    throw new Error(`DataSource with handle ${handle} not found`);
  }
  return dataSource;
}

export function createDataSource<RQ, V, P>(init: DataSourceInit<RQ, V, P>): void {
  const dataSource = dataSources[init.handle];
  if (dataSource) {
    throw new Error(`There is already existing datasource with this handle ${init.handle}`);
  }
  dataSources[init.handle] = {
    ...(init as DataSourceInit<unknown, unknown, unknown>),
    state: {
      pending: false,
    },
    listeners: [],
  };

  log(init.handle, 'Created datasource');

  if (init.request) {
    setNextRequest(init.handle, init.request);
  }
}

export function isDataSourceExists(handle: Handle): boolean {
  return !!dataSources[handle];
}

export function getDataSourceState<RQ, V>(handle: Handle): DataSourceState<RQ, V> {
  const dataSource = tryGetDataSource(handle);
  return dataSource.state as DataSourceState<RQ, V>;
}

export function setNextRequest(handle: string, nextRequest: unknown): void {
  const dataSource = tryGetDataSource(handle);
  const { url, params, request, cancelRequest, performRequest } = dataSource;
  if (request && cancelRequest) {
    cancelRequest();
  }
  if (!url) {
    throw new Error('url is undefined');
  }
  if (!performRequest) {
    throw new Error('perform request function is undefined');
  }
  const cancelNextRequest = performRequest(handle, url, nextRequest, params, handleUpdate);
  dataSources[handle] = {
    ...dataSource,
    request: nextRequest,
    cancelRequest: cancelNextRequest,
  };
}

function handleUpdate(
  handle: string,
  request: unknown,
  pending: boolean,
  error: Error | undefined,
  value: unknown,
): void {
  const dataSource = tryGetDataSource(handle);
  const state = {
    request,
    pending,
    error,
    value,
  };

  log(handle, state);

  dataSources[handle] = {
    ...dataSource,
    state,
  };

  const { listeners } = dataSource;
  listeners?.forEach((it) => it(state));
}

export function listen<RQ, V>(handle: string, listener: DataSourceStateListener<RQ, V>): void {
  const { listeners } = tryGetDataSource(handle);
  if (listeners?.indexOf(listener as DataSourceStateListener<unknown, unknown>) === -1) {
    listeners.push(listener as DataSourceStateListener<unknown, unknown>);
  }
}

export function unlisten<RQ, V>(handle: string, listener: DataSourceStateListener<RQ, V>): void {
  const { listeners } = tryGetDataSource(handle);
  const atIndex = listeners?.indexOf(listener as DataSourceStateListener<unknown, unknown>);
  if (atIndex && atIndex !== -1) {
    listeners?.splice(atIndex, 1);
  }
}

export function createRandomHandle(): Handle {
  return `h#${String(Math.random()).slice(-8)}`;
}

export function createHandle(v: string): Handle {
  return v;
}

export type DataSourceHookValue<RQ, V> = [DataSourceState<RQ, V>, (req: RQ) => void, Handle];

export function useDataSource<RQ, V, P>(
  init: Partial<DataSourceInit<RQ, V, P>>,
): DataSourceHookValue<RQ, V> {
  const [handle] = useState<Handle>(init.handle || createRandomHandle());
  // Ensure datasource exists
  if (!isDataSourceExists(handle)) {
    if (!init.url) {
      throw new Error('DataSource url is undefined');
    }
    if (!init.performRequest) {
      throw new Error('DataSource request function is undefined');
    }
    // @ts-ignore
    createDataSource({ ...init, handle });
  }
  // Take datasource current state
  const [state, setState] = useState<DataSourceState<RQ, V>>(getDataSourceState(handle));

  function setRequest(req: RQ): void {
    setNextRequest(handle, req);
  }
  useEffect(() => {
    listen(handle, setState);
    () => {
      unlisten(handle, setState);
    };
  }, []);

  return [state, setRequest, handle];
}
