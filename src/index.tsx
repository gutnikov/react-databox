import React, {
  PropsWithChildren,
  Context,
  ReactElement,
  useEffect,
  useReducer,
  Reducer,
} from 'react';

type Cancellable = () => void;

type PerformRequestFunction<RQ, V, P> = (
  url: string,
  rq: RQ | undefined,
  params: P | undefined,
  setPending: (p: boolean) => void,
  setValue: (v: V | undefined) => void,
  setError: (e: Error | undefined) => void,
) => Cancellable;

type DataBoxProps<RQ, V, P> = PropsWithChildren<{
  url: string;
  request?: RQ;
  params?: P;
  Context: Context<DataBoxContextValue<RQ, V, P>>;
  performRequest: PerformRequestFunction<RQ, V, P>;
}>;

type DataBoxContextValue<RQ, V, P> = {
  pending: boolean;
  request?: RQ;
  params?: P;
  value?: V;
  error?: Error;
  version: number;
  setRequest: (r: RQ | undefined, params: P | undefined) => void;
  setOutdated: () => void;
};

// type HttpRequestParams = {
//   method: 'get' | 'post';
// };

// function httpRequest<RQ, V, P>(
//   url: string,
//   rq: RQ,
//   params: HttpRequestParams,
//   setPending: (p: boolean) => void,
//   setValue: (v: V) => void,
//   setError: (e: Error) => void
// ): Cancellable {
//   setPending(true);
//   let controller = new AbortController();
//   // @ts-ignore
//   fetch(`${url}?` + new URLSearchParams(rq), {
//     signal: controller.signal
//   })
//     .then((data) => data.json())
//     .then(setValue)
//     .catch(setError)
//     .finally(() => {
//       setPending(false);
//     });
//   return () => {
//     controller.abort();
//   }
// }

type DataBoxAction<RQ, V, P> =
  | { type: 'setRequest'; req: RQ | undefined; params: P | undefined }
  | { type: 'setValue'; value: V | undefined }
  | { type: 'setError'; error: Error | undefined }
  | { type: 'setOutdated' }
  | { type: 'setPending'; pending: boolean };

type DataBoxReducer<RQ, V, P> = Reducer<DataBoxContextValue<RQ, V, P>, DataBoxAction<RQ, V, P>>;

function reducer<RQ, V, P>(
  state: DataBoxContextValue<RQ, V, P>,
  action: DataBoxAction<RQ, V, P>,
): DataBoxContextValue<RQ, V, P> {
  switch (action.type) {
    case 'setRequest':
      return {
        ...state,
        pending: true,
        request: action.req,
        value: state.value,
        error: undefined,
      };

    case 'setValue':
      return {
        ...state,
        value: state.value,
      };

    case 'setOutdated': {
      return {
        ...state,
        version: state.version + 1,
      };
    }

    case 'setError': {
      return {
        ...state,
        error: action.error,
      };
    }

    case 'setPending': {
      return {
        ...state,
        pending: action.pending,
      };
    }

    default:
      return state;
  }
}

export function DataBox<RQ, V, P>(props: DataBoxProps<RQ, V, P>): ReactElement {
  const { url, params, Context, request, performRequest, children } = props;

  const setRequest = (req: RQ | undefined, params: P | undefined): void =>
    dispatch({ type: 'setRequest', req, params });
  const setOutdated = (): void => dispatch({ type: 'setOutdated' });

  const [state, dispatch] = useReducer<DataBoxReducer<RQ, V, P>>(reducer, {
    pending: false,
    request,
    version: 0,
    setRequest,
    setOutdated,
  });

  useEffect(() => {
    const setPending = (pending: boolean): void => dispatch({ type: 'setPending', pending });
    const setValue = (value: V | undefined): void => dispatch({ type: 'setValue', value });
    const setError = (error: Error | undefined): void => dispatch({ type: 'setError', error });

    const cancel = performRequest(url, state.request, params, setPending, setValue, setError);
    return () => {
      cancel();
    };
  }, [url, params, performRequest, state.request, state.version]);

  // A request prop changed
  useEffect(() => {
    setRequest(request, params);
  }, [request, params]);

  return <Context.Provider value={state}>{children}</Context.Provider>;
}
