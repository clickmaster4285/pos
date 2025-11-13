// src/features/dataManagementApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

// Enhanced token retrieval
const getToken = (getState) => {
  try {
    return (
      getState()?.auth?.token ||
      (typeof window !== "undefined" && sessionStorage.getItem("authToken")) ||
      (typeof document !== "undefined" &&
        document.cookie
          .split("; ")
          .find((r) => r.startsWith("authToken="))
          ?.split("=")[1]) ||
      null
    );
  } catch (error) {
    console.warn("Token retrieval error:", error);
    return null;
  }
};

export const dataManagementApi = createApi({
  reducerPath: "dataManagementApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/dataManagementRoutes`,
    credentials: "include",
    prepareHeaders: (headers, { getState, endpoint }) => {
      const token = getToken(getState);
      
      // For import-data endpoint, let the browser set Content-Type with boundary
      if (endpoint !== 'importData') {
        headers.set('Content-Type', 'application/json');
      }
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["BackupInfo"],
  endpoints: (builder) => ({  
    // Export all data with uploads
    exportData: builder.mutation({
      query: () => ({
        url: "/export-all-data",
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            // Try to parse error response
            try {
              const errorText = await response.text();
              const errorData = JSON.parse(errorText);
              throw errorData;
            } catch (parseError) {
              throw {
                message: `Export failed with status: ${response.status}`,
                status: response.status
              };
            }
          }
          
          // Get filename from Content-Disposition header or generate one
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `automotive-backup-${new Date().toISOString().split('T')[0]}.zip`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) filename = filenameMatch[1];
          }
          
          // Convert to blob for download
          const blob = await response.blob();
          
          // Check if blob is empty or invalid
          if (blob.size === 0) {
            throw { message: "Export failed: Empty file received" };
          }
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          return { 
            success: true, 
            message: 'Export completed successfully',
            filename,
            size: blob.size
          };
        },
        cache: "no-cache",
      }),
      invalidatesTags: ["BackupInfo"],
    }),

    // Import data from zip file
    importData: builder.mutation({
      query: (formData) => ({
        url: "/import-data",
        method: "POST",
        body: formData,
        // Let browser set the Content-Type with boundary for FormData
        headers: {
          // Authorization will be added by prepareHeaders
        },
      }),
      invalidatesTags: ["BackupInfo"],
    }),

    // Get backup info (size, last backup date, etc.)
    getBackupInfo: builder.query({
      query: () => "/backup-info",
      providesTags: ["BackupInfo"],
    }),

    // Cleanup temporary files
    cleanupTempFiles: builder.mutation({
      query: () => ({
        url: "/cleanup-temp",
        method: "DELETE",
      }),
      invalidatesTags: ["BackupInfo"],
    }),
  }),
});

export const {
  useExportDataMutation,
  useImportDataMutation,
  useGetBackupInfoQuery,
  useCleanupTempFilesMutation,
} = dataManagementApi;