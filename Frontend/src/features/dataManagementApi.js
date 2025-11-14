// src/features/dataManagementApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

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

      // For import endpoints, let the browser set Content-Type with boundary
      if (!endpoint?.toLowerCase()?.includes("import")) {
        headers.set("Content-Type", "application/json");
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["BackupInfo"],
  endpoints: (builder) => ({
    /** 🌍 Export All Company Data */
    exportData: builder.mutation({
      query: () => ({
        url: "/export-all-data",
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            try {
              const text = await response.text();
              const data = JSON.parse(text);
              throw data;
            } catch {
              throw {
                message: `Export failed with status: ${response.status}`,
              };
            }
          }

          const contentDisposition = response.headers.get(
            "Content-Disposition"
          );
          let filename = `automotive-backup-${new Date()
            .toISOString()
            .split("T")[0]}.zip`;

          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match) filename = match[1];
          }

          const blob = await response.blob();
          if (blob.size === 0) {
            throw { message: "Export failed: Empty file received" };
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);

          return {
            success: true,
            filename,
            size: blob.size,
          };
        },
      }),
      invalidatesTags: ["BackupInfo"],
    }),

    /** 📦 Import All Data */
    importData: builder.mutation({
      query: (formData) => ({
        url: "/import-data",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["BackupInfo"],
    }),

    /** 🏢 Export Specific Company Data */
    exportCompanyData: builder.mutation({
      query: (companyId) => ({
        url: `/export-company-data?companyId=${companyId}`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to export data (${response.status})`);
          }

          const contentDisposition = response.headers.get(
            "Content-Disposition"
          );
          let filename = `company-backup-${companyId}.zip`;

          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match) filename = match[1];
          }

          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error("Empty file received");
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          return { success: true, filename };
        },
      }),
    }),

    /** 🏢 Import Specific Company Data */
    importCompanyData: builder.mutation({
      query: ({ companyId, formData }) => ({
        url: `/import-company-data/${companyId}`,
        method: "POST",
        body: formData,
      }),
    }),

    /** ℹ️ Get Backup Info */
    getBackupInfo: builder.query({
      query: () => "/backup-info",
      providesTags: ["BackupInfo"],
    }),

    /** 🧹 Cleanup Temporary Files */
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
  useExportCompanyDataMutation,
  useImportCompanyDataMutation,
} = dataManagementApi;
