// Ints are usually used to "enrich" request/response data
// For ex.:
// - set request cookies or auth metadata
// - parse response data to an object
export type Interceptor<M, O> = (r: M | undefined, opt: O | undefined) => M | undefined;

export type Interceptors<M, V, O> = {
  processRequest?: Interceptor<M, O>[];
  processValue?: Interceptor<V, O>[];
};

// Utility functions to combine hooks into hook chains
export function createInterceptorChain<M, O>(hooks: Interceptor<M, O>[]): Interceptor<M, O> {
  return (m: M | undefined, o: O | undefined): M | undefined => {
    let result = m;
    hooks.forEach((h) => {
      result = h(result, o);
    });
    return result;
  };
}
