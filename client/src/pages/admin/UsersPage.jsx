import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  UserPlus,
  Users,
  Mail,
  Building2,
  ShieldCheck,
  CircleUserRound,
  X,
  Eye,
  EyeOff,
   Settings2,
   Pencil,
} from 'lucide-react'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'


const roleStyles = {
  ADMIN: 'bg-purple-50 text-[#6B3A98] ring-1 ring-purple-200',
  CEO: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  MANAGER: 'bg-sky-50 text-[#2F8CC9] ring-1 ring-sky-200',
  EMPLOYEE: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
}

const statusStyles = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  INACTIVE: 'bg-red-50 text-red-700 ring-1 ring-red-200',
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'EMPLOYEE',
  department: '',
  status: 'ACTIVE',
}

const UsersPage = () => {
  const { user: currentUser } = useAuth()

  const canManageUsers = currentUser?.role === 'ADMIN'
  const isReadOnly = currentUser?.role === 'CEO'


  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showAddUser, setShowAddUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState(initialForm)


  const [showViewUser, setShowViewUser] = useState(false)
const [viewUser, setViewUser] = useState(null)

const [showEditUser, setShowEditUser] = useState(false)
const [editUser, setEditUser] = useState(null)
const [updatingUser, setUpdatingUser] = useState(false)
const [editUserError, setEditUserError] = useState('')

const [editUserForm, setEditUserForm] = useState({
  name: '',
  email: '',
  phone: '',
  department: '',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
})


const [showDeactivateUser, setShowDeactivateUser] = useState(false)
const [deactivateUser, setDeactivateUser] = useState(null)
const [deactivatingUser, setDeactivatingUser] = useState(false)
const [deactivateUserError, setDeactivateUserError] = useState('')

  const [showCompanyModal, setShowCompanyModal] = useState(false)
const [selectedUser, setSelectedUser] = useState(null)
const [userCompanies, setUserCompanies] = useState([])
const [companyLoading, setCompanyLoading] = useState(false)
const [companyError, setCompanyError] = useState('')


const [availableCompanies, setAvailableCompanies] = useState([])
const [selectedCompanyId, setSelectedCompanyId] = useState('')
const [isPrimaryCompany, setIsPrimaryCompany] = useState(false)
const [assigningCompany, setAssigningCompany] = useState(false)

const [updatingMembership, setUpdatingMembership] = useState(null)






  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/users')

      setUsers(response.data.users || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load users.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const employeeCount = useMemo(
    () =>
      users.filter(
        (user) => user.role === 'EMPLOYEE'
      ).length,
    [users]
  )

  const managerCount = useMemo(
    () =>
      users.filter(
        (user) => user.role === 'MANAGER'
      ).length,
    [users]
  )

  const activeCount = useMemo(
    () =>
      users.filter(
        (user) => user.status === 'ACTIVE'
      ).length,
    [users]
  )

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return users
    }

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.department
          ?.toLowerCase()
          .includes(query) ||
        user.role?.toLowerCase().includes(query) ||
        user.status?.toLowerCase().includes(query)
      )
    })
  }, [users, search])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setForm(initialForm)
    setShowPassword(false)
    setError('')
  }

  const closeModal = () => {
    setShowAddUser(false)
    resetForm()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!form.name.trim()) {
      setError('Full name is required.')
      return
    }

    if (!form.email.trim()) {
      setError('Email is required.')
      return
    }

    if (form.password.length < 8) {
      setError(
        'Password must contain at least 8 characters.'
      )
      return
    }

    try {
      setSubmitting(true)

      const response = await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        department: form.department.trim(),
        status: form.status,
      })

      setUsers((current) => [
        ...current,
        response.data.user,
      ])

      setSuccess(
        `${response.data.user.name} was added successfully.`
      )

      setShowAddUser(false)
      resetForm()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to create user.'
      )
    } finally {
      setSubmitting(false)
    }
  }


  const openCompanyModal = async (user) => {
  try {
    setSelectedUser(user)
    setShowCompanyModal(true)
    setCompanyLoading(true)
    setCompanyError('')
    setUserCompanies([])
    setSelectedCompanyId('')
    setIsPrimaryCompany(false)

    const [membershipResponse, companiesResponse] =
      await Promise.all([
        api.get(`/users/${user.id}/companies`),
        api.get('/companies'),
      ])

    setUserCompanies(
      membershipResponse.data.companies ||
        membershipResponse.data.data ||
        []
    )

    setAvailableCompanies(
      companiesResponse.data.companies ||
        companiesResponse.data.data ||
        []
    )
  } catch (err) {
    setCompanyError(
      err.response?.data?.message ||
        'Unable to load company memberships.'
    )
  } finally {
    setCompanyLoading(false)
  }
}

