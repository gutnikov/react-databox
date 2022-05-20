import React, {
  PropsWithChildren,
  Context,
  ReactElement,
  JSXElementConstructor,
  useEffect,
  useReducer,
  Reducer,
  useContext,
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
  currentRequest?: RQ;
  nextRequest?: RQ;
  params?: P;
  value?: V;
  error?: Error;
  debug?: boolean;
  name?: string;
  version: number;
  setRequest: (r: RQ | undefined, params?: P) => void;
  setOutdated: () => void;
};

export type DataBoxAction<RQ, V, P> =
  | {
      type: 'setNextRequest';
      req: RQ | undefined;
      params?: P;
      keepValue?: boolean;
      keepError?: boolean;
    }
  | { type: 'commitRequest' }
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

const emptyFn = (): void => undefined;

function reducer<RQ, V, P>(
  state: DataBoxContextValue<RQ, V, P>,
  action: DataBoxAction<RQ, V, P>,
): DataBoxContextValue<RQ, V, P> {
  let newState;
  switch (action.type) {
    case 'setNextRequest':
      // Same request fired?
      newState = {
        ...state,
        nextRequest: action.req,
        params: action.params,
        error: action.keepError ? state.error : undefined,
        value: action.keepValue ? state.value : undefined,
      };
      break;

    case 'commitRequest':
      newState = {
        ...state,
        currentRequest: state.nextRequest,
        nextRequest: undefined,
        error: undefined,
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
        nextRequest: state.currentRequest,
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

  const setNextRequest = (req: RQ | undefined, params: P | undefined): void =>
    dispatch({ type: 'setNextRequest', req, params });
  const setOutdated = (): void => dispatch({ type: 'setOutdated' });

  console.log('render');

  const [state, dispatch] = useReducer<DataBoxReducer<RQ, V, P>>(reducer, {
    pending: false,
    nextRequest: request,
    version: 0,
    debug,
    name,
    setRequest: setNextRequest,
    setOutdated,
  });

  useEffect(() => {
    if (!state.nextRequest) {
      return emptyFn;
    }
    const commitRequest = (): void => dispatch({ type: 'commitRequest' });
    const setPending = (pending: boolean): void => dispatch({ type: 'setPending', pending });
    const setValue = (value: V | undefined): void => dispatch({ type: 'setValue', value });
    const setError = (error: Error | undefined): void => dispatch({ type: 'setError', error });

    const request = state.nextRequest;
    if (!url) {
      throw new Error('DataBox url is undefined');
    }
    if (!performRequest) {
      throw new Error('DataBox request function is undefined');
    }

    // At this moment nextRequest moved to currentRequest state field
    commitRequest();
    const cancel = performRequest(url, request, params, setPending, setValue, setError);
    return () => {
      if (debug) {
        log('Canceling request ');
      }
      cancel();
    };
  }, [url, params, performRequest, state.nextRequest, state.version]);

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
