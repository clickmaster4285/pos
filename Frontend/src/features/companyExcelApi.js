// src/features/companyExcelApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3455"
).replace(/\/$/, "");

export const companyExcelApi = createApi({
  reducerPath: "companyExcelApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/excel`,
    credentials: "include",

    prepareHeaders: (headers, { getState }) => {
      const token =
        getState()?.auth?.token ||
        (typeof window !== "undefined" &&
          sessionStorage.getItem("authToken")) ||
        null;

      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ["CompanyExcel"],

  endpoints: (builder) => ({
    /**
     * EXPORT COMPANY EXCEL FILE
     * GET /api/companies/:companyId/excel
     */
    exportCompanyExcel: builder.mutation({
      query: (companyId) => ({
        url: `export-company-data?companyId=${companyId}`,
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;

          const filename =
            response.headers
              .get("content-disposition")
              ?.match(/filename="(.+)"/)?.[1] ||
            `company-${companyId}.xlsx`;

          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        },
      }),

      invalidatesTags: [{ type: "CompanyExcel", id: "LIST" }],
    }),
  }),
});

export const { useExportCompanyExcelMutation } = companyExcelApi;
