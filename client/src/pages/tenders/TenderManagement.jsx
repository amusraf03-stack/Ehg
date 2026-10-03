import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Plus,
  Search,
  RefreshCcw,
  CalendarDays,
  Building2,
  UserPlus,
  Users,
  X,
  CheckCircle2,
   Pencil,
   FolderOpen,
   Trash2
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const statusStyles = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PREPARATION: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  SUBMITTED: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const priorityStyles = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

const TenderManagement = () => {
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Assignment state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTender, setSelectedTender] = useState(null)

  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] =
    useState(false)

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState('')

  const [assigning, setAssigning] = useState(false)
  const [assignmentError, setAssignmentError] =
    useState('')
  const [successMessage, setSuccessMessage] =
    useState('')

  const navigate = useNavigate()
  const { user } = useAuth()

  const createTenderPath =
    user?.role === 'ADMIN'
      ? '/admin/tenders/create'
      : '/manager/tenders/create'

  const getEditTenderPath = (tenderId) =>
    user?.role === 'ADMIN'
      ? `/admin/tenders/${tenderId}/edit`
      : `/manager/tenders/${tenderId}/edit`

    const fetchTenders = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/tenders')

      setTenders(response.data.data || [])
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Unable to load tenders.'
      )
    } finally {
      setLoading(false)
    }
  }

