import { api } from "./client";
import type { PendingTask, ReportSummary } from "../types";

export interface ReportSummaryParams {
  from?: string;
  to?: string;
  userId?: string;
  projectId?: string;
  clientId?: string;
}

export interface PendingParams {
  projectId?: string;
  clientId?: string;
  assigneeId?: string;
}

function toQuery(params: ReportSummaryParams | PendingParams) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export const reportsApi = {
  summary: (params: ReportSummaryParams = {}) =>
    api.get<ReportSummary>(`/reports/summary${toQuery(params)}`),
  pending: (params: PendingParams = {}) =>
    api.get<PendingTask[]>(`/reports/pending${toQuery(params)}`),
};
