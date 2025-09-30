// src/hooks/useUser.js
"use client";

import { useGetUserQuery } from "@/services/authApi";

export function useUser() {
  const { data, error, isLoading, isFetching, isError, refetch } =
    useGetUserQuery();

  return {
    user: data ?? null,
    error,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}
