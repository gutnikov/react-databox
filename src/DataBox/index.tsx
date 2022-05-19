import React, {
  PropsWithChildren,
  Context,
  ReactElement,
  JSXElementConstructor,
  useEffect,
  useReducer,
  Reducer,
  useContext,
  useState,
} from 'react';

export type Cancellable = () => void;

export type PerformRequestFunction<RQ, V, P> = (
  url: string,
  rq: RQ | undefined,
  params: P | undefined,
  setPending: (p: boolean) => void,
  setValue: (v: V | undefined) => void,
  setError: (e: Error | undefined) => void,
) => Cancellable;

export type DataBoxProps<RQ, V, P> = PropsWithChildren<{
  url?: string;
  request?: RQ;
  params?: P;
  Context?: Context<DataBoxContextValue<RQ, V, P>>;
  performRequest?: PerformRequestFunction<RQ, V, P>;
  debug?: boolean;
  name?: string;
}>;

export type DataBoxContextValue<RQ, V, P> = {
  pending: boolean;
  request?: RQ;
  params?: P;
  value?: V;
  error?: Error;
  debug?: boolean;
  name?: string;
  version: number;
  setRequest: (r: RQ | undefined, params: P | undefined) => void;
  setOutdated: () => void;
};

export type DataBoxAction<RQ, V, P> =
  | { type: 'setRequest'; req: RQ | undefined; params: P | undefined }
  | { type: 'setValue'; value: V | undefined }
  | { type: 'setError'; error: Error | undefined }
  | { type: 'setOutdated' }
  | { type: 'setPending'; pending: boolean };

export type DataBoxReducer<RQ, V, P> = Reducer<
  DataBoxContextValue<RQ, V, P>,
  DataBoxAction<RQ, V, P>
>;

function log(...args: unknown[]): void {
  // eslint-disable-next-line
  console.log(...args);
}

function reducer<RQ, V, P>(
  state: DataBoxContextValue<RQ, V, P>,
  action: DataBoxAction<RQ, V, P>,
): DataBoxContextValue<RQ, V, P> {
  let newState;
  switch (action.type) {
    case 'setRequest':
      newState = {
        ...state,
        request: action.req,
      };
      break;

    case 'setValue':
      newState = {
        ...state,
        value: action.value,
      };
      break;

    case 'setOutdated':
      newState = {
        ...state,
        version: state.version + 1,
      };
      break;

    case 'setError':
      newState = {
        ...state,
        error: action.error,
      };
      break;

    case 'setPending':
      newState = {
        ...state,
        pending: action.pending,
      };
      break;
    default:
      newState = state;
  }
  if (state.debug) {
    log(state.name, action.type, action, state, newState);
  }
  return newState;
}

export function DataBox<RQ, V, P>(props: DataBoxProps<RQ, V, P>): ReactElement {
  const { url, params, Context, request, performRequest, debug, name, children } = props;

  const setRequest = (req: RQ | undefined, params: P | undefined): void =>
    dispatch({ type: 'setRequest', req, params });
  const setOutdated = (): void => dispatch({ type: 'setOutdated' });

  const [state, dispatch] = useReducer<DataBoxReducer<RQ, V, P>>(reducer, {
    pending: false,
    request,
    version: 0,
    debug,
    name,
    setRequest,
    setOutdated,
  });

  useEffect(() => {
    const setPending = (pending: boolean): void => dispatch({ type: 'setPending', pending });
    const setValue = (value: V | undefined): void => dispatch({ type: 'setValue', value });
    const setError = (error: Error | undefined): void => dispatch({ type: 'setError', error });

    if (!url) {
      throw new Error('DataBox url is undefined');
    }
    if (!performRequest) {
      throw new Error('DataBox request function is undefined');
    }

    const cancel = performRequest(url, state.request, params, setPending, setValue, setError);
    return () => {
      if (debug) {
        log('Canceling request ');
      }
      cancel();
    };
  }, [url, params, performRequest, state.request, state.version]);

  // A request prop changed
  useEffect(() => {
    setRequest(request, params);
  }, [request, params]);

  if (!Context) {
    throw new Error('DataBox context is undefined');
  }
  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export function createDataBoxContext<RQ, V, P>(): Context<DataBoxContextValue<RQ, V, P>> {
  return React.createContext<DataBoxContextValue<RQ, V, P>>({
    pending: false,
    version: 0,
    setRequest: () => false,
    setOutdated: () => false,
  });
}

export type DataBoxHook<RQ, V, P> = () => DataBoxContextValue<RQ, V, P>;
export function createDataBoxHook<RQ, V, P>(
  ctx: Context<DataBoxContextValue<RQ, V, P>>,
): DataBoxHook<RQ, V, P> {
  return () => useContext(ctx);
}

export type DataBoxComponent<RQ, V, P> = JSXElementConstructor<DataBoxProps<RQ, V, P>>;
export function createDataBox<RQ, V, P>(
  url: string,
  params: P,
  performRequest: PerformRequestFunction<RQ, V, P>,
): [DataBoxHook<RQ, V, P>, DataBoxComponent<RQ, V, P>] {
  const context = createDataBoxContext<RQ, V, P>();
  const hook = createDataBoxHook(context);
  function BoxComponent(p: DataBoxProps<RQ, V, P>): ReactElement {
    return (
      <DataBox url={url} params={params} {...p} performRequest={performRequest} Context={context} />
    );
  }
  return [hook, BoxComponent];
}
