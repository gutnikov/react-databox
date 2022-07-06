import { useEffect, useState } from 'react';

export type Cancellable = () => void;

// DataSource state
export type DataSourceState<RQ, V> = {
  pending: boolean;
  request?: RQ;
  error?: Error;
  value?: V | undefined;
};

// How to request data: fetch, grpc, socket or any other custom way
export type PerformRequestFunction<RQ, V, P> = (
  rq: RQ | undefined,
  params: P | undefined,
  onUpdate: ((state: DataSourceState<RQ, V>) => void) | undefined,
) => Cancellable;

// DataSource is an object that
// -has a state
// -takes a request
// -publishes it state update to it's listeners
export type DataSourceStateListener<RQ, V> = (state: DataSourceState<RQ, V>) => void;
export type DataSource<RQ, V> = {
  state: DataSourceState<RQ, V>;
  setRequest: (rq: RQ | undefined) => void;
  listen: (l: DataSourceStateListener<RQ, V>) => void;
  unlisten: (l: DataSourceStateListener<RQ, V>) => void;
};

// Where data is stored: component state or globally
export type DataSourceScope = { type: 'component' } | { type: 'global'; id: string };

// Initialize a new DataSource
export type DataSourceInit<RQ, V, P> = {
  // Initial request
  request?: RQ;
  // Params: headers, cookies, serialization etc
  params?: P;
  // component scope by default
  scope?: DataSourceScope;
  performRequestFunction: PerformRequestFunction<RQ, V, P>;
};

export type DataSourceHookValue<RQ, V> = [
  /* State: */ DataSourceState<RQ, V>,
  /* setReuest: */ (req: RQ | undefined) => void,
];

// All global scoped datasource states a stored here
const globalsDataSources: { [key: string]: DataSource<unknown, unknown> } = {};

function getNewbornState<RQ, V>(): DataSourceState<RQ, V> {
  return {
    pending: false,
  };
}

function createDataSource<RQ, V, P>(
  init: DataSourceInit<RQ, V, P>,
  initialListener: DataSourceStateListener<RQ, V> | undefined,
): DataSource<RQ, V> {
  const { request, params, performRequestFunction } = init;
  const listeners: DataSourceStateListener<RQ, V>[] = initialListener ? [initialListener] : [];
  const dsr = {
    ...init,
    state: getNewbornState<RQ, V>(),
    listen: (l: DataSourceStateListener<RQ, V>): void => {
      if (listeners.indexOf(l) === -1) {
        listeners.push(l);
      }
    },
    unlisten: (l: DataSourceStateListener<RQ, V>) => {
      const at = listeners.indexOf(l);
      if (at !== -1) {
        listeners.splice(at, 1);
      }
    },
    setRequest,
  };

  function onUpdate(update: DataSourceState<RQ, V>): void {
    dsr.state = update;
    listeners.forEach((it) => it(update));
  }

  let cancelRequest: Cancellable | undefined;
  function setRequest(req: RQ | undefined): void {
    // cancel previous request
    if (request && cancelRequest) {
      cancelRequest();
    }
    if (!performRequestFunction) {
      throw new Error('perform request function is undefined');
    }
    cancelRequest = performRequestFunction(req, params, onUpdate);
  }
  return dsr;
}

export function useDataSource<RQ, V, P>(
  init: DataSourceInit<RQ, V, P>,
): DataSourceHookValue<RQ, V> {
  // DataSource instance:
  // get or create datasource for global scope
  // create datasource for component scope
  const [dataSource] = useState(() => {
    const { scope } = init;
    // Global scope:
    if (scope?.type === 'global') {
      const gds = globalsDataSources;
      if (!gds[scope.id]) {
        gds[scope.id] = createDataSource(init, setState) as DataSource<unknown, unknown>;
      }
      return gds[scope.id] as DataSource<RQ, V>;
    }
    // Component scope:
    return createDataSource(init, setState);
  });

  // DataSource state:
  // get global datasource state if it exist
  // return initial state for other cases
  const [state, _setState] = useState<DataSourceState<RQ, V>>(() => {
    const { scope } = init;
    // Global scope:
    if (scope?.type === 'global') {
      const gds = globalsDataSources;
      return gds[scope.id].state as DataSourceState<RQ, V>;
    }
    // Component scope:
    return getNewbornState<RQ, V>();
  });

  function setState(update: DataSourceState<RQ, V>): void {
    _setState({ ...state, ...update });
  }

  // This will subscribe and unsubscribe to the datasource on every mount/unmount
  // For the component scoped datasources:
  // datasource is re-created for every mount/unmount cycle causing new request/response interaction
  // For global datasources:
  // datasource survive component mount/unmount cycle causing no request/response
  useEffect(() => {
    dataSource.listen(setState);
    return () => {
      dataSource.unlisten(setState);
    };
  });

  return [state, dataSource.setRequest];
}
