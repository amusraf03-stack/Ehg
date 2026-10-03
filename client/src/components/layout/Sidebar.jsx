import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  FolderOpen,
  ReceiptText,
  ChartNoAxesCombined,
  Clock3,
  CalendarDays,
  Users,
  Bell,
  Settings,
  LogOut,
  BriefcaseBusiness,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

const menuByRole = {
  ADMIN: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Tender Management', icon: BriefcaseBusiness, path: '/admin/tenders' },
         { label: 'Employees', icon: Users, path: '/admin/users' },
     {label: 'Companies',icon: BriefcaseBusiness, path: '/admin/companies',},
    // { label: 'Compliance', icon: ClipboardCheck, path: '/admin/compliance' },
    // { label: 'Document Library', icon: FolderOpen, path: '/admin/documents' },
    // { label: 'Invoices', icon: ReceiptText, path: '/admin/invoices' },
    // { label: 'Reports & Analytics', icon: ChartNoAxesCombined, path: '/admin/reports' },
    // { label: 'Attendance', icon: Clock3, path: '/admin/attendance' },
    // { label: 'Leave Management', icon: CalendarDays, path: '/admin/leave' },
    
    // { label: 'Notifications', icon: Bell, path: '/admin/notifications' },
    // { label: 'Settings', icon: Settings, path: '/admin/settings' },
    
  ],

  CEO: [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/ceo/dashboard' },
  { label: 'Tenders', icon: BriefcaseBusiness, path: '/ceo/tenders' },
  { label: 'Companies', icon: BriefcaseBusiness, path: '/ceo/companies' },
  { label: 'Users', icon: Users, path: '/ceo/users' },
  // { label: 'Invoices', icon: ReceiptText, path: '/ceo/invoices' },
  // { label: 'Reports & Analytics', icon: ChartNoAxesCombined, path: '/ceo/reports' },
  // { label: 'Attendance', icon: Clock3, path: '/ceo/attendance' },
  // { label: 'Notifications', icon: Bell, path: '/ceo/notifications' },
  // { label: 'Settings', icon: Settings, path: '/ceo/settings' },
],

  MANAGER: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
    { label: 'Tenders', icon: BriefcaseBusiness, path: '/manager/tenders' },
    // { label: 'Team / Assigned Tenders', icon: FileText, path: '/manager/team-tenders' },
    // { label: 'Compliance Review', icon: ClipboardCheck, path: '/manager/compliance' },
    // { label: 'Document Library', icon: FolderOpen, path: '/manager/documents' },
    // { label: 'Invoices', icon: ReceiptText, path: '/manager/invoices' },
    // { label: 'Reports & Analytics', icon: ChartNoAxesCombined, path: '/manager/reports' },
    // { label: 'Attendance', icon: Clock3, path: '/manager/attendance' },
    // { label: 'Leave', icon: CalendarDays, path: '/manager/leave' },
    // { label: 'Notifications', icon: Bell, path: '/manager/notifications' },
    // { label: 'Settings', icon: Settings, path: '/manager/settings' },
  ],

  EMPLOYEE: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/employee/dashboard' },
    { label: ' Tenders', icon: BriefcaseBusiness, path: '/employee/tenders' },
    // { label: 'My Documents', icon: FolderOpen, path: '/employee/documents' },
    // { label: 'Compliance Checklist', icon: ClipboardCheck, path: '/employee/compliance' },
    // { label: 'Comments / Activity', icon: FileText, path: '/employee/activity' },
    // { label: 'Attendance', icon: Clock3, path: '/employee/attendance' },
    // { label: 'Leave', icon: CalendarDays, path: '/employee/leave' },
    // { label: 'Notifications', icon: Bell, path: '/employee/notifications' },
    // { label: 'Settings', icon: Settings, path: '/employee/settings' },
  ],
}

const ROLE_BADGE_STYLES = {
  ADMIN: 'bg-[#6B3A98]/20 text-[#C9A9E8] ring-1 ring-[#6B3A98]/40',
  CEO: 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30',
  MANAGER: 'bg-[#2F8CC9]/20 text-[#9CCEEE] ring-1 ring-[#2F8CC9]/40',
  EMPLOYEE: 'bg-white/10 text-slate-300 ring-1 ring-white/10',
}

const getInitial = (name) => {
  if (!name) return '?'
  return name.trim().charAt(0).toUpperCase()
}

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const menuItems = menuByRole[user?.role] || []
  const badgeStyle = ROLE_BADGE_STYLES[user?.role] || ROLE_BADGE_STYLES.EMPLOYEE

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    // h-full + w-full: the sidebar fills whatever container renders it
    // (a fixed desktop rail today, a slide-in drawer later). Width is
    // owned by that container, not hard-coded here, per the brief.
    <aside
      aria-label="Sidebar navigation"
      className="relative flex h-full max-h-dvh w-full flex-col overflow-hidden bg-[#0F172A] text-slate-200 lg:border-r lg:border-white/10"
    >
      {/* subtle branded lighting — quiet, not decorative overload */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#6B3A98] opacity-[0.12] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#2F8CC9] opacity-[0.10] blur-3xl"
      />

      {/* Brand / header */}
      <div className="relative shrink-0 border-b border-white/10 px-5 py-5">
        <img
          src="/images/logo.jpeg"
          alt="EHG Holdings"
          className="h-11 w-auto object-contain"
        />

        <p className="mt-3 truncate text-[13px] font-medium tracking-tight text-slate-300">
          Tender &amp; Business Management
        </p>
      </div>

      {/* User area */}
      <div className="relative shrink-0 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/10"
          >
            {getInitial(user?.name)}
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white" title={user?.name}>
              {user?.name}
            </p>

            {user?.role && (
              <span
                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badgeStyle}`}
              >
                {user.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main"
        className="scrollbar-hide relative min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
                className={({ isActive }) =>
                  `group relative flex min-h-[44px] items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#6B3A98]/15 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* active indicator bar */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-colors ${
                        isActive ? 'bg-[#2F8CC9]' : 'bg-transparent'
                      }`}
                    />

                    <Icon
                      size={18}
                      className={
                        isActive
                          ? 'shrink-0 text-[#9CCEEE]'
                          : 'shrink-0 text-slate-400 group-hover:text-slate-200'
                      }
                    />

                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Logout — visually separated from nav */}
      <div className="relative shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} className="shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar