import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { AiAnswer, DashboardSummary, Farm, Farmer, FarmerDetail, FarmerRow, LocationSummary, Paged, RequestStatus, ServiceRequest, ServiceType } from '@/types';

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
export const useUpdateRequestStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: RequestStatus }) => api<ServiceRequest>(`/service-requests/${v.id}/status`, { method: 'PATCH', json: { status: v.status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['requests'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['farmer'] }); },
  });
};
export const useAskFarmStory = () => useMutation({ mutationFn: (json: { farmId: string; question: string }) => api<AiAnswer>('/ai/farm-question', { method: 'POST', json }) });

// ---- Admin ----
export const useSummary = () => useQuery({ queryKey: ['dashboard', 'summary'], queryFn: () => api<DashboardSummary>('/dashboard/summary') });
export const useLocations = () => useQuery({ queryKey: ['dashboard', 'locations'], queryFn: () => api<LocationSummary>('/dashboard/locations') });
export const useFarmers = (f: { search?: string; county?: string; crop?: string; page?: number }) =>
  useQuery({ queryKey: ['farmers', f], queryFn: () => api<Paged<FarmerRow>>(`/farmers${qs({ ...f, pageSize: 15 })}`), placeholderData: keepPreviousData });
export const useRequests = (status?: string) =>
  useQuery({ queryKey: ['requests', 'admin', status], queryFn: () => api<Paged<ServiceRequest>>(`/service-requests${qs({ status })}`), placeholderData: keepPreviousData });
export const useOutstanding = () => useQuery({ queryKey: ['dashboard', 'outstanding'], queryFn: () => api<Paged<ServiceRequest>>('/dashboard/service-requests') });
