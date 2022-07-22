import { useEffect, useState } from 'react';
import { UnaryCallOptions } from 'useDataSource/common/useUnaryCall';
import { DataSourceHookValue, DataSourceState, DataSourceInit } from 'useDataSource/types';
import { useFetch, FetchRequest, FetchResponse } from '../useFetch';

// The same as fetch but also
// parses json data and casts it to a type = T

export type TypedResponse<T> = {
  // Parsed value
  data?: T;
  // Original response
  rawResponse?: Response;
};

export function useFetchTyped<T>(
  init: DataSourceInit<FetchRequest, UnaryCallOptions<FetchRequest, FetchResponse>>,
): DataSourceHookValue<FetchRequest, TypedResponse<T>> {
  const { initialMessage, options } = init;
  const { emit: rawEmit, cancel, state: rawState } = useFetch({ initialMessage, options });
  const [typedState, setTypedState] = useState<DataSourceState<TypedResponse<T>>>({
    pending: false,
  });

  useEffect(() => {
    // If response is ready -> parse it to a typed value
    if (rawState.value) {
      parseResponseToType(rawState.value, (error: Error | undefined, data: T | undefined) => {
        setTypedState({
          pending: rawState.pending,
          // Could be a parsing error
          error: error || rawState.error,
          value: {
            data,
            rawResponse: rawState.value?.response,
          },
        });
      });
    }
    // Otherwise just set pending and error flags accordingly to raw fetch state
    else {
      setTypedState({
        ...rawState,
        value: undefined,
      });
    }
  }, [rawState]);

  // Same as rawEmit but with Accept:json header
  function emit(rq: FetchRequest | undefined): void {
    const withJsonHeaders = rq
      ? {
          ...rq,
          init: {
            ...rq.init,
            headers: {
              ...rq?.init?.headers,
              Accept: 'application/json',
            },
          },
        }
      : undefined;
    rawEmit(withJsonHeaders);
  }

  return {
    emit,
    cancel,
    state: typedState,
  };
}

function parseResponseToType<T>(
  rs: FetchResponse,
  cb: (e: Error | undefined, v: T | undefined) => void,
): void {
  rs.response
    // Clone is needed because of UnaryCall response will be accessed by multiple hooks
    // And the actual stream can be only read once
    .clone()
    .json()
    .then((parsed) => {
      cb(undefined, parsed as T);
    })
    .catch((error) => {
      cb(error, undefined);
    });
}
