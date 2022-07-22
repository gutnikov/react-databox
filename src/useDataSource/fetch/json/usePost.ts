import { UnaryCallOptions } from 'useDataSource/common/useUnaryCall';
import { DataSourceHookValue, DataSourceInit } from 'useDataSource/types';
import { FetchRequest, FetchResponse } from '../useFetch';
import { useFetchTyped, TypedResponse } from './useFetchTyped';

// Post method, request is typed
export type TypedRequest<RQ> = FetchRequest & {
  data?: RQ;
};
export { TypedResponse } from './useFetchTyped';

function toFetchRequest<T>(r: TypedRequest<T>): FetchRequest {
  const { data, init } = r;
  return {
    ...r,
    init: {
      ...init,
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
      method: 'post',
      body: JSON.stringify(data),
    },
  };
}

export function usePost<RQ, RS>(
  init: DataSourceInit<TypedRequest<RQ>, UnaryCallOptions<FetchRequest, FetchResponse>>,
): DataSourceHookValue<TypedRequest<RQ>, TypedResponse<RS>> {
  const { initialMessage, options } = init;
  const {
    emit: baseEmit,
    cancel,
    state,
  } = useFetchTyped<RS>({
    initialMessage: initialMessage ? toFetchRequest(initialMessage) : undefined,
    options,
  });

  function emit(m: TypedRequest<RQ> | undefined): void {
    baseEmit(m ? toFetchRequest(m) : undefined);
  }

  return {
    emit,
    cancel,
    state,
  };
}
