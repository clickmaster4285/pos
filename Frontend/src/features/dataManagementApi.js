// src/features/dataManagementApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const getToken = (getState) =>
  getState()?.auth?.token ||
  (typeof window !== "undefined" && sessionStorage.getItem("authToken")) ||
  (typeof document !== "undefined" &&
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("authToken="))
      ?.split("=")[1]) ||
  null;

export const dataManagementApi = createApi({
  reducerPath: "dataManagementApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/dataManagementRoutes/superadmin`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["DataManagement"],
  endpoints: (builder) => ({  
    // Export all data with uploads
    exportData: builder.mutation({
      query: () => ({
        url: "/export-all-data",
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw error;
          }
          
          // Get filename from Content-Disposition header or generate one
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `backup-${new Date().toISOString().split('T')[0]}.zip`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) filename = filenameMatch[1];
          }
          
          // Convert to blob for download (plain JS)
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          return { success: true, message: 'Export completed successfully' };
        },
        cache: "no-cache",
      }),
      invalidatesTags: ["DataManagement"],
    }),

    // Import data from zip file
    importData: builder.mutation({
      query: (formData) => ({
        url: "/import-data",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["DataManagement"],
    }),

    // Get backup info (size, last backup date, etc.)
    getBackupInfo: builder.query({
      query: () => "/backup-info",
      providesTags: ["DataManagement"],
    }),
  }),
});

export const {
  useExportDataMutation,
  useImportDataMutation,
  useGetBackupInfoQuery,
} = dataManagementApi;