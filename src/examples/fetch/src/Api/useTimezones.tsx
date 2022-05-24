import {
  useFetchDataSource,
  FetchDataSourceHookValue,
  FetchDataSourceInit,
} from 'lib/useDataSource/fetch/useFetchDataSource';

export * from 'lib/useDataSource/fetch/useFetchDataSource';

// Defined in declare plugin
declare const API: string;

export type Request = {
  search: string;
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

export const useTimezones = (
  init: FetchDataSourceInit<Request, Response>,
): FetchDataSourceHookValue<Request, Response> => useFetchDataSource(`${API}/timezones`, init);
