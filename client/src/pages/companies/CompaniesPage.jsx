import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  CircleSlash2,
  Search,
  Users,
Pencil,
Plus
} from 'lucide-react'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const CompaniesPage = () => {
    const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [creating, setCreating] = useState(false)
const [createError, setCreateError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)



  const [showEditModal, setShowEditModal] = useState(false)
const [selectedCompany, setSelectedCompany] = useState(null)

const [updating, setUpdating] = useState(false)
const [editError, setEditError] = useState('')

const [editCompanyForm, setEditCompanyForm] = useState({
  name: '',
  description: '',
  status: 'ACTIVE',
})




const [companyForm, setCompanyForm] = useState({
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE',
})

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await api.get('/companies')

        setCompanies(
          response.data.companies ||
            response.data.data ||
            []
        )
      } catch (error) {
        setError(
          error.response?.data?.message ||
            'Unable to load companies.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  const filteredCompanies = useMemo(() => {
    const value = searchTerm.trim().toLowerCase()

    if (!value) {
      return companies
    }

    return companies.filter((company) => {
      return (
        company.name?.toLowerCase().includes(value) ||
        company.code?.toLowerCase().includes(value) ||
        company.status?.toLowerCase().includes(value)
      )
    })
  }, [companies, searchTerm])

  const totalCompanies = companies.length

  const activeCompanies = companies.filter(
    (company) => company.status === 'ACTIVE'
  ).length

  const inactiveCompanies = companies.filter(
    (company) => company.status === 'INACTIVE'
  ).length

  const summaryCards = [
    {
      label: 'Total Companies',
      value: totalCompanies,
      icon: Building2,
      iconStyle: 'bg-purple-50 text-[#6B3A98]',
    },
    {
      label: 'Active Companies',
      value: activeCompanies,
      icon: CheckCircle2,
      iconStyle: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Inactive Companies',
      value: inactiveCompanies,
      icon: CircleSlash2,
      iconStyle: 'bg-slate-100 text-slate-500',
    },
    {
      label: 'Organization',
      value: 'EHG',
      icon: Users,
      iconStyle: 'bg-sky-50 text-[#2F8CC9]',
    },
  ]


  const handleCreateCompany = async () => {
  const name = companyForm.name.trim()
  const code = companyForm.code.trim()
  const description = companyForm.description.trim()

  if (!name) {
    setCreateError('Company name is required.')
    return
  }

  try {
    setCreating(true)
    setCreateError('')

    const response = await api.post('/companies', {
      name,
      code: code || null,
      description: description || null,
      status: companyForm.status,
    })

    const newCompany =
      response.data.company ||
      response.data.data

    if (newCompany) {
      setCompanies((previous) => [
        newCompany,
        ...previous,
      ])
    }

    setCompanyForm({
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE',
    })

    setShowCreateModal(false)
  } catch (error) {
    setCreateError(
      error.response?.data?.message ||
        'Unable to create company.'
    )
  } finally {
    setCreating(false)
  }
}



const handleUpdateCompany = async () => {
  if (!selectedCompany) {
    return
  }

  const name = editCompanyForm.name.trim()
  const description = editCompanyForm.description.trim()

  if (!name) {
    setEditError('Company name is required.')
    return
  }

  try {
    setUpdating(true)
    setEditError('')

    const response = await api.put(
      `/companies/${selectedCompany.id}`,
      {
        name,
        description: description || null,
        status: editCompanyForm.status,
      }
    )

    const updatedCompany =
      response.data.company ||
      response.data.data

    if (updatedCompany) {
      setCompanies((previous) =>
        previous.map((company) =>
          company.id === updatedCompany.id
            ? updatedCompany
            : company
        )
      )
    }

    setShowEditModal(false)
    setSelectedCompany(null)

    setEditCompanyForm({
      name: '',
      description: '',
      status: 'ACTIVE',
    })
  } catch (error) {
    setEditError(
      error.response?.data?.message ||
        'Unable to update company.'
    )
  } finally {
    setUpdating(false)
  }
}

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6B3A98]">
            Organization Management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Companies
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            View companies operating under EHG Holdings and monitor their
            organizational status.
          </p>

          
        </div>
      </div>


