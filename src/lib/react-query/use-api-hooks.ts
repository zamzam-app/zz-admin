import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';

/**
 * Reusable Query Hook
 */
export function useApiQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Reusable Mutation Hook with automatic cache invalidation
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys?: unknown[][],
  options?: UseMutationOptions<TData, Error, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    ...options, // Spread options first so they can be overridden by our mandatory handlers
    mutationFn,
    onSuccess: async (data: TData, variables: TVariables, context: unknown) => {
      console.info('Mutation success:', { data, variables });

      // 1. Invalidate queries if keys provided
      if (invalidateKeys) {
        await Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
        );
      }

      // 2. Call user-provided onSuccess if exists
      if (options?.onSuccess) {
        await (
          options.onSuccess as (
            data: TData,
            variables: TVariables,
            context: unknown,
          ) => Promise<unknown> | void
        )(data, variables, context);
      }
    },
    onError: (error: Error, variables: TVariables, context: unknown) => {
      console.error('Mutation error:', error);

      // Call user-provided onError if exists
      if (options?.onError) {
        (options.onError as (error: Error, variables: TVariables, context: unknown) => void)(
          error,
          variables,
          context,
        );
      }
    },
  });
}