const handleAssignCompany = async () => {
  if (!selectedUser || !selectedCompanyId) {
    setCompanyError('Please select a company.')
    return
  }

  try {
    setAssigningCompany(true)
    setCompanyError('')

    await api.post(
      `/users/${selectedUser.id}/companies`,
      {
        companyId: Number(selectedCompanyId),
        isPrimary: isPrimaryCompany,
      }
    )

    const response = await api.get(
      `/users/${selectedUser.id}/companies`
    )

    setUserCompanies(
      response.data.companies ||
        response.data.data ||
        []
    )

    setSelectedCompanyId('')
    setIsPrimaryCompany(false)
  } catch (err) {
    setCompanyError(
      err.response?.data?.message ||
        'Unable to assign company.'
    )
  } finally {
    setAssigningCompany(false)
  }
}



const handleSetPrimaryCompany = async (membership) => {
  if (!selectedUser) return

  try {
    setUpdatingMembership(membership.company_id)
    setCompanyError('')

    const response = await api.put(
      `/users/${selectedUser.id}/companies/${membership.company_id}`,
      {
        isPrimary: true,
      }
    )

    setUserCompanies(
      response.data.companies ||
        response.data.data ||
        []
    )
  } catch (err) {
    setCompanyError(
      err.response?.data?.message ||
        'Unable to update primary company.'
    )
  } finally {
    setUpdatingMembership(null)
  }
}

const handleDeactivateCompany = async (membership) => {
  if (!selectedUser) return

  const confirmed = window.confirm(
    `Deactivate ${membership.company_name} for ${selectedUser.name}? The membership history will be preserved.`
  )

  if (!confirmed) return

  try {
    setUpdatingMembership(membership.company_id)
    setCompanyError('')

    const response = await api.delete(
      `/users/${selectedUser.id}/companies/${membership.company_id}`,
      {
        data: {},
      }
    )

    setUserCompanies(
      response.data.companies ||
        response.data.data ||
        []
    )
  } catch (err) {
    setCompanyError(
      err.response?.data?.message ||
        'Unable to deactivate company membership.'
    )
  } finally {
    setUpdatingMembership(null)
  }
}


const handleActivateCompany = async (membership) => {
  if (!selectedUser) return

  try {
    setUpdatingMembership(membership.company_id)
    setCompanyError('')

    const response = await api.patch(
      `/users/${selectedUser.id}/companies/${membership.company_id}/activate`
    )

    setUserCompanies(
      response.data.companies ||
        response.data.data ||
        []
    )
  } catch (err) {
    setCompanyError(
      err.response?.data?.message ||
        'Unable to activate company membership.'
    )
  } finally {
    setUpdatingMembership(null)
  }
}



const handleUpdateUser = async () => {
  if (!editUser) return

  const name = editUserForm.name.trim()
  const email = editUserForm.email.trim()

  if (!name) {
    setEditUserError('Full name is required.')
    return
  }

  if (!email) {
    setEditUserError('Email is required.')
    return
  }

  try {
    setUpdatingUser(true)
    setEditUserError('')

    const response = await api.put(`/users/${editUser.id}`, {
      name,
      email,
      phone: editUserForm.phone.trim() || null,
      department: editUserForm.department.trim() || null,
      role: editUserForm.role,
      status: editUserForm.status,
    })

    const updatedUser = response.data.user

    if (updatedUser) {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      )
    }

    setShowEditUser(false)
    setEditUser(null)
    setEditUserError('')

    setSuccess('User updated successfully.')
  } catch (error) {
    setEditUserError(
      error.response?.data?.message ||
        'Unable to update user.'
    )
  } finally {
    setUpdatingUser(false)
  }
}