{user?.role === 'ADMIN' && (
  <button
    type="button"
    onClick={() => setShowCreateModal(true)}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5B3184] focus:outline-none focus:ring-2 focus:ring-[#6B3A98]/30"
  >
    <Plus size={18} />
    Add Company
  </button>
)}
      {/* Summary Cards */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(
          ({ label, value, icon: Icon, iconStyle }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {label}
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                    {value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Main Content */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Company Directory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Companies registered under EHG Holdings.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search companies..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/15"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />

            <p className="mt-4 text-sm text-slate-500">
              Loading companies...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredCompanies.length === 0 && (
            <div className="px-6 py-14 text-center">
              <Building2
                size={34}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm font-medium text-slate-700">
                No companies found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search.
              </p>
            </div>
          )}

        {/* Desktop Table */}
        {!loading &&
          !error &&
          filteredCompanies.length > 0 && (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Company
                      </th>

                     

                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Description
                      </th>

                      {user?.role === 'ADMIN' && (
                      <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B3A98]/10 text-[#6B3A98]">
                              <Building2 size={19} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {company.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                EHG Holdings Company
                              </p>
                            </div>
                          </div>
                        </td>

                       

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              company.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                            }`}
                          >
                            {company.status}
                          </span>
                        </td>

                        <td className="max-w-xs px-6 py-4 text-sm text-slate-500">
                          <p className="truncate">
                            {company.description ||
                              'No description provided.'}
                          </p>
                        </td>
                        {user?.role === 'ADMIN' && (
                        <td className="px-6 py-4 text-right">
                         <button
                            type="button"
                            onClick={() => {
                              setSelectedCompany(company)

                              setEditCompanyForm({
                                name: company.name || '',
                                description: company.description || '',
                                status: company.status || 'ACTIVE',
                              })

                              setShowEditModal(true)
                            }}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#6B3A98] transition hover:bg-purple-50"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>
                        </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B3A98]/10 text-[#6B3A98]">
                          <Building2 size={19} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {company.name}
                          </p>

                          
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          company.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                        }`}
                      >
                        {company.status}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      {company.description ||
                        'No description provided.'}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

        {/* Footer */}
        {!loading && !error && companies.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
            <p className="text-xs text-slate-500">
              Showing {filteredCompanies.length} of{' '}
              {companies.length} companies
            </p>
          </div>
        )}
      </div>


      {showCreateModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Add Company
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a new company under EHG Holdings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(false)}
          className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      <div className="space-y-5 p-6">

        {createError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {createError}
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Company Name
          </label>

          <input
            type="text"
            value={companyForm.name}
            onChange={(event) =>
              setCompanyForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            placeholder="e.g. EHG Logistics"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/15"
          />
        </div>

     

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>

          <textarea
            rows={4}
            value={companyForm.description}
            onChange={(event) =>
              setCompanyForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            placeholder="Short description of the company"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/15"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Status
          </label>

          <select
            value={companyForm.status}
            onChange={(event) =>
              setCompanyForm((previous) => ({
                ...previous,
                status: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/15"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={() => setShowCreateModal(false)}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleCreateCompany}
          disabled={creating}
          className="rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5B3184] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? 'Creating...' : 'Create Company'}
        </button>
      </div>
    </div>
  </div>
)}


{showEditModal && selectedCompany && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Edit Company
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update company information and organizational status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowEditModal(false)
            setSelectedCompany(null)
          }}
          className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      <div className="space-y-5 p-6">


            {editError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {editError}
            </div>
          )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Company Name
          </label>

          <input
            type="text"
            value={editCompanyForm.name}
            onChange={(event) =>
              setEditCompanyForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/15"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>

          <textarea
            rows={4}
            value={editCompanyForm.description}
            onChange={(event) =>
              setEditCompanyForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            placeholder="Short description of the company"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/15"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Status
          </label>

          <select
            value={editCompanyForm.status}
            onChange={(event) =>
              setEditCompanyForm((previous) => ({
                ...previous,
                status: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#6B3A98] focus:ring-2 focus:ring-[#6B3A98]/15"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={() => {
            setShowEditModal(false)
            setSelectedCompany(null)
          }}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
      type="button"
      onClick={handleUpdateCompany}
      disabled={updating}
      className="rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5B3184] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {updating ? 'Saving...' : 'Save Changes'}
    </button>
      </div>

    </div>
  </div>
)}
    </div>

    
  )


  
}

export default CompaniesPage