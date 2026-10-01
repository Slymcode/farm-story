import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, downloadCsv } from './client';
import type { Agronomist, AgronomistDashboard, AgronomistRequest, AiAnswer, DashboardSummary, InsightHistory, Passport, Farm, Farmer, FarmerDetail, FarmerRow, LocationSummary, Paged, RequestStatus, ServiceRequest, ServiceType } from '@/types';

const qs = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => v !== undefined && v !== '' && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const useFarm = (id?: string) => useQuery({ queryKey: ['farm', id], queryFn: () => api<Farm>(`/farms/${id}`), enabled: !!id });
export const useFarmer = (id?: string) => useQuery({ queryKey: ['farmer', id], queryFn: () => api<FarmerDetail>(`/farmers/${id}`), enabled: !!id });
export const useFarmerRequests = (farmerId?: string) =>
  useQuery({ queryKey: ['requests', 'farmer', farmerId], queryFn: () => api<Paged<ServiceRequest>>(`/service-requests${qs({ farmerId })}`), enabled: !!farmerId });

export const useCreateFarmer = () => useMutation({ mutationFn: (json: object) => api<Farmer>('/farmers', { method: 'POST', json }) });
export const useCreateFarm = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (json: object) => api<Farm>('/farms', { method: 'POST', json }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['farmers'] }); } });
};

export const useCreateRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (json: { farmerId: string; farmId: string; type: ServiceType; description?: string }) => api<ServiceRequest>('/service-requests', { method: 'POST', json }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['requests'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['farmers'] }); qc.invalidateQueries({ queryKey: ['farmer'] }); },
  });
};
/** Anything that changes a request (status, assignment, assessment, completion) refreshes every view of it. */
const invalidateWorkflow = (qc: ReturnType<typeof useQueryClient>) => {
  for (const k of ['requests', 'request', 'dashboard', 'farmer', 'agronomists', 'agronomist']) qc.invalidateQueries({ queryKey: [k] });
};
export const useUpdateRequestStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: RequestStatus }) => api<ServiceRequest>(`/service-requests/${v.id}/status`, { method: 'PATCH', json: { status: v.status } }),
    onSuccess: () => invalidateWorkflow(qc),
  });
};
export const useAskFarmStory = () => useMutation({ mutationFn: (json: { farmId: string; question: string }) => api<AiAnswer>('/ai/farm-question', { method: 'POST', json }) });

// ---- Admin ----
export const useSummary = () => useQuery({ queryKey: ['dashboard', 'summary'], queryFn: () => api<DashboardSummary>('/dashboard/summary') });
export const useLocations = () => useQuery({ queryKey: ['dashboard', 'locations'], queryFn: () => api<LocationSummary>('/dashboard/locations') });
export const useFarmers = (f: { search?: string; county?: string; crop?: string; page?: number }) =>
  useQuery({ queryKey: ['farmers', f], queryFn: () => api<Paged<FarmerRow>>(`/farmers${qs({ ...f, pageSize: 15 })}`), placeholderData: keepPreviousData });
export const useRequestDetail = (id?: string) => useQuery({ queryKey: ['request', id], queryFn: () => api<ServiceRequest>(`/service-requests/${id}`), enabled: !!id });
export const useRequests = (status?: string) =>
  useQuery({ queryKey: ['requests', 'admin', status], queryFn: () => api<Paged<ServiceRequest>>(`/service-requests${qs({ status })}`), placeholderData: keepPreviousData });
export const useOutstanding = () => useQuery({ queryKey: ['dashboard', 'outstanding'], queryFn: () => api<Paged<ServiceRequest>>('/dashboard/service-requests') });

/** Builds the export path from the same filters the admin table is currently showing. */
export const exportPath = (resource: 'farmers' | 'service-requests', f: Record<string, string | number | undefined>) => `/${resource}/export${qs(f)}`;
export const exportCsv = (resource: 'farmers' | 'service-requests', f: Record<string, string | number | undefined>) =>
  downloadCsv(exportPath(resource, f), `farm-story-${resource}-${new Date().toISOString().slice(0, 10)}.csv`);

// ---- Agronomists ----
export const useAgronomists = () => useQuery({ queryKey: ['agronomists'], queryFn: () => api<Agronomist[]>('/agronomists') });
export const useCreateAgronomist = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (json: object) => api<Agronomist>('/agronomists', { method: 'POST', json }), onSuccess: () => invalidateWorkflow(qc) });
};
export const useUpdateAgronomist = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; json: object }) => api<Agronomist>(`/agronomists/${v.id}`, { method: 'PATCH', json: v.json }), onSuccess: () => invalidateWorkflow(qc) });
};
export const useAssignAgronomist = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { requestId: string; agronomistId: string }) => api<ServiceRequest>(`/service-requests/${v.requestId}/assign`, { method: 'POST', json: { agronomistId: v.agronomistId } }), onSuccess: () => invalidateWorkflow(qc) });
};
export const useAgronomistDashboard = (id?: string) => useQuery({ queryKey: ['agronomist', id, 'dashboard'], queryFn: () => api<AgronomistDashboard>(`/agronomists/${id}/dashboard`), enabled: !!id });
export const useAgronomistRequests = (id?: string, status?: string) =>
  useQuery({ queryKey: ['agronomist', id, 'requests', status], queryFn: () => api<ServiceRequest[]>(`/agronomists/${id}/requests${qs({ status })}`), enabled: !!id });
export const useAgronomistRequest = (id?: string, requestId?: string) =>
  useQuery({ queryKey: ['agronomist', id, 'request', requestId], queryFn: () => api<AgronomistRequest>(`/agronomists/${id}/requests/${requestId}`), enabled: !!id && !!requestId });
export const useSubmitAssessment = (agronomistId: string, requestId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (json: object) => api<ServiceRequest>(`/agronomists/${agronomistId}/requests/${requestId}/assessment`, { method: 'POST', json }), onSuccess: () => invalidateWorkflow(qc) });
};
export const useCompleteRequest = (agronomistId: string, requestId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api<ServiceRequest>(`/agronomists/${agronomistId}/requests/${requestId}/complete`, { method: 'POST' }), onSuccess: () => invalidateWorkflow(qc) });
};

// ---- Intelligence history & Farm Passport ----
export const useInsightHistory = (farmId?: string) => useQuery({ queryKey: ['insight-history', farmId], queryFn: () => api<InsightHistory>(`/farms/${farmId}/insight/history`), enabled: !!farmId });
export const usePassport = (publicId?: string) => useQuery({ queryKey: ['passport', publicId], queryFn: () => api<Passport>(`/passport/${publicId}`), enabled: !!publicId, retry: false });
export const useResetPassport = (farmId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api<{ publicId: string }>(`/farms/${farmId}/passport/reset`, { method: 'POST' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['farm'] }) });
};
