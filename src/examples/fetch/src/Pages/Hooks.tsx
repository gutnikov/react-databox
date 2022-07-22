import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { FetchRequest, FetchResponse } from 'useDataSource/fetch/useFetch';
import { useTimezones } from '../Api/useTimezones';

function setCustomHeader1(
  r: FetchRequest | undefined,
  // o: UnaryCallOptions<FetchRequest, FetchResponse> | undefined,
): FetchRequest {
  return {
    ...r,
    init: {
      headers: { ...r?.init?.headers, 'X-question': 'Main' },
    },
  };
}

function setCustomHeader2(
  r: FetchRequest | undefined,
  // o: UnaryCallOptions<FetchRequest, FetchResponse> | undefined,
): FetchRequest {
  const q1 = r?.init?.headers ? (r.init.headers as Record<string, string>)['X-question'] : '';
  return {
    ...r,
    init: {
      headers: { ...r?.init?.headers, 'X-question': `${q1} question` },
    },
  };
}

function processValue(r: FetchResponse | undefined): FetchResponse | undefined {
  // eslint-disable-next-line
  console.log(r?.response.headers.get('X-Powered-By'));
  return r;
}

export function Hooks(): ReactElement {
  const { state, emit } = useTimezones({
    initialMessage: {
      data: {
        search: 'Hawaiian',
      },
    },
    options: {
      interceptors: {
        processRequest: [setCustomHeader1, setCustomHeader2],
        processValue: [processValue],
      },
    },
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    emit({
      data: {
        search,
      },
    });
  }, [search]);

  const content = useMemo(() => {
    const { error, pending, value } = state;
    if (error) {
      return <div>{`Error: ${error}`}</div>;
    }
    if (pending) {
      return <div>Loading...</div>;
    }
    if (value) {
      return (
        <div>
          {value.data?.items.map((it) => (
            <div key={`${it.abbr}-${it.value}`} className="p-1">
              {it.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  }, [state]);

  return (
    <div className="p-3" style={{ minWidth: '420px', maxWidth: '560px', margin: 'auto' }}>
      <form className="sticky-top bg-light">
        <div className="p-3">
          <h3 className="mb-2">Search timezones</h3>
          <div className="row mb-3">
            <div className="col-9">
              <input
                type="text"
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <hr />
      </form>
      {content}
    </div>
  );
}

/*
  Examples:

  3. DataSource composition
    - Combine data
    - Data + local timers
    - Debouncing

  4. Testing
    - How to mock datasources to test them?
    - Test example

*/
