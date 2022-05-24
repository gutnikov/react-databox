import { useEffect, useState } from 'react';

export type Cancellable = () => void;

export type DataSourceState<RQ, V> = {
  pending: boolean;
  request?: RQ;
  error?: Error;
  value?: V | undefined;
};

export type PerformRequestFunction<RQ, V, P> = (
  rq: RQ | undefined,
  params: P | undefined,
  onUpdate: ((state: DataSourceState<RQ, V>) => void) | undefined,
) => Cancellable;

export type DataSourceStateListener<RQ, V> = (state: DataSourceState<RQ, V>) => void;
export type DataSource<RQ, V> = {
  setRequest: (rq: RQ | undefined) => void;
  listen: (l: DataSourceStateListener<RQ, V>) => void;
  unlisten: (l: DataSourceStateListener<RQ, V>) => void;
};

export type DataSourceInit<RQ, V, P> = {
  request?: RQ;
  params?: P;
  performRequestFunction: PerformRequestFunction<RQ, V, P>;
};

export type DataSourceHookValue<RQ, V> = [DataSourceState<RQ, V>, (req: RQ | undefined) => void];

function createDataSource<RQ, V, P>(
  init: DataSourceInit<RQ, V, P>,
  initialListener: DataSourceStateListener<RQ, V> | undefined,
): DataSource<RQ, V> {
  const { request, params, performRequestFunction } = init;

  let listener = initialListener;
  let cancelRequest: Cancellable | undefined;

  function setRequest(req: RQ | undefined): void {
    // cancel previous request
    if (request && cancelRequest) {
      cancelRequest();
    }
    if (!performRequestFunction) {
      throw new Error('perform request function is undefined');
    }
    cancelRequest = performRequestFunction(req, params, listener);
  }

  const ds = {
    ...init,
    listen: (l: DataSourceStateListener<RQ, V>): void => {
      listener = l;
    },
    unlisten: () => {
      listener = undefined;
    },
    setRequest,
  };
  return ds;
}

export function useDataSource<RQ, V, P>(
  init: DataSourceInit<RQ, V, P>,
): DataSourceHookValue<RQ, V> {
  // Changes every datasource update causing component render
  const [state, _setState] = useState<DataSourceState<RQ, V>>({
    pending: false,
  });
  // Created once when first rendered
  const [dataSource] = useState(createDataSource(init, setState));

  function setState(update: DataSourceState<RQ, V>): void {
    console.log(state, update);
    _setState({ ...state, ...update });
  }

  useEffect(() => {
    console.log('state=', state);
  }, [state]);

  useEffect(() => {
    dataSource.listen(setState);
    return () => {
      dataSource.unlisten(setState);
    };
  });

  return [state, dataSource.setRequest];
}
