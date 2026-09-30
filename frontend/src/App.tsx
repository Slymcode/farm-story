import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import FarmerLayout from '@/layouts/FarmerLayout';
import Welcome from '@/pages/farmer/Welcome';
import Onboarding from '@/pages/farmer/Onboarding';
import FarmIntelligence from '@/pages/farmer/FarmIntelligence';
import { LoadingState } from '@/components/ui';

// Admin screens are lazy-loaded so farmers on slow connections never download them.
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Farmers = lazy(() => import('@/pages/admin/Farmers'));
const FarmerProfile = lazy(() => import('@/pages/admin/FarmerProfile'));
const Requests = lazy(() => import('@/pages/admin/Requests'));

export default function App() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><LoadingState /></div>}>
      <Routes>
        <Route element={<FarmerLayout />}>
          <Route index element={<Welcome />} />
          <Route path="register" element={<Onboarding />} />
          <Route path="farm/:farmId" element={<FarmIntelligence />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="farmers" element={<Farmers />} />
          <Route path="farmers/:id" element={<FarmerProfile />} />
          <Route path="requests" element={<Requests />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
