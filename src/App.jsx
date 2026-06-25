import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

// Layout & Route Guards
import ShellScaffold from './components/ShellScaffold';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import FCMManager from './components/FCMManager';

// Authentication Screens
import PhoneAuth from './pages/auth/PhoneAuth';
import OtpAuth from './pages/auth/OtpAuth';

// Primary Screens (Shell)
import Home from './pages/home/Home';
import Discovery from './pages/discovery/Discovery';
import Bookings from './pages/booking/Bookings';
import Profile from './pages/profile/Profile';

// Sub / Details Screens
import CreateBooking from './pages/booking/CreateBooking';
import BookingDetails from './pages/booking/BookingDetails';
import Chat from './pages/chat/Chat';
import Notifications from './pages/notifications/Notifications';
import LiveTracking from './pages/tracking/LiveTracking';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* FCMManager registers the FCM device token after login — renders nothing */}
        <FCMManager />
        <BrowserRouter>
          <Routes>
            {/* ─── Public Authentication Routes ───────────────────────── */}
            <Route
              path="/auth/phone"
              element={
                <PublicRoute>
                  <PhoneAuth />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/otp"
              element={
                <PublicRoute>
                  <OtpAuth />
                </PublicRoute>
              }
            />

            {/* ─── Protected Bottom Navigation Shell Routes ─────────────── */}
            <Route element={<ShellScaffold />}>
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discovery"
                element={
                  <ProtectedRoute>
                    <Discovery />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* ─── Protected Modal/Sub-Pages ──────────────────────────── */}
            <Route
              path="/bookings/:id"
              element={
                <ProtectedRoute>
                  <BookingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/track"
              element={
                <ProtectedRoute>
                  <LiveTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-booking"
              element={
                <ProtectedRoute>
                  <CreateBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:bookingId"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* ─── Default Redirect ───────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
