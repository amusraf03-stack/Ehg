import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import AdminDashboard from './pages/admin/AdminDashboard'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import AssignedTenders from './pages/employee/AssignedTenders'
import TenderManagement from './pages/tenders/TenderManagement'
import CreateTender from './pages/tenders/CreateTender'
import EditTender from './pages/tenders/EditTender'
import TenderWorkspace from './pages/tenders/TenderWorkspace'

import CEODashboard from './pages/ceo/CEODashboard'
import CompaniesPage from './pages/companies/CompaniesPage'

import UsersPage from './pages/admin/UsersPage'
import LoginPage from './pages/auth/LoginPage'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

const DashboardPlaceholder = ({ title }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
        {title}
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        Welcome to the EHG Holdings management system.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Dashboard content will be added in the next phase.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppLayout />
              
            </ProtectedRoute>
          }
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
          <Route
          path="/admin/tenders"
          element={<TenderManagement />}
        />
       <Route
        path="/admin/tenders/create"
        element={<CreateTender />}
      />
      <Route
        path="/admin/tenders/:id/edit"
        element={<EditTender />}
      />

      <Route
        path="/admin/tenders/:id/workspace"
        element={<TenderWorkspace />}
      />
      <Route path="/admin/users" element={<UsersPage />} />

      <Route
        path="/admin/companies"
        element={<CompaniesPage />}
      />

          <Route
            path="/admin/*"
            element={<DashboardPlaceholder title="Admin Module" />}
          />
        </Route>


        {/* CEO */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['CEO']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
  <Route
    path="/ceo/dashboard"
    element={<CEODashboard />}
  />
  <Route
  path="/ceo/users"
  element={<UsersPage />}
/>

  <Route
    path="/ceo/tenders"
    element={<TenderManagement />}
  />
  <Route
    path="/ceo/tenders/:id/workspace"
    element={<TenderWorkspace />}
  />
    <Route
    path="/ceo/companies"
    element={<CompaniesPage />}
  />

  <Route
    path="/ceo/*"
    element={<DashboardPlaceholder title="CEO Module" />}
  />
</Route>

        {/* MANAGER */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/manager/dashboard"
            element={<ManagerDashboard />}
          />
          <Route
          path="/manager/tenders"
          element={<TenderManagement />}
        />

        <Route
          path="/manager/tenders/create"
          element={<CreateTender />}
        />
          <Route
            path="/manager/tenders/:id/edit"
            element={<EditTender />}
          />
          <Route
            path="/manager/tenders/:id/workspace"
            element={<TenderWorkspace />}
          />
          <Route
            path="/manager/*"
            element={<DashboardPlaceholder title="Manager Module" />}
          />
        </Route>

        {/* EMPLOYEE */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
          path="/employee/dashboard"
          element={<EmployeeDashboard />}
        />

        <Route
  path="/employee/tenders"
  element={<TenderManagement />}
/>



        <Route
          path="/employee/tenders/:id/workspace"
          element={<TenderWorkspace />}
        />
          <Route
            path="/employee/*"
            element={<DashboardPlaceholder title="Employee Module" />}
          />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App