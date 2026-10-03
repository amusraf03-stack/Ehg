import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Landmark,
  Save,
  Send,

  WalletCards,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const initialForm = {
  companyId: '',
  referenceNo: '',
  title: '',
  clientName: '',
  description: '',
  category: '',
  tenderValue: '',
  status: 'DRAFT',
  priority: 'MEDIUM',
  result: 'PENDING',
  progress: 0,
  startDate: '',
  deadline: '',
  closingTime: '',
  internalDeadline: '',
  
  submissionMethod: '',
  submissionLocation: '',
}

const statusOptions = [
  {
    value: 'DRAFT',
    label: 'Draft',
  },
  {
    value: 'PREPARATION',
    label: 'Preparation',
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
  },
  {
    value: 'REVIEW',
    label: 'Review',
  },
  {
    value: 'SUBMITTED',
    label: 'Submitted',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
  },
]

const priorityOptions = [
  {
    value: 'LOW',
    label: 'Low',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
  },
  {
    value: 'HIGH',
    label: 'High',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
  },
]

const resultOptions = [
  {
    value: 'PENDING',
    label: 'Pending',
  },
  {
    value: 'WON',
    label: 'Won',
  },
  {
    value: 'LOST',
    label: 'Lost',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
  },
]

const submissionMethods = [
  'Online Portal',
  'Email',
  'Physical Submission',
  'Courier',
  'Hand Delivery',
  'Other',
]

const getStatusStyle = (status) => {
  switch (status) {
    case 'PREPARATION':
      return 'border-blue-200 bg-blue-50 text-blue-700'

    case 'IN_PROGRESS':
      return 'border-purple-200 bg-purple-50 text-purple-700'

    case 'REVIEW':
      return 'border-amber-200 bg-amber-50 text-amber-700'

    case 'SUBMITTED':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700'

    case 'COMPLETED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'

    case 'CANCELLED':
      return 'border-red-200 bg-red-50 text-red-700'

    default:
      return 'border-slate-200 bg-slate-100 text-slate-700'
  }
}

const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'LOW':
      return 'border-blue-200 bg-blue-50 text-blue-700'

    case 'HIGH':
      return 'border-orange-200 bg-orange-50 text-orange-700'

    case 'URGENT':
      return 'border-red-200 bg-red-50 text-red-700'

    default:
      return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

const getResultStyle = (result) => {
  switch (result) {
    case 'WON':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'

    case 'LOST':
      return 'border-red-200 bg-red-50 text-red-700'

    case 'CANCELLED':
      return 'border-slate-300 bg-slate-100 text-slate-700'

    default:
      return 'border-blue-200 bg-blue-50 text-blue-700'
  }
}

const SectionHeader = ({
  number,
  icon: Icon,
  title,
  description,
}) => (
  <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B3A98]/10 text-[#6B3A98]">
      <Icon size={19} />
    </div>

    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#6B3A98]">
          Section {number}
        </span>
      </div>

      <h2 className="mt-1 text-base font-bold text-slate-950 sm:text-lg">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  </div>
)

