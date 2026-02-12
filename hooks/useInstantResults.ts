
import { useState, useEffect } from "react";

/**
 * useInstantResults
 * Ensures the UI feels immediate by painting the results screen
 * before heavy logic or network requests conclude.
 */
export function useInstantResults<T>(resolverFn: () => Promise<T> | T, dependencies: any[]) {
  const [state, setState] = useState<{ loading: boolean; data: T | null }>({
    loading: true,
    data: null,
  });

  useEffect(() => {
    setState({ loading: true, data: null });
    
    // Use requestAnimationFrame to ensure the transition happens in the next paint cycle
    const frame = requestAnimationFrame(() => {
      Promise.resolve(resolverFn()).then((data) => {
        setState({ loading: false, data });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, dependencies);

  return state;
}
