import { createFetchDataBox } from '../DataBox/Fetch';

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

const [useTimezones, GetTimezones] = createFetchDataBox<Request, Response>(`${API}/timezones`, {
  method: 'get',
});

export { GetTimezones, useTimezones };