const FieldLabel = ({
  htmlFor,
  children,
  required = false,
}) => (
  <label
    htmlFor={htmlFor}
    className="mb-2 block text-sm font-semibold text-slate-700"
  >
    {children}

    {required && (
      <span className="ml-1 text-red-500">
        *
      </span>
    )}
  </label>
)

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6B3A98] focus:ring-4 focus:ring-[#6B3A98]/10'

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#6B3A98] focus:ring-4 focus:ring-[#6B3A98]/10'

const CreateTender = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [companies, setCompanies] = useState([])




  const [loadingOptions, setLoadingOptions] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] = useState('')


  const [fieldErrors, setFieldErrors] =
  useState({})

  const tenderListPath =
    user?.role === 'ADMIN'
      ? '/admin/tenders'
      : '/manager/tenders'

  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        setLoadingOptions(true)

      const companiesResponse = await api.get('/companies')

        const companiesData =
          companiesResponse.data?.data ||
          companiesResponse.data?.companies ||
          []

   

        setCompanies(
          Array.isArray(companiesData)
            ? companiesData.filter(
                (company) =>
                  company.status === 'ACTIVE'
              )
            : []
        )

       
      } catch (loadError) {
        console.error(
          'Unable to load tender form options:',
          loadError
        )

        setError(
          loadError.response?.data?.message ||
            'Unable to load companies.'
        )
      } finally {
        setLoadingOptions(false)
      }
    }

    loadFormOptions()
  }, [])



 

  const selectedCompany = useMemo(
    () =>
      companies.find(
        (company) =>
          String(company.id) ===
          String(form.companyId)
      ),
    [companies, form.companyId]
  )

  

  const handleChange = (event) => {
  const { name, value } = event.target

 if (name === 'companyId') {
  if (fieldErrors.companyId) {
    setFieldErrors((current) => ({
      ...current,
      companyId: '',
    }))
  }

  setForm((current) => ({
    ...current,
    companyId: value,
  }))

  return
}

  if (fieldErrors[name]) {
  setFieldErrors((current) => ({
    ...current,
    [name]: '',
  }))
}

  setForm((current) => ({
    ...current,
    [name]: value,
  }))
}

  const formattedTenderValue = useMemo(() => {
    if (
      form.tenderValue === '' ||
      Number.isNaN(Number(form.tenderValue))
    ) {
      return 'Not specified'
    }

    return new Intl.NumberFormat('en-NA', {
      style: 'currency',
      currency: 'NAD',
      maximumFractionDigits: 2,
    }).format(Number(form.tenderValue))
  }, [form.tenderValue])

  const closingDateTime = useMemo(() => {
    if (!form.deadline) {
      return null
    }

    return new Date(
      `${form.deadline}T${
        form.closingTime || '23:59'
      }`
    )
  }, [form.deadline, form.closingTime])

  const handleSubmit = async (event) => {
    event.preventDefault()

   setError('')

const validationErrors = {}

if (!form.companyId) {
  validationErrors.companyId =
    'Please select the company responsible for this tender.'
}

if (!form.referenceNo.trim()) {
  validationErrors.referenceNo =
    'Tender reference number is required.'
}

if (!form.title.trim()) {
  validationErrors.title =
    'Tender title is required.'
}


if (Object.keys(validationErrors).length > 0) {
  setFieldErrors(validationErrors)

const fieldOrder = [
  'companyId',
  'referenceNo',
  'title',
]

  const firstInvalidField =
    fieldOrder.find(
      (field) => validationErrors[field]
    )

  document
    .getElementById(firstInvalidField)
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

  return
}

setFieldErrors({})

    if (!form.referenceNo.trim()) {
      setError(
        'Tender reference number is required.'
      )
      return
    }

    if (!form.title.trim()) {
      setError('Tender title is required.')
      return
    }

    if (
      form.startDate &&
      form.deadline &&
      form.deadline < form.startDate
    ) {
      setError(
        'Tender closing date cannot be earlier than the start date.'
      )
      return
    }

    if (
      form.internalDeadline &&
      closingDateTime
    ) {
      const internalDate =
        new Date(form.internalDeadline)

      if (internalDate > closingDateTime) {
        setError(
          'Internal deadline should not be later than the tender closing date and time.'
        )
        return
      }
    }

    if (
      form.tenderValue !== '' &&
      Number(form.tenderValue) < 0
    ) {
      setError(
        'Tender value cannot be negative.'
      )
      return
    }

    try {
      setSubmitting(true)

      await api.post('/tenders', {
        companyId: Number(form.companyId),

        referenceNo:
          form.referenceNo.trim(),

        title: form.title.trim(),

        clientName:
          form.clientName.trim(),

        description:
          form.description.trim(),

        category:
          form.category.trim(),

        tenderValue:
          form.tenderValue === ''
            ? null
            : Number(form.tenderValue),

        status: form.status,

        priority: form.priority,

        result: form.result,

        progress: Number(form.progress),

        startDate:
          form.startDate || null,

        deadline:
          form.deadline || null,

        closingTime:
          form.closingTime || null,

        internalDeadline:
          form.internalDeadline || null,

        

        submissionMethod:
          form.submissionMethod.trim(),

        submissionLocation:
          form.submissionLocation.trim(),

        submittedAt: null,
      })

      navigate(tenderListPath, {
        replace: true,
        state: {
          message:
            'Tender created successfully.',
        },
      })
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          'Unable to create tender. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl pb-10">
      {/* Back */}
      <button
        type="button"
        onClick={() =>
          navigate(tenderListPath)
        }
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#6B3A98]"
      >
        <ArrowLeft size={17} />
        Back to Tender Management
      </button>

      {/* Page Header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#6B3A98]" />

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#6B3A98]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
                <FileText size={13} />
                Tender Workspace
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Create New Tender
              </h1>

             <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Register a tender opportunity and define its
                key information, deadlines and submission details
                before the preparation workflow begins.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#6B3A98] shadow-sm">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Initial Status
                </p>

                <p className="text-sm font-bold text-slate-900">
                  Draft Workspace
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                number="01"
                icon={Landmark}
                title="Basic Information"
                description="Identify the tender, responsible company and issuing authority."
              />

              <div className="p-5 sm:p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel
                      htmlFor="companyId"
                      required
                    >
                      Company Responsible
                    </FieldLabel>

                    <div className="relative">
                      <Building2
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        id="companyId"
                        name="companyId"
                        value={form.companyId}
                        onChange={handleChange}
                        disabled={loadingOptions}
                       className={`${selectClass} pl-10 ${
                        fieldErrors.companyId
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                          : ''
                      }`}
                      >
                        <option value="">
                          {loadingOptions
                            ? 'Loading companies...'
                            : 'Select company'}
                        </option>

                        {companies.map(
                          (company) => (
                            <option
                              key={company.id}
                              value={company.id}
                            >
                              {company.name}
                              {company.code
                                ? ` (${company.code})`
                                : ''}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    {fieldErrors.companyId && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {fieldErrors.companyId}
                    </p>
                  )}
                  </div>

                  <div>
                    <FieldLabel
                      htmlFor="referenceNo"
                      required
                    >
                      Tender / Reference Number
                    </FieldLabel>

                    <input
                      id="referenceNo"
                      name="referenceNo"
                      type="text"
                      value={form.referenceNo}
                      onChange={handleChange}
                      placeholder="e.g. EHG-2026-011"
                     className={`${inputClass} ${
                      fieldErrors.referenceNo
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : ''
                    }`}
                    />

                    {fieldErrors.referenceNo && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {fieldErrors.referenceNo}
                    </p>
                  )}
                  </div>
                </div>

                <div className="mt-5">
                  <FieldLabel
                    htmlFor="title"
                    required
                  >
                    Tender Title
                  </FieldLabel>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter the official tender title"
                   className={`${inputClass} ${
                  fieldErrors.title
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : ''
                }`}
                  />
                  {fieldErrors.title && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {fieldErrors.title}
                  </p>
                )}
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="clientName">
                      Client / Issuing Authority
                    </FieldLabel>

                    <input
                      id="clientName"
                      name="clientName"
                      type="text"
                      value={form.clientName}
                      onChange={handleChange}
                      placeholder="e.g. Ministry, Municipality or Client"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="category">
                      Tender Category / Type
                    </FieldLabel>

                    <input
                      id="category"
                      name="category"
                      type="text"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="e.g. ICT, Construction, Security"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <FieldLabel htmlFor="tenderValue">
                    Tender Value / Budget
                  </FieldLabel>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                      N$
                    </span>

                    <input
                      id="tenderValue"
                      name="tenderValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.tenderValue}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`${inputClass} pl-11`}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Leave blank if the tender value
                    has not been provided.
                  </p>
                </div>

                <div className="mt-5">
                  <FieldLabel htmlFor="description">
                    Scope / Description
                  </FieldLabel>

                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Summarize the tender scope, key objectives and important details..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </section>

            {/* Dates */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                number="02"
                icon={CalendarDays}
                title="Dates & Deadlines"
                description="Keep the external tender closing deadline separate from your internal target date."
              />

              <div className="p-5 sm:p-6">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <FieldLabel htmlFor="startDate">
                      Start Date
                    </FieldLabel>

                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="deadline">
                      Tender Closing Date
                    </FieldLabel>

                    <input
                      id="deadline"
                      name="deadline"
                      type="date"
                      value={form.deadline}
                      min={
                        form.startDate ||
                        undefined
                      }
                      onChange={handleChange}
                      className={inputClass}
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Official external submission
                      deadline.
                    </p>
                  </div>

                  <div>
                    <FieldLabel htmlFor="closingTime">
                      Closing Time
                    </FieldLabel>

                    <input
                      id="closingTime"
                      name="closingTime"
                      type="time"
                      value={form.closingTime}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                  <div className="flex gap-3">
                    <Clock3
                      size={18}
                      className="mt-0.5 shrink-0 text-[#6B3A98]"
                    />

                    <div className="w-full">
                      <FieldLabel htmlFor="internalDeadline">
                        Internal Deadline
                      </FieldLabel>

                      <input
                        id="internalDeadline"
                        name="internalDeadline"
                        type="datetime-local"
                        value={
                          form.internalDeadline
                        }
                        onChange={handleChange}
                        className={inputClass}
                      />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Set the internal completion
                        target before the official
                        closing deadline so management
                        has time for review and final
                        approval.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Responsibility */}
           {/* Workflow */}
<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <SectionHeader
    number="03"
    icon={CheckCircle2}
    title="Workflow"
    description="Set the initial workflow status and management priority."
  />

  <div className="p-5 sm:p-6">
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <FieldLabel htmlFor="status">
          Workflow Status
        </FieldLabel>

        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
          className={selectClass}
        >
          {statusOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <div>
                    <FieldLabel htmlFor="priority">
                      Priority
                    </FieldLabel>

                    <select
                      id="priority"
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      {priorityOptions.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="result">
                      Tender Result
                    </FieldLabel>

                    <select
                      id="result"
                      name="result"
                      value={form.result}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      {resultOptions.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="progress">
                      Initial Progress
                    </FieldLabel>

                    <div className="relative">
                      <input
                        id="progress"
                        name="progress"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={form.progress}
                        onChange={handleChange}
                        className={`${inputClass} pr-10`}
                      />

                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                        %
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      This will later be calculated
                      from tender requirements and
                      tasks.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Submission */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                number="04"
                icon={Send}
                title="Submission Details"
                description="Record how and where the completed tender must be submitted."
              />

              <div className="p-5 sm:p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="submissionMethod">
                      Submission Method
                    </FieldLabel>

                    <select
                      id="submissionMethod"
                      name="submissionMethod"
                      value={
                        form.submissionMethod
                      }
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">
                        Select method
                      </option>

                      {submissionMethods.map(
                        (method) => (
                          <option
                            key={method}
                            value={method}
                          >
                            {method}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="submissionLocation">
                      Submission Location / Portal
                    </FieldLabel>

                    <input
                      id="submissionLocation"
                      name="submissionLocation"
                      type="text"
                      value={
                        form.submissionLocation
                      }
                      onChange={handleChange}
                      placeholder="Portal URL, email, office or physical address"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Mobile summary */}
            <div className="xl:hidden">
              <TenderSummary
                form={form}
                selectedCompany={
                  selectedCompany
                }
                
                formattedTenderValue={
                  formattedTenderValue
                }
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  navigate(tenderListPath)
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting ||
                  loadingOptions
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5B3182] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {submitting
                  ? 'Creating Tender...'
                  : 'Create Tender'}
              </button>
            </div>
          </div>

          {/* Desktop Summary */}
          <aside className="hidden xl:block">
            <div className="sticky top-6">
              <TenderSummary
                form={form}
                selectedCompany={
                  selectedCompany
                }
             
                formattedTenderValue={
                  formattedTenderValue
                }
              />
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}

const TenderSummary = ({
  form,
  selectedCompany,
  formattedTenderValue,
}) => {
  const statusLabel =
    statusOptions.find(
      (option) =>
        option.value === form.status
    )?.label || form.status

  const priorityLabel =
    priorityOptions.find(
      (option) =>
        option.value === form.priority
    )?.label || form.priority

  const resultLabel =
    resultOptions.find(
      (option) =>
        option.value === form.result
    )?.label || form.result

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <WalletCards
            size={18}
            className="text-[#6B3A98]"
          />

          <h3 className="font-bold text-slate-950">
            Tender Summary
          </h3>
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Live overview of the tender being
          created.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tender
          </p>

          <p className="mt-1 break-words text-sm font-bold text-slate-900">
            {form.title ||
              'Untitled Tender'}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {form.referenceNo ||
              'Reference not entered'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryBadge
            label="Status"
            value={statusLabel}
            className={getStatusStyle(
              form.status
            )}
          />

          <SummaryBadge
            label="Priority"
            value={priorityLabel}
            className={getPriorityStyle(
              form.priority
            )}
          />

          <SummaryBadge
            label="Result"
            value={resultLabel}
            className={getResultStyle(
              form.result
            )}
          />

          <SummaryBadge
            label="Progress"
            value={`${form.progress || 0}%`}
            className="border-slate-200 bg-slate-50 text-slate-700"
          />
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-5">
          <SummaryRow
            label="Company"
            value={
              selectedCompany?.name ||
              'Not selected'
            }
          />

         

          <SummaryRow
            label="Tender Value"
            value={formattedTenderValue}
          />

          <SummaryRow
            label="Closing Date"
            value={
              form.deadline ||
              'Not specified'
            }
          />

          <SummaryRow
            label="Closing Time"
            value={
              form.closingTime ||
              'Not specified'
            }
          />

          <SummaryRow
            label="Internal Deadline"
            value={
              form.internalDeadline
                ? form.internalDeadline
                    .replace('T', ' ')
                : 'Not specified'
            }
          />
        </div>

        <div className="rounded-xl border border-purple-100 bg-[#6B3A98]/5 p-4">
          <div className="flex gap-3">
            <Building2
              size={17}
              className="mt-0.5 shrink-0 text-[#6B3A98]"
            />

            <p className="text-xs leading-5 text-slate-600">
              After creating the tender,
              employees can be assigned from
              Tender Management. Requirements,
              compliance and documents will be
              managed inside the tender workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const SummaryBadge = ({
  label,
  value,
  className,
}) => (
  <div>
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {label}
    </p>

    <span
      className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {value}
    </span>
  </div>
)

const SummaryRow = ({
  label,
  value,
}) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-xs font-medium text-slate-400">
      {label}
    </span>

    <span className="max-w-[60%] break-words text-right text-xs font-semibold text-slate-700">
      {value}
    </span>
  </div>
)

export default CreateTender