import { UnaryCallOptions } from 'useDataSource/common/useUnaryCall';
import { DataSourceHookValue, DataSourceInit } from 'useDataSource/types';
import { FetchRequest, FetchResponse } from '../useFetch';
import { useFetchTyped, TypedResponse } from './useFetchTyped';

type SearchParams = Record<string, string> | string;

// Post method, request is typed
export type TypedRequest<RQ> = FetchRequest & {
  data?: RQ;
};
export { TypedResponse } from './useFetchTyped';

function toFetchRequest<T extends SearchParams>(r: TypedRequest<T>): FetchRequest {
  const { data, init } = r;
  const search = data ? new URLSearchParams(data) : null;
  return {
    ...r,
    url: search ? `${r.url}?${search.toString()}` : r.url,
    init: {
      ...init,
      method: 'get',
    },
  };
}

export function useGet<RQ extends SearchParams, RS>(
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
