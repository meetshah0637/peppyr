/**
 * Alternative approach: Use a ref to always get latest parameters
 * This ensures copyTemplate always has access to the latest parameters
 */

import { useRef, useEffect } from 'react';
import { useParameters } from './useParameters';

/**
 * Hook that provides a function to get the latest parameters
 * This avoids stale closure issues
 */
export const useParametersRef = () => {
  const { parameters, ...rest } = useParameters();
  const parametersRef = useRef(parameters);

  // Keep ref updated
  useEffect(() => {
    parametersRef.current = parameters;
  }, [parameters]);

  const getLatestParameters = () => parametersRef.current;

  return {
    ...rest,
    parameters,
    getLatestParameters
  };
};

