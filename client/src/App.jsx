import { ThemeProvider } from '@material-tailwind/react';
import { onMessage } from 'firebase/messaging';
import { useEffect, useRef, useState } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { MainLayout } from './components';
import PreLoader from './components/Preloader';
import { initFCM } from './config/firebase';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { useOnlineStatus } from './hooks';
import { AcademicYear, Account, Activities, AdminDocuments, AdminTemplates, AnnouncementsPage, Dashboard, DetailsParent, DocumentAction, DocumentDetails, Documents, Forms, FormsBuilder, FormViewerPage, MainActivities, MainAdmin, MainDocuments, MainRSO, RSOAction, RSODetails, RSOParent, Users, WaterMarkPage } from './pages/admin';
import EmailAction from './pages/EmailAction';
import ErrorPage from './pages/ErrorPage';
import Login from './pages/Login';
import MainLogin from './pages/MainLogin';
import PasswordAction from './pages/PasswordAction';
import { Document, MainDocument } from './pages/rso';
import { useSelectedFormStore } from './store';
import { safeInitMaterialTailwind } from './utils';
import ProtectedRoutes from './utils/ProtectedRoute';

// refactor the app content

function AppContent() {
  const location = useLocation();
  const clearSelectedForm = useSelectedFormStore((state) => state.clearSelectedForm);

  // Clear selected form when navigating away from the form selection page
  useEffect(() => {
    const allowedRoutes = ['/document-action', '/forms'];
    if (!allowedRoutes.includes(location.pathname)) {
      clearSelectedForm();
    }
  }, [location, clearSelectedForm]);

}

function App() {
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();
  const hasMTInitedRef = useRef(false);

  useEffect(() => {
    if (!isOnline || hasMTInitedRef.current) return;
    (async () => {
      try {
        await safeInitMaterialTailwind();
        hasMTInitedRef.current = true;
      } catch (e) {
        console.warn("Material Tailwind init failed (will retry when online):", e);
        hasMTInitedRef.current = false;
      }
    })();
  }, [isOnline]);

  // useEffect(() => {
  //   generateToken();
  //   onMessage(messaging, (payload) => {
  //     console.log('Message received. ', payload);

  //     toast.info(payload.notification.body);
  //   });
  // }, [generateToken]);

  useEffect(() => {
    (async () => {
      const { messaging, token } = await initFCM();

      if (token) {
        // send to backend
      }

      if (messaging) {
        onMessage(messaging, (payload) => {
          console.log('Message received. ', payload);
          toast.info(payload.notification?.body || "New Notification");
        });

      } else {
        console.warn("FCM not supported in this browser.");
        toast.warn("Notifications are not supported on this browser.");
      }
    })();
  }, []);

  // Initialize Material Tailwind safely
  useEffect(() => {
    safeInitMaterialTailwind();
  }, []);

  useEffect(() => {
    // Simulate loading time (same as GSAP animation delay in Preloader.js)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (process.env.NODE_ENV === "production")
    console.log = function no_console() { };

  return (
    <AuthProvider>
      <SidebarProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />

            {loading ? (
              <PreLoader />
            ) : (
              <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
                <Routes>
                  {!isOnline && <Route path="*" element={<ErrorPage />} />}
                  <Route path="/" element={<Login />}>
                    <Route index element={<MainLogin />} />
                    <Route path="password-action" element={<PasswordAction />} />
                    <Route path="email-action" element={<EmailAction />} />
                    {/* <Route path="register" element={<MainRegister />} /> */}
                  </Route>

                  {/* Protected routes for authenticated users */}
                  <Route element={<ProtectedRoutes />}>
                    {/* RSO routes */}
                    <Route
                      path="/documents"
                      element={
                        <MainLayout
                          tabName="Documents"
                          headingTitle="View and Upload Documents"
                        >
                          <Document />
                        </MainLayout>
                      }
                    >
                      <Route index element={<MainDocument />} />
                      <Route path=":documentId" element={<DocumentDetails />} />
                    </Route>

                    {/* SDAO admin routes */}
                    <Route path="/error" element={<ErrorPage />} />

                    <Route
                      path="/dashboard"
                      element={
                        <MainLayout
                          tabName="Dashboard"
                          headingTitle="See previous updates"
                        >
                          <Dashboard />
                        </MainLayout>
                      }
                    />

                    <Route
                      path="/users"
                      element={
                        <MainLayout
                          tabName="Users"
                          headingTitle="Monitor RSO Representative and Student accounts"
                        >
                          <Users />
                        </MainLayout>
                      }
                    />

                    <Route
                      path="/activities"
                      element={
                        <MainLayout
                          tabName="Activities"
                          headingTitle="Manage Activities"
                        >
                          <Documents />
                        </MainLayout>
                      }
                    >
                      <Route index element={<MainDocuments />} />
                      <Route path="activity-action" element={<DocumentAction />} />
                      <Route path="form-selection" element={<Forms />} />
                      <Route path=":activityId" element={<MainActivities />}>
                        <Route index element={<Activities />} />
                        <Route path=":documentId" element={<DocumentDetails />} />
                      </Route>
                    </Route>

                    <Route
                      path="/account"
                      element={
                        <MainLayout
                          tabName="Admin Account"
                          headingTitle="Admin Full Name"
                        >
                          <Account />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/announcements"
                      element={
                        <MainLayout
                          tabName="Announcements"
                          headingTitle="View and Manage Announcements"
                        >
                          <AnnouncementsPage />
                        </MainLayout>
                      }
                    />

                    <Route path="/admin-documents" element={
                      <MainLayout
                        tabName="Admin Documents"
                      >
                        <AdminDocuments />
                      </MainLayout>
                    }>
                      <Route index element={<MainAdmin />} />

                      {/* document details route */}
                      <Route path=":documentId" element={<DetailsParent />} >
                        <Route index element={<DocumentDetails />} />
                        <Route path="watermark" element={<WaterMarkPage />} />
                      </Route>
                      <Route path="templates" element={<AdminTemplates />} />
                    </Route>

                    <Route path="/academic-year" element={
                      <MainLayout
                        tabName="Academic Year"
                        headingTitle="Manage Academic Years"
                      >
                        <AcademicYear />
                      </MainLayout>
                    } />

                    <Route path="/forms" element={
                      <MainLayout
                        tabName="Forms"
                        headingTitle="Manage Forms"
                      >
                        <Forms />
                      </MainLayout>
                    } />

                    <Route path="/forms-builder" element={<FormsBuilder />} />
                    <Route path="/form-viewer" element={<FormViewerPage />} />

                    {/* RSO Management routes */}
                    <Route
                      path="/rsos"
                      element={
                        <MainLayout
                          tabName="RSOs"
                          headingTitle="Manage RSO Account"
                        >
                          <RSOParent />
                        </MainLayout>
                      }
                    >
                      <Route index element={<MainRSO />} />
                      <Route path="rso-action" element={<RSOAction />} />
                      <Route path="rso-details" element={<RSODetails />} />
                    </Route>
                  </Route>
                </Routes>
              </SkeletonTheme>
            )}
          </BrowserRouter>
        </ThemeProvider>
      </SidebarProvider>
    </AuthProvider>

  );

}

export default App;
