import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import FarmerLayout from '@/layouts/FarmerLayout';
import Welcome from '@/pages/farmer/Welcome';
import Onboarding from '@/pages/farmer/Onboarding';
import FarmIntelligence from '@/pages/farmer/FarmIntelligence';
import { LoadingState } from '@/components/ui';
import { FarmerEntry, GuestOnly, ProtectedRoute } from '@/auth/ProtectedRoute';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import FarmerHome from '@/pages/farmer/FarmerHome';

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
          <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="signup" element={<GuestOnly><Signup /></GuestOnly>} />
          <Route path="register" element={<Navigate to="/signup" replace />} />
          {/* Farmer area: needs a logged-in farmer. Unfinished onboarding is held at /farmer/onboarding. */}
          <Route path="farmer" element={<FarmerEntry />} />
          <Route path="farmer/onboarding" element={<ProtectedRoute gate="incomplete"><Onboarding /></ProtectedRoute>} />
          <Route path="farmer/dashboard" element={<ProtectedRoute><FarmerHome /></ProtectedRoute>} />
          <Route path="farmer/intelligence" element={<ProtectedRoute><FarmIntelligence /></ProtectedRoute>} />
          <Route path="farmer/actions" element={<ProtectedRoute><FarmIntelligence section="actions" /></ProtectedRoute>} />
          <Route path="farmer/ask" element={<ProtectedRoute><FarmIntelligence section="ask" /></ProtectedRoute>} />
          <Route path="farmer/requests" element={<ProtectedRoute><FarmIntelligence section="requests" /></ProtectedRoute>} />
          {/* Prototype Demo Access (sample farmer, no sign-in) keeps its original route. */}
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
