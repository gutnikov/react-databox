import { UnaryCallOptions } from 'useDataSource/common/useUnaryCall';
import { useGet, TypedRequest, TypedResponse } from 'useDataSource/fetch/json/useGet';
import { FetchRequest, FetchResponse } from 'useDataSource/fetch/useFetch';
import { DataSourceHookValue, DataSourceInit } from 'useDataSource/types';

// Defined in declare plugin
declare const API: string;

export type Request = {
  search: string;
  delay?: string;
};

export type Timezone = {
  value: string;
  abbr: string;
  offset: number;
  isdst: boolean;
  text: string;
  utc: string[];
};

export type Response = {
  items: Timezone[];
};

function toFetchRequest(r: TypedRequest<Request>): TypedRequest<Request> {
  return {
    ...r,
    url: `${API}/timezones`,
  };
}

export function useTimezones(
  init: DataSourceInit<TypedRequest<Request>, UnaryCallOptions<FetchRequest, FetchResponse>>,
): DataSourceHookValue<TypedRequest<Request>, TypedResponse<Response>> {
  const {
    state,
    cancel,
    emit: baseEmit,
  } = useGet<Request, Response>({
    ...init,
    initialMessage: init.initialMessage ? toFetchRequest(init.initialMessage) : undefined,
  });

  function emit(req: TypedRequest<Request> | undefined): void {
    baseEmit(req ? toFetchRequest(req) : undefined);
  }

  return {
    state,
    cancel,
    emit,
  };
}
