// DataSource state
export type DataSourceState<V> = {
  pending: boolean;
  error?: Error;
  value?: V | undefined;
};

// Initialize a new DataSource
export type DataSourceInit<M, O> = {
  // What to send on init
  initialMessage?: M;
  // DataSource options
  options: O;
};

export type DataSourceHookValue<M, V> = {
  state: DataSourceState<V>;
  emit: (m: M | undefined) => void;
  cancel: () => void;
};