const handleToggleUserStatus = async () => {
  if (!deactivateUser) return

  const newStatus =
    deactivateUser.status === 'ACTIVE'
      ? 'INACTIVE'
      : 'ACTIVE'

  try {
    setDeactivatingUser(true)
    setDeactivateUserError('')

    const response = await api.put(
      `/users/${deactivateUser.id}`,
      {
        status: newStatus,
      }
    )

    const updatedUser = response.data.user

    if (updatedUser) {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id
            ? updatedUser
            : user
        )
      )
    }

    setShowDeactivateUser(false)
    setDeactivateUser(null)
    setDeactivateUserError('')

    setSuccess(
      newStatus === 'ACTIVE'
        ? 'User activated successfully.'
        : 'User deactivated successfully.'
    )
  } catch (error) {
    setDeactivateUserError(
      error.response?.data?.message ||
        `Unable to ${
          newStatus === 'ACTIVE'
            ? 'activate'
            : 'deactivate'
        } user.`
    )
  } finally {
    setDeactivatingUser(false)
  }
}

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Users
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage EHG Holdings employees and system
            accounts.
          </p>
        </div>

    {canManageUsers && (
        <button
          type="button"
          onClick={() => {
            setError('')
            setSuccess('')
            setShowAddUser(true)
          }}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5A3182] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B3A98]/40 sm:w-auto"
        >
          <UserPlus size={18} />
          Add User
        </button>
      )}
      </div>

      {/* Success message */}
      {success && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Users
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {users.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
              <Users size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Employees
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {employeeCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-[#2F8CC9]">
              <CircleUserRound size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Managers
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {managerCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Accounts
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {activeCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* Users panel */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-4 py-5 sm:px-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              System Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {employeeCount} employees and{' '}
              {managerCount} managers currently registered.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search users..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            Loading users...
          </div>
        ) : error && !showAddUser ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchUsers}
              className="mt-4 text-sm font-semibold text-[#6B3A98] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No users found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Try a different search term.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      User
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Department
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Role
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                            {user.name
                              ?.trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {user.name}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail size={13} />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Building2
                            size={15}
                            className="text-slate-400"
                          />

                          {user.department || '—'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            roleStyles[user.role] ||
                            roleStyles.EMPLOYEE
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[user.status] ||
                            statusStyles.INACTIVE
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">

                          <button
                            type="button"
                            onClick={() => {
                              setViewUser(user)
                              setShowViewUser(true)
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-[#6B3A98]"
                          >
                            <Eye size={15} />
                            {/* View */}
                          </button>
                        {canManageUsers && (
                          <>
                          <button
                          type="button"
                          onClick={() => {
                            setEditUser(user)

                            setEditUserForm({
                              name: user.name || '',
                              email: user.email || '',
                              phone: user.phone || '',
                              department: user.department || '',
                              role: user.role || 'EMPLOYEE',
                              status: user.status || 'ACTIVE',
                            })

                            setEditUserError('')
                            setShowEditUser(true)
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-[#6B3A98]"
                        >
                          <Pencil size={15} />
                          {/* Edit */}
                        </button>

                       <button
                        type="button"
                        onClick={() => {
                          setDeactivateUser(user)
                          setDeactivateUserError('')
                          setShowDeactivateUser(true)
                        }}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          user.status === 'ACTIVE'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                          {['CEO', 'MANAGER'].includes(user.role) && (
                          <button
                            type="button"
                            onClick={() => openCompanyModal(user)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-[#6B3A98]"
                          >
                            <Settings2 size={15} />
                            Manage Companies
                          </button>
                        )}
                       </>
                        )}


                         
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                      {user.name
                        ?.trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-slate-900">
                        {user.name}
                      </p>

                      <p className="mt-1 break-all text-xs text-slate-500">
                        {user.email}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            roleStyles[user.role] ||
                            roleStyles.EMPLOYEE
                          }`}
                        >
                          {user.role}
                        </span>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusStyles[user.status] ||
                            statusStyles.INACTIVE
                          }`}
                        >
                          {user.status}
                        </span>
                      </div>

                      {user.department && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                          <Building2 size={13} />
                          {user.department}
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setViewUser(user)
                          setShowViewUser(true)
                        }}
                        className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye size={15} />
                        View
                      </button>
                     {canManageUsers && (
                        <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditUser(user)

                          setEditUserForm({
                            name: user.name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            department: user.department || '',
                            role: user.role || 'EMPLOYEE',
                            status: user.status || 'ACTIVE',
                          })

                          setEditUserError('')
                          setShowEditUser(true)
                        }}
                        className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                     {['CEO', 'MANAGER'].includes(user.role) && (
                      <button
                        type="button"
                        onClick={() => openCompanyModal(user)}
                        className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-[#6B3A98]"
                      >
                        <Settings2 size={15} />
                        Companies
                      </button>
                    )}

                      <button
                        type="button"
                        onClick={() => {
                          setDeactivateUser(user)
                          setDeactivateUserError('')
                          setShowDeactivateUser(true)
                        }}
                        className={`inline-flex min-h-[40px] items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          user.status === 'ACTIVE'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                      </>
              )}
                    </div>
                    
                    </div>
                  </div>
                </div>


              ))}
              
            </div>
          </>
        )}
      </div>

{/* View User Modal */}
{showViewUser && viewUser && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
    <button
      type="button"
      aria-label="Close view user dialog"
      onClick={() => {
        setShowViewUser(false)
        setViewUser(null)
      }}
      className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
    />

    <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B3A98]">
            User Profile
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {viewUser.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View system account information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowViewUser(false)
            setViewUser(null)
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-50 text-lg font-bold text-[#6B3A98]">
            {viewUser.name?.trim().charAt(0).toUpperCase()}
          </div>

          <div>
            <p className="font-semibold text-slate-950">
              {viewUser.name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {viewUser.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Role
            </p>

            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                roleStyles[viewUser.role] ||
                roleStyles.EMPLOYEE
              }`}
            >
              {viewUser.role}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </p>

            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyles[viewUser.status] ||
                statusStyles.INACTIVE
              }`}
            >
              {viewUser.status}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Phone
            </p>

            <p className="mt-2 text-sm font-medium text-slate-700">
              {viewUser.phone || '—'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Department
            </p>

            <p className="mt-2 text-sm font-medium text-slate-700">
              {viewUser.department || '—'}
            </p>
          </div>
        </div>
      </div>

      
    </div>
  </div>
)}


{/* Edit User Modal */}
{showEditUser && editUser && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
    <button
      type="button"
      aria-label="Close edit user dialog"
      onClick={() => {
        setShowEditUser(false)
        setEditUser(null)
        setEditUserError('')
      }}
      className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
    />

    <div className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B3A98]">
            User Management
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Edit User
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update account information and role.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowEditUser(false)
            setEditUser(null)
            setEditUserError('')
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        {editUserError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {editUserError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name *
            </label>

            <input
              type="text"
              value={editUserForm.name}
              onChange={(event) =>
                setEditUserForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email *
            </label>

            <input
              type="email"
              value={editUserForm.email}
              onChange={(event) =>
                setEditUserForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Phone
            </label>

            <input
              type="text"
              value={editUserForm.phone}
              onChange={(event) =>
                setEditUserForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Department
            </label>

            <input
              type="text"
              value={editUserForm.department}
              onChange={(event) =>
                setEditUserForm((current) => ({
                  ...current,
                  department: event.target.value,
                }))
              }
              placeholder="e.g. Tender Operations"
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Role *
            </label>

            <select
              value={editUserForm.role}
              onChange={(event) =>
                setEditUserForm((current) => ({
                  ...current,
                  role: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="CEO">CEO</option>
            </select>
          </div>

          {/* <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Status *
            </label>

            <select
              value={editUserForm.status}
              onChange={(event) =>
                setEditUserForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div> */}
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Company assignments are managed separately using Manage Companies.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={updatingUser}
          onClick={() => {
            setShowEditUser(false)
            setEditUser(null)
            setEditUserError('')
          }}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>

       <button
        type="button"
        onClick={handleUpdateUser}
        disabled={updatingUser}
        className="rounded-xl bg-[#6B3A98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A3182] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {updatingUser ? 'Saving...' : 'Save Changes'}
      </button>
      </div>
    </div>
  </div>
)}


{/* Deactivate User Modal */}
{showDeactivateUser && deactivateUser && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
    <button
      type="button"
      aria-label="Close deactivate user dialog"
      onClick={() => {
        setShowDeactivateUser(false)
        setDeactivateUser(null)
        setDeactivateUserError('')
      }}
      className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
    />

    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="border-b border-slate-200 px-6 py-5">
       <h2 className="text-xl font-bold text-slate-950">
        {deactivateUser.status === 'ACTIVE'
          ? 'Deactivate User?'
          : 'Activate User?'}
      </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Are you sure you want to{' '}
          {deactivateUser.status === 'ACTIVE'
            ? 'deactivate'
            : 'activate'}{' '}
          <span className="font-semibold text-slate-800">
            {deactivateUser.name}
          </span>
          ?
        </p>
      </div>

      <div className="p-6">
        {deactivateUserError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {deactivateUserError}
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
              {deactivateUser.status === 'ACTIVE'
                ? 'What happens after deactivation?'
                : 'What happens after activation?'}
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              {deactivateUser.status === 'ACTIVE'
                ? 'This user will no longer be able to sign in. Their historical tender assignments, company memberships, and activity records will be preserved.'
                : 'This user will be able to sign in again. Their existing company memberships, tender history, and activity records will remain available.'}
            </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={deactivatingUser}
          onClick={() => {
            setShowDeactivateUser(false)
            setDeactivateUser(null)
            setDeactivateUserError('')
          }}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>

       <button
        type="button"
        onClick={handleToggleUserStatus}
        disabled={deactivatingUser}
          
        className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          deactivateUser.status === 'ACTIVE'
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {deactivatingUser
          ? deactivateUser.status === 'ACTIVE'
            ? 'Deactivating...'
            : 'Activating...'
          : deactivateUser.status === 'ACTIVE'
            ? 'Deactivate'
            : 'Activate'}
      </button>
      </div>
    </div>
  </div>
)}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close add user dialog"
            onClick={closeModal}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
          />

          <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Add User
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new EHG Holdings system
                  account.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6"
            >
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Tonderai Makanjera"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="employee@ehgholdings.com"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role *
                  </label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
                  >
                   <option value="EMPLOYEE">
                      Employee
                    </option>
                    <option value="MANAGER">
                      Manager
                    </option>
                    <option value="CEO">
                      CEO
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status *
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>
                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Tender Operations"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Temporary Password *
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 pr-12 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    The user can use this password to sign
                    in after the account is created.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="min-h-[44px] rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] rounded-xl bg-[#6B3A98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A3182] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? 'Creating...'
                    : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


{/* Company Membership Modal */}
{showCompanyModal && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
    {/* Backdrop */}
    <button
      type="button"
      aria-label="Close company membership dialog"
      onClick={() => setShowCompanyModal(false)}
      className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
    />

    {/* Modal */}
    <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

      {/* Header */}
      <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B3A98]">
            Company Membership
          </p>

          <h2 className="mt-1.5 truncate text-xl font-bold text-slate-950 sm:text-2xl">
            {selectedUser?.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View and manage this user's company assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCompanyModal(false)}
          className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">

        {/* Assign Company */}
        {!companyLoading && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#6B3A98]">
                <Building2 size={21} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Company
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add this user to another company under EHG Holdings.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                value={selectedCompanyId}
                onChange={(event) => {
                  setSelectedCompanyId(event.target.value)
                  setCompanyError('')
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
              >
                <option value="">Select company</option>

                {availableCompanies
                  .filter(
                    (company) =>
                      company.status === 'ACTIVE' &&
                      !userCompanies.some(
                        (membership) =>
                          Number(membership.company_id) ===
                          Number(company.id)
                      )
                  )
                  .map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleAssignCompany}
                disabled={
                  assigningCompany ||
                  !selectedCompanyId
                }
                className="h-12 rounded-xl bg-[#6B3A98] px-7 text-sm font-bold text-white shadow-sm transition hover:bg-[#5A3182] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assigningCompany
                  ? 'Assigning...'
                  : 'Assign'}
              </button>
            </div>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isPrimaryCompany}
                onChange={(event) =>
                  setIsPrimaryCompany(
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300 accent-[#6B3A98]"
              />

              <span className="text-sm font-medium text-slate-600">
                Set as primary company
              </span>
            </label>
          </div>
        )}

        {/* Loading */}
        {companyLoading ? (
          <div className="py-14 text-center">
            <p className="text-sm font-medium text-slate-500">
              Loading company memberships...
            </p>
          </div>
        ) : (
          <>
            {/* Error */}
            {companyError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {companyError}
              </div>
            )}

            {/* Assigned Companies heading */}
            <div className="mt-7 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Building2 size={19} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Assigned Companies
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Current and previous company memberships.
                </p>
              </div>
            </div>

            {/* No companies */}
            {userCompanies.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                <Building2
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 font-semibold text-slate-700">
                  No company assigned
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  This user does not currently have a company membership.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {userCompanies.map((membership, index) => {
                  const isActive =
                    membership.status === 'ACTIVE'

                  const isPrimary =
                    Boolean(membership.is_primary)

                  return (
                    <div
                      key={`${membership.company_id}-${index}`}
                      className={`relative overflow-hidden rounded-2xl border p-4 transition sm:p-5 ${
                        isActive && isPrimary
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : isActive
                            ? 'border-slate-200 bg-white'
                            : 'border-slate-200 bg-slate-50/80'
                      }`}
                    >
                      {/* Small left accent */}
                      <div
                        className={`absolute bottom-0 left-0 top-0 w-1 ${
                          isActive && isPrimary
                            ? 'bg-[#6B3A98]'
                            : isActive
                              ? 'bg-emerald-400'
                              : 'bg-slate-300'
                        }`}
                      />

                      <div className="flex flex-col gap-4 pl-2 lg:flex-row lg:items-center lg:justify-between">

                        {/* Company */}
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              isActive
                                ? 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200'
                                : 'bg-slate-200/70 text-slate-500'
                            }`}
                          >
                            <Building2 size={20} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">
                              {membership.company_name ||
                                membership.company?.name ||
                                'Company'}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {isPrimary
                                ? 'Primary company membership'
                                : isActive
                                  ? 'Active company membership'
                                  : 'Previous company membership'}
                            </p>
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {isPrimary && (
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 text-xs font-bold text-[#6B3A98] ring-1 ring-purple-200">
                                PRIMARY
                              </span>
                            )}

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                  : 'bg-slate-200/70 text-slate-600 ring-slate-300'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isActive
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-500'
                                }`}
                              />

                              {membership.status}
                            </span>
                          </div>

                          {/* Active actions */}
                          {isActive && (
                            <div className="flex flex-wrap gap-2">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetPrimaryCompany(
                                      membership
                                    )
                                  }
                                  disabled={
                                    updatingMembership ===
                                    membership.company_id
                                  }
                                  className="min-h-[38px] rounded-lg border border-purple-200 bg-white px-3.5 py-2 text-xs font-bold text-[#6B3A98] transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updatingMembership ===
                                  membership.company_id
                                    ? 'Updating...'
                                    : 'Set Primary'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeactivateCompany(
                                    membership
                                  )
                                }
                                disabled={
                                  updatingMembership ===
                                  membership.company_id
                                }
                                className="min-h-[38px] rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Deactivate
                              </button>
                            </div>
                          )}

                          {/* Inactive action */}
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() =>
                                handleActivateCompany(
                                  membership
                                )
                              }
                              disabled={
                                updatingMembership ===
                                membership.company_id
                              }
                              className="min-h-[38px] rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingMembership ===
                              membership.company_id
                                ? 'Activating...'
                                : 'Activate'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-7">
        <button
          type="button"
          onClick={() => setShowCompanyModal(false)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

   </div>
  )
}

export default UsersPage