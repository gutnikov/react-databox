import { useEffect, useState } from 'react';
import { DataSourceState, DataSourceInit, DataSourceHookValue } from '../types';
import { Interceptors, createInterceptorChain } from './Interceptors';

export type UnaryCallOptions<RQ, V> = {
  interceptors?: Interceptors<RQ, V, UnaryCallOptions<RQ, V>>;
  handle?: string;
  keepPreviousRequest?: boolean;
  performRequestFunction?: UnaryCallFunction<RQ, V>;
};

export type CancelRequest = () => void;
export type UnaryCallFunction<RQ, V> = (
  rq: RQ | undefined,
  onUpdate: (state: DataSourceState<V>) => void,
) => CancelRequest;

export type UnaryCallUpdateListener = () => void;
export type UnaryCallObject<RQ, V> = {
  state: DataSourceState<V>;
  setRequest: (rq: RQ | undefined) => void;
  cancelRequest: () => void;
  listen: (l: UnaryCallUpdateListener) => void;
  unlisten: (l: UnaryCallUpdateListener) => void;
};

// All global scoped datasources are stored here
type GlobalStorage = { [key: string]: UnaryCallObject<unknown, unknown> };
const globalStorage: GlobalStorage = {};

function getNewbornState<V>(): DataSourceState<V> {
  return {
    pending: false,
  };
}

function createUnaryCallObject<RQ, V>(
  init: DataSourceInit<RQ, UnaryCallOptions<RQ, V>>,
): UnaryCallObject<RQ, V> {
  const { options } = init;
  const listeners: UnaryCallUpdateListener[] = [];

  // Hooks chains
  const processRequest = createInterceptorChain(options?.interceptors?.processRequest || []);
  const processValue = createInterceptorChain(options?.interceptors?.processValue || []);

  const dsr = {
    ...init,
    state: getNewbornState<V>(),
    listen: (l: UnaryCallUpdateListener): void => {
      if (listeners.indexOf(l) === -1) {
        listeners.push(l);
      }
    },
    unlisten: (l: UnaryCallUpdateListener) => {
      const at = listeners.indexOf(l);
      if (at !== -1) {
        listeners.splice(at, 1);
      }
    },
    setRequest,
    cancelRequest,
  };

  function onUpdate(update: DataSourceState<V>): void {
    const processedState = {
      ...update,
      value: processValue(update.value, options),
    };
    dsr.state = processedState;
    listeners.forEach((it) => it());
  }

  let doCancel: CancelRequest | undefined;
  function setRequest(req: RQ | undefined): void {
    // cancel previous request
    if (options?.keepPreviousRequest) {
      //
    } else if (doCancel) {
      doCancel();
    }
    if (!options?.performRequestFunction) {
      throw new Error('perform request function is undefined');
    }
    const processedReq = processRequest(req, options);
    doCancel = options.performRequestFunction(processedReq, onUpdate);
  }

  function cancelRequest(): void {
    if (doCancel) {
      doCancel();
    }
  }
  return dsr;
}

export function getUnaryCallObject<RQ, V>(
  init: DataSourceInit<RQ, UnaryCallOptions<RQ, V>>,
  // Required in test cases
  storage?: GlobalStorage,
): UnaryCallObject<RQ, V> {
  const { options } = init;
  const handle = options?.handle;
  // Global scope:
  if (handle) {
    const gds = storage || globalStorage;
    if (!gds[handle]) {
      gds[handle] = createUnaryCallObject(init) as UnaryCallObject<unknown, unknown>;
    }
    return gds[handle] as UnaryCallObject<RQ, V>;
  }
  // Component scope:
  return createUnaryCallObject(init);
}

export function getDataSourceState<RQ, V>(
  init: DataSourceInit<RQ, UnaryCallOptions<RQ, V>>,
): DataSourceState<V> {
  const { options } = init;
  // Global scope:
  if (options?.handle) {
    const gds = globalStorage;
    return gds[options?.handle].state as DataSourceState<V>;
  }
  // Component scope:
  return getNewbornState<V>();
}

function useIncrement(): [number, () => void] {
  const [value, setValue] = useState(1);
  return [
    value,
    () => {
      setValue(value + 1);
    },
  ];
}

export function useUnaryCall<RQ, V>(
  init: DataSourceInit<RQ, UnaryCallOptions<RQ, V>>,
): DataSourceHookValue<RQ, V> {
  // Every time inc get's updated a hook component get's rerendered
  const [, increment] = useIncrement();

  // Get or create DataSource instance:
  const [dataSource] = useState(() => getUnaryCallObject(init));

  // Listen to datasource updates
  // Note: if you want to avoid sending requests on every render then use handle in options -
  // this will lead for datasource object to be cached and reused on next component render
  // Note: this is also a way to share datasource across multiple components
  useEffect(() => {
    dataSource.listen(increment);
    return () => {
      dataSource.unlisten(increment);
    };
  });

  return {
    state: dataSource.state as DataSourceState<V>,
    emit: dataSource.setRequest,
    cancel: dataSource.cancelRequest,
  };
}
