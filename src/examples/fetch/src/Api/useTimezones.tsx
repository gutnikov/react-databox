import {
  useFetchDataSource,
  DataSourceHookValue,
  FetchDataSourceInit,
} from '../useDataSource/fetch/useFetchDataSource';

export * from '../useDataSource/fetch/useFetchDataSource';

// Defined in declare plugin
declare const API: string;

type Request = {
  search: string;
};

type Timezone = {
  value: string;
  abbr: string;
  offset: number;
  isdst: boolean;
  text: string;
  utc: string[];
};

type Response = {
  items: Timezone[];
};

export const useTimezones = (
  init: FetchDataSourceInit<Request, Response>,
): DataSourceHookValue<Request, Response> =>
  useFetchDataSource({
    ...init,
    url: `${API}/timezones`,
  });