const getWorkspacePath = (tenderId) => {
  if (user?.role === 'ADMIN') {
    return `/admin/tenders/${tenderId}/workspace`
  }

  if (user?.role === 'CEO') {
    return `/ceo/tenders/${tenderId}/workspace`
  }

  if (user?.role === 'EMPLOYEE') {
    return `/employee/tenders/${tenderId}/workspace`
  }

  return `/manager/tenders/${tenderId}/workspace`
}

  useEffect(() => {
    fetchTenders()
  }, [])

  const filteredTenders = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    if (!searchValue) {
      return tenders
    }

    return tenders.filter((tender) => {
      return (
        tender.title
          ?.toLowerCase()
          .includes(searchValue) ||
        tender.reference_no
          ?.toLowerCase()
          .includes(searchValue) ||
        tender.client_name
          ?.toLowerCase()
          .includes(searchValue) ||
        tender.assignments?.some((assignment) =>
          assignment.employee_name
            ?.toLowerCase()
            .includes(searchValue)
        )
      )
    })
  }, [tenders, search])

  const formatDate = (date) => {
    if (!date) return '—'

    return new Date(date).toLocaleDateString()
  }

  const getAssignedEmployees = (tender) => {
    return tender.assignments || []
  }

  const closeAssignModal = () => {
    if (assigning) return

    setShowAssignModal(false)
    setSelectedTender(null)
    setSelectedEmployeeId('')
    setAssignmentError('')
  }

  const openAssignModal = async (tender) => {
  setSelectedTender(tender)
  setSelectedEmployeeId('')
  setAssignmentError('')
  setSuccessMessage('')
  setShowAssignModal(true)

  try {
    setEmployeesLoading(true)
    setEmployees([])

    const response = await api.get(
      '/tenders/assignable-employees'
    )

    setEmployees(
      response.data.employees || []
    )
  } catch (error) {
    setEmployees([])

    setAssignmentError(
      error.response?.data?.message ||
        'Unable to load employees.'
    )
  } finally {
    setEmployeesLoading(false)
  }
}
  const handleAssignEmployee = async (event) => {
    event.preventDefault()

    if (!selectedTender) {
      return
    }

    if (!selectedEmployeeId) {
      setAssignmentError(
        'Please select an employee.'
      )
      return
    }

    try {
      setAssigning(true)
      setAssignmentError('')

      const selectedEmployee = employees.find(
        (employee) =>
          String(employee.id) ===
          String(selectedEmployeeId)
      )

      await api.post(
        `/tenders/${selectedTender.id}/assign`,
        {
          userId: Number(selectedEmployeeId),
        }
      )

      setSuccessMessage(
        `${selectedEmployee?.name || 'Employee'} was assigned to ${selectedTender.reference_no} successfully.`
      )

      setShowAssignModal(false)
      setSelectedTender(null)
      setSelectedEmployeeId('')

      // Refresh tenders so assigned names appear immediately.
      await fetchTenders()
    } catch (error) {
      setAssignmentError(
        error.response?.data?.message ||
          'Unable to assign employee.'
      )
    } finally {
      setAssigning(false)
    }
  }



  const handleDeleteTender = async (tender) => {
  const confirmed = window.confirm(
    `Delete tender "${tender.reference_no} - ${tender.title}"?\n\nThis tender will be removed from active tender management.`
  )

  if (!confirmed) {
    return
  }

  try {
    setError('')
    setSuccessMessage('')

    await api.delete(`/tenders/${tender.id}`)

    setSuccessMessage(
      `${tender.reference_no} was deleted successfully.`
    )

    await fetchTenders()
  } catch (error) {
    setError(
      error.response?.data?.message ||
        'Unable to delete tender.'
    )
  }
}

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Tender Operations
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
            Tender Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create, track, assign and manage company
            tenders.
          </p>
        </div>

        {user?.role == 'ADMIN' && (
        <button
          type="button"
          onClick={() =>
            navigate(createTenderPath)
          }
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5A3182] sm:w-auto"
        >
          <Plus size={18} />
          Create Tender
        </button>
      )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{successMessage}</span>
        </div>
      )}

      {/* Tender panel */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
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
              placeholder="Search tenders or employees..."
              className="h-11 w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
            />
          </div>

          <button
            type="button"
            onClick={fetchTenders}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              size={17}
              className={
                loading ? 'animate-spin' : ''
              }
            />

            Refresh
          </button>
        </div>

        {loading && (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading tenders...
          </div>
        )}

        {!loading && error && (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchTenders}
              className="mt-3 text-sm font-semibold text-[#6B3A98] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          filteredTenders.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                No tenders found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try another search or create a new
                tender.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredTenders.length > 0 && (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4">
                        Tender
                      </th>

                      <th className="px-5 py-4">
                        Client
                      </th>

                      {/* <th className="px-5 py-4">
                        Assigned To
                      </th> */}

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Priority
                      </th>

                      {/* <th className="px-5 py-4">
                        Progress
                      </th> */}

                      <th className="px-5 py-4">
                        Deadline
                      </th>

                      <th className="px-5 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredTenders.map(
                      (tender) => (
                        <tr
                          key={tender.id}
                          className="transition hover:bg-slate-50"
                        >
                          {/* Tender */}
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {tender.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {tender.reference_no}
                            </p>
                          </td>

                          {/* Client */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Building2
                                size={16}
                                className="shrink-0 text-slate-400"
                              />

                              <span>
                                {tender.client_name ||
                                  '—'}
                              </span>
                            </div>
                          </td>

                          {/* Assigned To */}
                          {/* <td className="px-5 py-4">
                            {getAssignedEmployees(
                              tender
                            ).length === 0 ? (
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Users
                                  size={15}
                                  className="shrink-0"
                                />

                                Unassigned
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                {getAssignedEmployees(
                                  tender
                                )
                                  .slice(0, 2)
                                  .map(
                                    (
                                      assignment
                                    ) => (
                                      <div
                                        key={
                                          assignment.id
                                        }
                                        className="flex items-center gap-2"
                                      >
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[11px] font-bold text-[#6B3A98] ring-1 ring-purple-100">
                                          {assignment.employee_name
                                            ?.charAt(
                                              0
                                            )
                                            .toUpperCase()}
                                        </div>

                                        <div className="min-w-0">
                                          <p className="max-w-[180px] truncate text-sm font-medium text-slate-700">
                                            {
                                              assignment.employee_name
                                            }
                                          </p>

                                          {assignment.department && (
                                            <p className="max-w-[180px] truncate text-[11px] text-slate-400">
                                              {
                                                assignment.department
                                              }
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  )}

                                {getAssignedEmployees(
                                  tender
                                ).length > 2 && (
                                  <span className="pl-9 text-xs font-semibold text-[#6B3A98]">
                                    +
                                    {getAssignedEmployees(
                                      tender
                                    ).length -
                                      2}{' '}
                                    more
                                  </span>
                                )}
                              </div>
                            )}
                          </td> */}

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                statusStyles[
                                  tender.status
                                ] ||
                                'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {tender.status?.replaceAll(
                                '_',
                                ' '
                              )}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                priorityStyles[
                                  tender.priority
                                ] ||
                                'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {tender.priority}
                            </span>
                          </td>

                          {/* Progress */}
                          {/* <td className="px-5 py-4">
                            <div className="w-32">
                              <div className="mb-1 flex justify-between text-xs text-slate-500">
                                <span>
                                  Progress
                                </span>

                                <span>
                                  {tender.progress}%
                                </span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#6B3A98]"
                                  style={{
                                    width: `${Math.min(
                                      tender.progress ||
                                        0,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td> */}

                          {/* Deadline */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <CalendarDays
                                size={16}
                                className="shrink-0 text-slate-400"
                              />

                              {formatDate(
                                tender.deadline
                              )}
                            </div>
                          </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  getWorkspacePath(tender.id)
                                )
                              }
                              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#6B3A98] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5A3182]"
                            >
                              <FolderOpen size={15} />
                              Workspace
                            </button>

                            {user?.role == 'ADMIN' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      getEditTenderPath(tender.id)
                                    )
                                  }
                                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#6B3A98]/30 hover:bg-purple-50 hover:text-[#6B3A98]"
                                >
                                  <Pencil size={15} />
                                  {/* Edit */}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteTender(tender)
                                  }
                                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                >
                                  <Trash2 size={15} />
                                  {/* Delete */}
                                </button>

                                {/* <button
                                  type="button"
                                  onClick={() =>
                                    openAssignModal(tender)
                                  }
                                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-[#6B3A98] transition hover:bg-purple-100"
                                >
                                  <UserPlus size={15} />
                                  Assign
                                </button> */}
                              </>
                            )}
                          </div>
                        </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredTenders.map(
                  (tender) => (
                    <div
                      key={tender.id}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {tender.title}
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {tender.reference_no}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            priorityStyles[
                              tender.priority
                            ] ||
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tender.priority}
                        </span>
                      </div>

                      {/* Client */}
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                        <Building2
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        <span className="truncate">
                          {tender.client_name ||
                            'No client specified'}
                        </span>
                      </div>

                      {/* Assigned employees */}
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Assigned To
                        </p>

                        {getAssignedEmployees(
                          tender
                        ).length === 0 ? (
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                            <Users size={15} />
                            No employees assigned
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getAssignedEmployees(
                              tender
                            )
                              .slice(0, 3)
                              .map(
                                (
                                  assignment
                                ) => (
                                  <span
                                    key={
                                      assignment.id
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-[#6B3A98]"
                                  >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold ring-1 ring-purple-100">
                                      {assignment.employee_name
                                        ?.charAt(
                                          0
                                        )
                                        .toUpperCase()}
                                    </span>

                                    {
                                      assignment.employee_name
                                    }
                                  </span>
                                )
                              )}

                            {getAssignedEmployees(
                              tender
                            ).length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                +
                                {getAssignedEmployees(
                                  tender
                                ).length -
                                  3}{' '}
                                more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Deadline */}
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        <span>
                          Deadline:{' '}
                          {formatDate(
                            tender.deadline
                          )}
                        </span>
                      </div>

                      {/* Status / progress */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusStyles[
                              tender.status
                            ] ||
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tender.status?.replaceAll(
                            '_',
                            ' '
                          )}
                        </span>

                        <span className="text-xs font-semibold text-slate-500">
                          {tender.progress}% complete
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#6B3A98]"
                          style={{
                            width: `${Math.min(
                              tender.progress || 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      {/* Assign button */}
                    <div className="mt-5 space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            getWorkspacePath(tender.id)
                          )
                        }
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A3182]"
                      >
                        <FolderOpen size={17} />
                        Open Workspace
                      </button>

                      {user?.role !== 'CEO' && (
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                getEditTenderPath(tender.id)
                              )
                            }
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Pencil size={17} />
                            {/* Edit */}
                          </button>

                          <button
                          type="button"
                          onClick={() =>
                            handleDeleteTender(tender)
                          }
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                          {/* Delete */}
                        </button>

                          {/* <button
                            type="button"
                            onClick={() =>
                              openAssignModal(tender)
                            }
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-[#6B3A98] transition hover:bg-purple-100"
                          >
                            <UserPlus size={17} />
                            Assign
                          </button> */}
                        </div>
                      )}
                    </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
      </div>

      {/* Assignment modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            onClick={closeAssignModal}
            aria-label="Close assignment dialog"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
          />

          <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="pr-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B3A98]">
                  Tender Assignment
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Assign Employee
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select an employee to work on this
                  tender.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAssignModal}
                disabled={assigning}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tender summary */}
            <div className="mx-5 mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:mx-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected Tender
              </p>

              <p className="mt-2 font-semibold text-slate-950">
                {selectedTender?.title}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {selectedTender?.reference_no}
              </p>

              {selectedTender?.deadline && (
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <CalendarDays size={14} />

                  Deadline:{' '}
                  {formatDate(
                    selectedTender.deadline
                  )}
                </div>
              )}

              {selectedTender &&
                getAssignedEmployees(
                  selectedTender
                ).length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Currently Assigned
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {getAssignedEmployees(
                        selectedTender
                      ).map((assignment) => (
                        <span
                          key={assignment.id}
                          className="inline-flex items-center rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-[#6B3A98]"
                        >
                          {
                            assignment.employee_name
                          }
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <form
              onSubmit={handleAssignEmployee}
              className="p-5 sm:p-6"
            >
              {assignmentError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {assignmentError}
                </div>
              )}

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Employee
              </label>

              {employeesLoading ? (
                <div className="flex min-h-[110px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-center">
                    <RefreshCcw
                      size={20}
                      className="mx-auto animate-spin text-[#6B3A98]"
                    />

                    <p className="mt-2 text-sm text-slate-500">
                      Loading employees...
                    </p>
                  </div>
                </div>
              
              ) : employees.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <Users
                    size={24}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    No active employees available
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Add an employee from User
                    Management first.
                  </p>
                </div>
              ) : (
                <>
                  <select
                    value={selectedEmployeeId}
                    onChange={(event) => {
                      setSelectedEmployeeId(
                        event.target.value
                      )
                      setAssignmentError('')
                    }}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/10"
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.name}
                          {employee.department
                            ? ` — ${employee.department}`
                            : ''}
                        </option>
                      )
                    )}
                  </select>

                  {selectedEmployeeId && (
                    <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                      {(() => {
                        const employee =
                          employees.find(
                            (item) =>
                              String(
                                item.id
                              ) ===
                              String(
                                selectedEmployeeId
                              )
                          )

                        if (!employee) {
                          return null
                        }

                        return (
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6B3A98] text-sm font-bold text-white">
                              {employee.name
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {employee.name}
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {employee.email}
                              </p>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  disabled={assigning}
                  className="min-h-[44px] rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

               {employees.length > 0 && (
                    <button
                      type="submit"
                      disabled={
                        assigning ||
                        !selectedEmployeeId
                      }
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A3182] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserPlus size={17} />

                      {assigning
                        ? 'Assigning...'
                        : 'Assign Employee'}
                    </button>
                  )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TenderManagement