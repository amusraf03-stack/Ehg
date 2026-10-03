  import { useEffect, useMemo, useState,useRef } from 'react'
  import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    FileCheck2,
    Files,
    FileText,
    Upload,
    Download,
    LayoutDashboard,
    MessageSquareText,
    Send,
    ShieldCheck,
    Users,
    CircleAlert,
  CircleCheckBig,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  X,
  Eye,
  } from 'lucide-react'
  import { useNavigate, useParams } from 'react-router-dom'

  import api from '../../services/api'
  import { useAuth } from '../../context/AuthContext'

  import {
  formatActivityDateTime,
  formatTenderActivity,
} from '../../utils/activityFormatter'

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'requirements',
      label: 'Requirements',
      icon: ClipboardCheck,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: ShieldCheck,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: Files,
    },
    // {
    //   id: 'team',
    //   label: 'Team',
    //   icon: Users,
    // },
    // {
    //   id: 'notes',
    //   label: 'Internal Notes',
    //   icon: MessageSquareText,
    // },
    {
      id: 'review',
      label: 'Review & Approval',
      icon: FileCheck2,
    },
    {
      id: 'submission',
      label: 'Submission',
      icon: Send,
    },
  ]

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

  const resultStyles = {
    PENDING: 'bg-blue-100 text-blue-700',
    WON: 'bg-emerald-100 text-emerald-700',
    LOST: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-700',
  }

  const formatDate = (value) => {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10)
    }

    return date.toLocaleDateString()
  }

  const formatDateTime = (value) => {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value)
    }

    return date.toLocaleString()
  }

  const formatTime = (value) => {
    if (!value) return '—'

    return String(value).slice(0, 5)
  }

  const formatCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—'
    }

    return new Intl.NumberFormat('en-NA', {
      style: 'currency',
      currency: 'NAD',
      maximumFractionDigits: 2,
    }).format(Number(value))
  }

  const formatFileSize = (value) => {
    const bytes = Number(value || 0)
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const documentTypeLabels = {
    ORIGINAL_TENDER: 'Original Tender',
    INTERNAL_SUBMISSION: 'Internal Submission',
  }

  const requirementStatusStyles = {
    NOT_STARTED: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    NOT_APPLICABLE: 'bg-slate-100 text-slate-500',
  }

  const requirementStatusLabels = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    NOT_APPLICABLE: 'Not Applicable',
  }

  const reviewStatusLabels = {
  NOT_SUBMITTED: 'Not Submitted',
  AWAITING_REVIEW: 'Awaiting Review',
  APPROVED: 'Approved',
  CHANGES_REQUESTED: 'Changes Requested',
}

const reviewStatusStyles = {
  NOT_SUBMITTED: 'bg-slate-100 text-slate-600',
  AWAITING_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  CHANGES_REQUESTED: 'bg-red-100 text-red-700',
}

  const InfoItem = ({
    label,
    value,
    icon: Icon,
  }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#6B3A98] shadow-sm">
            <Icon size={17} />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {value || '—'}
          </p>
        </div>
      </div>
    </div>
  )

  const TenderWorkspace = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [tender, setTender] = useState(null)
    const [activeTab, setActiveTab] =
      useState('overview')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [requirements, setRequirements] = useState([])


  const [requirementSummary, setRequirementSummary] =
    useState({
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      notApplicable: 0,
      mandatory: 0,
      overdue: 0,
    })

    
  const [requirementsLoading, setRequirementsLoading] =
    useState(false)

  const [requirementError, setRequirementError] =
    useState('')

  const [showRequirementModal, setShowRequirementModal] =
    useState(false)

  const [editingRequirement, setEditingRequirement] =
    useState(null)

  const [savingRequirement, setSavingRequirement] =
    useState(false)

  const [requirementForm, setRequirementForm] = useState({
    category: 'MANDATORY',
    title: '',
    description: '',
    isMandatory: true,
    status: 'NOT_STARTED',
    assignedUserId: '',
    dueDate: '',
    sortOrder: 0,
  })


  const [complianceItems, setComplianceItems] =
    useState([])

  const [complianceSummary, setComplianceSummary] =
    useState({
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      notApplicable: 0,
      mandatory: 0,
      overdue: 0,
    })

  const [complianceLoading, setComplianceLoading] =
    useState(false)

  const [complianceError, setComplianceError] =
    useState('')

  const [applyingComplianceTemplate, setApplyingComplianceTemplate] =
    useState(false)






    const [
  showComplianceTemplateModal,
  setShowComplianceTemplateModal,
] = useState(false)

const [
  complianceTemplateItems,
  setComplianceTemplateItems,
] = useState([])

const [
  complianceTemplate,
  setComplianceTemplate,
] = useState(null)

const [
  selectedComplianceTemplateIds,
  setSelectedComplianceTemplateIds,
] = useState([])

const [
  complianceTemplateLoading,
  setComplianceTemplateLoading,
] = useState(false)



    const [showComplianceModal, setShowComplianceModal] =
    useState(false)

  const [editingComplianceItem, setEditingComplianceItem] =
    useState(null)

  const [savingComplianceItem, setSavingComplianceItem] =
    useState(false)

  const [complianceForm, setComplianceForm] = useState({
    category: 'OTHER',
    title: '',
    description: '',
    isMandatory: true,
    status: 'NOT_STARTED',
    assignedUserId: '',
    dueDate: '',
    notes: '',
    sortOrder: 0,
  })


  const [assignableEmployees, setAssignableEmployees] =
    useState([])

  const [teamLoading, setTeamLoading] =
    useState(false)

  const [teamError, setTeamError] =
    useState('')

  const [selectedTeamEmployeeId, setSelectedTeamEmployeeId] =
    useState('')


  const [assigningTeamEmployee, setAssigningTeamEmployee] =
    useState(false)

  
  const [removingTeamEmployeeId, setRemovingTeamEmployeeId] =
  useState(null)


  const [documents, setDocuments] = useState([])
  const [documentSummary, setDocumentSummary] = useState({
    total: 0,
    originalTender: 0,
    internalSubmission: 0,
    requirementEvidence: 0,
    complianceEvidence: 0,
  })
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentError, setDocumentError] = useState('')
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState(null)
  const [savingDocument, setSavingDocument] = useState(false)
  const [downloadingDocumentId, setDownloadingDocumentId] = useState(null)
  
const [previewingDocumentId, setPreviewingDocumentId] =
  useState(null)

const [previewDocument, setPreviewDocument] =
  useState(null)

const [previewUrl, setPreviewUrl] =
  useState('')


  const [internalNotes, setInternalNotes] = useState([])
  const internalNotesBottomRef = useRef(null)

const [internalNotesLoading, setInternalNotesLoading] =
  useState(false)

const [internalNotesError, setInternalNotesError] =
  useState('')
const [submissionData, setSubmissionData] = useState(null)
const [submissionLoading, setSubmissionLoading] = useState(false)
const [submissionError, setSubmissionError] = useState('')
const [submittingTender, setSubmittingTender] = useState(false)

const [submissionForm, setSubmissionForm] = useState({
  submissionMethod: '',
  submissionLocation: '',
  submissionReference: '',
  submissionNotes: '',
})

  const [reviewData, setReviewData] = useState(null)
const [reviewLoading, setReviewLoading] = useState(false)
const [reviewError, setReviewError] = useState('')
const [reviewingItem, setReviewingItem] = useState(null)

const [showReviewChangesModal, setShowReviewChangesModal] =
  useState(false)

const [reviewChangesTarget, setReviewChangesTarget] =
  useState(null)

const [reviewComment, setReviewComment] =
  useState('')

const [internalNoteForm, setInternalNoteForm] = useState({
  noteType: 'GENERAL_NOTE',
  content: '',
})

const [savingInternalNote, setSavingInternalNote] =
  useState(false)

const [editingInternalNote, setEditingInternalNote] =
  useState(null)


  const [documentForm, setDocumentForm] = useState({
    documentType: 'ORIGINAL_TENDER',
    title: '',
    description: '',
    requirementId: '',
    complianceItemId: '',
    file: null,
  })



  const [activities, setActivities] = useState([])
const [activitiesLoading, setActivitiesLoading] =
  useState(false)
const [activityError, setActivityError] = useState('')


const recentActivities = activities
  .slice(0, 5)
  .map(formatTenderActivity)


  const complianceReadiness = useMemo(() => {
    const applicableItems = complianceItems.filter(
      (item) => item.status !== 'NOT_APPLICABLE'
    )

    if (applicableItems.length === 0) {
      return 0
    }

    const completedItems = applicableItems.filter(
      (item) => item.status === 'COMPLETED'
    )

    return Math.round(
      (completedItems.length / applicableItems.length) * 100
    )
  }, [complianceItems])


  const myResponsibilities = useMemo(() => {
  if (user?.role !== 'EMPLOYEE') {
    return {
      requirements: [],
      compliance: [],
      total: 0,
      completed: 0,
      outstanding: 0,
    }
  }

  const myRequirements = requirements.filter(
    (requirement) =>
      Number(requirement.assigned_user_id) ===
      Number(user.id)
  )

  const myCompliance = complianceItems.filter(
    (item) =>
      Number(item.assigned_user_id) ===
      Number(user.id)
  )

  const allResponsibilities = [
    ...myRequirements,
    ...myCompliance,
  ]

  const completed = allResponsibilities.filter(
    (item) => item.status === 'COMPLETED'
  ).length

  return {
    requirements: myRequirements,
    compliance: myCompliance,
    total: allResponsibilities.length,
    completed,
    outstanding:
      allResponsibilities.length - completed,
  }
}, [
  requirements,
  complianceItems,
  user?.id,
  user?.role,
])


const getRequirementDocuments = (requirementId) => {
  return documents.filter(
    (document) =>
      Number(document.requirement_id) ===
      Number(requirementId)
  )
}

const getComplianceDocuments = (complianceItemId) => {
  return documents.filter(
    (document) =>
      Number(document.compliance_item_id) ===
      Number(complianceItemId)
  )
}

const isEmployeeDocumentResponsibility = (document) => {
  return (
    user?.role === 'EMPLOYEE' &&
    document.document_type === 'INTERNAL_SUBMISSION'
  )
}

  const refreshDocuments = async () => {
    const response = await api.get(`/tenders/${id}/documents`)
    setDocuments(response.data.data || [])
    setDocumentSummary(
      response.data.summary || {
        total: 0,
        originalTender: 0,
        internalSubmission: 0,
        requirementEvidence: 0,
        complianceEvidence: 0,
      }
    )
  }

  const openCreateDocument = (documentType = 'ORIGINAL_TENDER') => {
    setEditingDocument(null)
    setDocumentForm({
      documentType,
      title: '',
      description: '',
      requirementId: '',
      complianceItemId: '',
      file: null,
    })
    setDocumentError('')
    setShowDocumentModal(true)
  }


  const openRequirementDocumentUpload = (
  requirement,
  documentType
) => {
  setEditingDocument(null)

  setDocumentForm({
    documentType,
    title: '',
    description: '',
    requirementId: String(requirement.id),
    complianceItemId: '',
    file: null,
  })

  setDocumentError('')
  setShowDocumentModal(true)
}


const openComplianceDocumentUpload = (
  complianceItem,
  documentType
) => {
  setEditingDocument(null)

  setDocumentForm({
    documentType,
    title: '',
    description: '',
    requirementId: '',
    complianceItemId: String(complianceItem.id),
    file: null,
  })

  setDocumentError('')
  setShowDocumentModal(true)
}

  const openEditDocument = (document) => {
    setEditingDocument(document)
    setDocumentForm({
      documentType: document.document_type || 'ORIGINAL_TENDER',
      title: document.title || '',
      description: document.description || '',
      requirementId: document.requirement_id || '',
      complianceItemId: document.compliance_item_id || '',
      file: null,
    })
    setDocumentError('')
    setShowDocumentModal(true)
  }

  const closeDocumentModal = () => {
    if (savingDocument) return
    setShowDocumentModal(false)
    setEditingDocument(null)
  }



  const loadReviewData = async () => {
  try {
    setReviewLoading(true)
    setReviewError('')

    const response = await api.get(
      `/tenders/${id}/review`
    )

    setReviewData(response.data)
  } catch (error) {
    setReviewError(
      error.response?.data?.message ||
      'Unable to load review information.'
    )
  } finally {
    setReviewLoading(false)
  }
}



useEffect(() => {
  if (activeTab === 'review') {
    loadReviewData()
  }
}, [activeTab, id])

  const handleDocumentFormChange = (event) => {
    const { name, value, files: selectedFiles } = event.target

    if (name === 'file') {
      setDocumentForm((current) => ({
        ...current,
        file: selectedFiles?.[0] || null,
      }))
      return
    }

    setDocumentForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'requirementId' && value
        ? { complianceItemId: '' }
        : {}),
      ...(name === 'complianceItemId' && value
        ? { requirementId: '' }
        : {}),
    }))
  }



  const canReviewTender = ['ADMIN', 'CEO', 'MANAGER'].includes(
  user?.role
)



useEffect(() => {
  if (activeTab !== 'submission') {
    return
  }

  const fetchSubmission = async () => {
    try {
      setSubmissionLoading(true)
      setSubmissionError('')

      const response = await api.get(
        `/tenders/${id}/submission`
      )

      const data = response.data

      setSubmissionData(data)

      setSubmissionForm({
        submissionMethod:
          data.tender?.submission_method || '',
        submissionLocation:
          data.tender?.submission_location || '',
        submissionReference:
          data.tender?.submission_reference || '',
        submissionNotes:
          data.tender?.submission_notes || '',
      })
    } catch (fetchError) {
      setSubmissionError(
        fetchError.response?.data?.message ||
          'Unable to load final submission information.'
      )
    } finally {
      setSubmissionLoading(false)
    }
  }

  fetchSubmission()
}, [activeTab, id])



const handleApproveReviewItem = async (
  type,
  item
) => {
  try {
    setReviewingItem(`${type}-${item.id}`)
    setReviewError('')

    const endpoint =
      type === 'requirement'
        ? `/tenders/${id}/review/requirements/${item.id}`
        : `/tenders/${id}/review/compliance/${item.id}`

    await api.patch(endpoint, {
      decision: 'APPROVED',
    })

    await loadReviewData()

    // Refresh normal Requirement/Compliance lists
    // so their review badges update immediately.
    if (type === 'requirement') {
      const response = await api.get(
        `/tenders/${id}/requirements`
      )

      setRequirements(response.data.data || [])

      if (response.data.summary) {
        setRequirementSummary(response.data.summary)
      }
    } else {
      const response = await api.get(
        `/tenders/${id}/compliance`
      )

      setComplianceItems(response.data.data || [])

      if (response.data.summary) {
        setComplianceSummary(response.data.summary)
      }
    }
  } catch (error) {
    setReviewError(
      error.response?.data?.message ||
        'Unable to approve this item.'
    )
  } finally {
    setReviewingItem(null)
  }
}

const openRequestChangesModal = (
  type,
  item
) => {
  setReviewChangesTarget({
    type,
    item,
  })

  setReviewComment('')
  setReviewError('')
  setShowReviewChangesModal(true)
}

const closeRequestChangesModal = () => {
  if (reviewingItem) return

  setShowReviewChangesModal(false)
  setReviewChangesTarget(null)
  setReviewComment('')
}

const handleRequestChanges = async (
  event
) => {
  event.preventDefault()

  const comment = reviewComment.trim()

  if (!comment) {
    setReviewError(
      'Please enter what needs to be changed.'
    )
    return
  }

  if (!reviewChangesTarget) return

  const { type, item } = reviewChangesTarget

  try {
    setReviewingItem(`${type}-${item.id}`)
    setReviewError('')

    const endpoint =
      type === 'requirement'
        ? `/tenders/${id}/review/requirements/${item.id}`
        : `/tenders/${id}/review/compliance/${item.id}`

    await api.patch(endpoint, {
      decision: 'CHANGES_REQUESTED',
      comment,
    })

    setShowReviewChangesModal(false)
    setReviewChangesTarget(null)
    setReviewComment('')

    await loadReviewData()

    if (type === 'requirement') {
      const response = await api.get(
        `/tenders/${id}/requirements`
      )

      setRequirements(response.data.data || [])

      if (response.data.summary) {
        setRequirementSummary(response.data.summary)
      }
    } else {
      const response = await api.get(
        `/tenders/${id}/compliance`
      )

      setComplianceItems(response.data.data || [])

      if (response.data.summary) {
        setComplianceSummary(response.data.summary)
      }
    }
  } catch (error) {
    setReviewError(
      error.response?.data?.message ||
        'Unable to request changes.'
    )
  } finally {
    setReviewingItem(null)
  }
}

const handleDocumentSubmit = async (event) => {
  event.preventDefault()

  try {
    setSavingDocument(true)
    setDocumentError('')

    if (editingDocument) {
      const formData = new FormData()

      formData.append(
        'documentType',
        documentForm.documentType
      )

      formData.append(
        'title',
        documentForm.title.trim()
      )

      formData.append(
        'description',
        documentForm.description.trim()
      )

      if (documentForm.requirementId) {
        formData.append(
          'requirementId',
          documentForm.requirementId
        )
      }

      if (documentForm.complianceItemId) {
        formData.append(
          'complianceItemId',
          documentForm.complianceItemId
        )
      }

      if (documentForm.file) {
        formData.append(
          'file',
          documentForm.file
        )
      }

      await api.put(
        `/tenders/${id}/documents/${editingDocument.id}`,
        formData
      )
    } else {
      if (!documentForm.file) {
        setDocumentError(
          'Please select a file to upload.'
        )
        return
      }

      const formData = new FormData()

      formData.append(
        'documentType',
        documentForm.documentType
      )

      formData.append(
        'title',
        documentForm.title.trim()
      )

      formData.append(
        'description',
        documentForm.description.trim()
      )

      if (documentForm.requirementId) {
        formData.append(
          'requirementId',
          documentForm.requirementId
        )
      }

      if (documentForm.complianceItemId) {
        formData.append(
          'complianceItemId',
          documentForm.complianceItemId
        )
      }

      formData.append(
        'file',
        documentForm.file
      )

      await api.post(
        `/tenders/${id}/documents`,
        formData
      )
    }

    // Refresh normal Documents workspace
    await refreshDocuments()

    // NEW:
    // If uploaded from Final Submission tab,
    // refresh Final Submission data too.
    if (activeTab === 'submission') {
      try {
        const submissionResponse = await api.get(
          `/tenders/${id}/submission`
        )

        setSubmissionData(
          submissionResponse.data
        )
      } catch (submissionRefreshError) {
        console.error(
          'Unable to refresh final submission documents:',
          submissionRefreshError
        )
      }
    }

    setShowDocumentModal(false)
    setEditingDocument(null)
  } catch (submitError) {
    setDocumentError(
      submitError.response?.data?.message ||
        'Unable to save tender document.'
    )
  } finally {
    setSavingDocument(false)
  }
}

  const handleDownloadDocument = async (document) => {
    try {
      setDownloadingDocumentId(document.id)
      setDocumentError('')

      const response = await api.get(
        `/tenders/${id}/documents/${document.id}/download`,
        { responseType: 'blob' }
      )

      const url = window.URL.createObjectURL(response.data)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.file_name || document.title || 'document'
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (downloadError) {
      setDocumentError(
        downloadError.response?.data?.message ||
          'Unable to download document.'
      )
    } finally {
      setDownloadingDocumentId(null)
    }
  }



  const handlePreviewDocument = async (document) => {
  try {
    setPreviewingDocumentId(document.id)
    setDocumentError('')

    const response = await api.get(
      `/tenders/${id}/documents/${document.id}/preview`,
      {
        responseType: 'blob',
      }
    )

    const url = window.URL.createObjectURL(
      response.data
    )

    setPreviewUrl(url)
    setPreviewDocument(document)
  } catch (previewError) {
    setDocumentError(
      previewError.response?.data?.message ||
        'Unable to preview document.'
    )
  } finally {
    setPreviewingDocumentId(null)
  }
}


const closeDocumentPreview = () => {
  if (previewUrl) {
    window.URL.revokeObjectURL(previewUrl)
  }

  setPreviewUrl('')
  setPreviewDocument(null)
}

  const handleRemoveDocument = async (document) => {
    const confirmed = window.confirm(
      `Remove "${document.title}" from this tender?`
    )
    if (!confirmed) return

    try {
      setDocumentError('')
      await api.delete(`/tenders/${id}/documents/${document.id}`)
      await refreshDocuments()
    } catch (deleteError) {
      setDocumentError(
        deleteError.response?.data?.message ||
          'Unable to remove document.'
      )
    }
  }

  const openCreateRequirement = () => {
    setEditingRequirement(null)

    setRequirementForm({
      category: 'MANDATORY',
      title: '',
      description: '',
      isMandatory: true,
      status: 'NOT_STARTED',
      assignedUserId: '',
      dueDate: '',
      sortOrder: requirements.length,
    })

    setShowRequirementModal(true)
  }


  const openEditRequirement = (requirement) => {
    setEditingRequirement(requirement)

    setRequirementForm({
      category: requirement.category || 'OTHER',
      title: requirement.title || '',
      description: requirement.description || '',
      isMandatory:
        Number(requirement.is_mandatory) === 1,
      status: requirement.status || 'NOT_STARTED',
      assignedUserId:
        requirement.assigned_user_id || '',
      dueDate: requirement.due_date
        ? String(requirement.due_date).slice(0, 10)
        : '',
      sortOrder: requirement.sort_order || 0,
    })

    setShowRequirementModal(true)
  }


  const handleRemoveRequirement = async (requirement) => {
    const confirmed = window.confirm(
      `Remove "${requirement.title}" from this tender?`
    )

    if (!confirmed) {
      return
    }

    try {
      setRequirementError('')

      await api.delete(
        `/tenders/${id}/requirements/${requirement.id}`
      )

      const response = await api.get(
        `/tenders/${id}/requirements`
      )

      setRequirements(response.data.data || [])
      setRequirementSummary(
        response.data.summary || {
          total: 0,
          notStarted: 0,
          inProgress: 0,
          completed: 0,
          notApplicable: 0,
          mandatory: 0,
          overdue: 0,
        }
      )
    } catch (deleteError) {
      setRequirementError(
        deleteError.response?.data?.message ||
          'Unable to remove requirement.'
      )
    }
  }

  const closeRequirementModal = () => {
    if (savingRequirement) return

    setShowRequirementModal(false)
    setEditingRequirement(null)
  }

  const handleRequirementFormChange = (event) => {
    const { name, value, type, checked } = event.target

    setRequirementForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleRequirementSubmit = async (event) => {
    event.preventDefault()

    try {
      setSavingRequirement(true)
      setRequirementError('')

      const payload = {
        category: requirementForm.category,
        title: requirementForm.title.trim(),
        description:
          requirementForm.description.trim() || null,
        isMandatory: requirementForm.isMandatory,
        status: requirementForm.status,
        assignedUserId: requirementForm.assignedUserId
          ? Number(requirementForm.assignedUserId)
          : null,
        dueDate: requirementForm.dueDate || null,
        sortOrder: Number(requirementForm.sortOrder) || 0,
      }

    if (editingRequirement) {
      await api.put(
          `/tenders/${id}/requirements/${editingRequirement.id}`,
          payload
      )
      } else {
      await api.post(
          `/tenders/${id}/requirements`,
          payload
      )
      }

      const response = await api.get(
        `/tenders/${id}/requirements`
      )

      setRequirements(response.data.data || [])
      setRequirementSummary(response.data.summary)

      setShowRequirementModal(false)
      setEditingRequirement(null)
    } catch (submitError) {
      setRequirementError(
        submitError.response?.data?.message ||
          'Unable to save requirement.'
      )
    } finally {
      setSavingRequirement(false)
    }
  }

    const tenderListPath = useMemo(() => {
      if (user?.role === 'ADMIN') {
        return '/admin/tenders'
      }

      if (user?.role === 'CEO') {
        return '/ceo/tenders'
      }

      if (user?.role === 'MANAGER') {
        return '/manager/tenders'
      }

      return '/employee/tenders'
    }, [user])

    useEffect(() => {
      const fetchTender = async () => {
        try {
          setLoading(true)
          setError('')

          const response = await api.get(
            `/tenders/${id}`
          )

          setTender(response.data.data)
        } catch (fetchError) {
          setError(
            fetchError.response?.data?.message ||
              'Unable to load tender workspace.'
          )
        } finally {
          setLoading(false)
        }
      }

      fetchTender()
    }, [id])

   useEffect(() => {
  const shouldLoadRequirements =
  activeTab === 'requirements' ||
  activeTab === 'overview'

  if (!shouldLoadRequirements) {
    return
  }

    const fetchRequirements = async () => {
      try {
        setRequirementsLoading(true)
        setRequirementError('')

        const response = await api.get(
          `/tenders/${id}/requirements`
        )

        setRequirements(response.data.data || [])

        setRequirementSummary(
          response.data.summary || {
            total: 0,
            notStarted: 0,
            inProgress: 0,
            completed: 0,
            notApplicable: 0,
            mandatory: 0,
            overdue: 0,
          }
        )
      } catch (fetchError) {
        setRequirementError(
          fetchError.response?.data?.message ||
            'Unable to load tender requirements.'
        )
      } finally {
        setRequirementsLoading(false)
      }
    }

    fetchRequirements()
  }, [activeTab, id, user?.role])


 useEffect(() => {
const shouldLoadCompliance =
  activeTab === 'compliance' ||
  activeTab === 'overview'

  if (!shouldLoadCompliance) {
    return
  }

    const fetchCompliance = async () => {
      try {
        setComplianceLoading(true)
        setComplianceError('')

        const response = await api.get(
          `/tenders/${id}/compliance`
        )

        setComplianceItems(
          response.data.data || []
        )

        setComplianceSummary(
          response.data.summary || {
            total: 0,
            notStarted: 0,
            inProgress: 0,
            completed: 0,
            notApplicable: 0,
            mandatory: 0,
            overdue: 0,
          }
        )
      } catch (fetchError) {
        setComplianceError(
          fetchError.response?.data?.message ||
            'Unable to load tender compliance checklist.'
        )
      } finally {
        setComplianceLoading(false)
      }
    }

    fetchCompliance()
  }, [activeTab, id, user?.role])

  useEffect(() => {
const shouldLoadDocumentWorkspace =
  activeTab === 'documents' ||
  activeTab === 'requirements' ||
  activeTab === 'compliance' ||
  activeTab === 'overview'

    if (!shouldLoadDocumentWorkspace) return

    const fetchDocumentWorkspace = async () => {
    try {
      setDocumentsLoading(true)
      setDocumentError('')

      const response = await api.get(
        `/tenders/${id}/documents`
      )

      setDocuments(response.data.data || [])

      setDocumentSummary(
        response.data.summary || {
          total: 0,
          originalTender: 0,
          internalSubmission: 0,
          requirementEvidence: 0,
          complianceEvidence: 0,
        }
      )
    } catch (fetchError) {
      setDocumentError(
        fetchError.response?.data?.message ||
          'Unable to load tender documents.'
      )
    } finally {
      setDocumentsLoading(false)
    }
  }

    fetchDocumentWorkspace()
  }, [activeTab, id])


  useEffect(() => {
  if (activeTab !== 'notes') {
    return
  }

  const fetchInternalNotes = async () => {
    try {
      setInternalNotesLoading(true)
      setInternalNotesError('')

      const response = await api.get(
        `/tenders/${id}/internal-notes`
      )

      setInternalNotes(response.data.notes || [])
    } catch (fetchError) {
      setInternalNotesError(
        fetchError.response?.data?.message ||
          'Unable to load internal notes.'
      )
    } finally {
      setInternalNotesLoading(false)
    }
  }

  fetchInternalNotes()
}, [activeTab, id])

useEffect(() => {
  if (
    activeTab === 'notes' &&
    !internalNotesLoading
  ) {
    internalNotesBottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }
}, [
  activeTab,
  internalNotes,
  internalNotesLoading,
])

  useEffect(() => {
    if (activeTab !== 'team') return

    // CEO and Employee can view the team,
    // but only Admin/Manager need the assignable employee list.
    if (!['ADMIN', 'MANAGER'].includes(user?.role)) {
      return
    }

    const fetchAssignableEmployees = async () => {
      try {
        setTeamLoading(true)
        setTeamError('')

        const response = await api.get(
          '/tenders/assignable-employees'
        )

        setAssignableEmployees(
          response.data.employees  || []
        )
      } catch (fetchError) {
        setTeamError(
          fetchError.response?.data?.message ||
            'Unable to load employees.'
        )
      } finally {
        setTeamLoading(false)
      }
    }

    fetchAssignableEmployees()
  }, [activeTab, user?.role])





  useEffect(() => {
  if (!id || activeTab !== 'overview') {
    return
  }

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true)
      setActivityError('')

      const response = await api.get(
        `/tenders/${id}/activity`
      )

      setActivities(response.data.activities || [])
    } catch (fetchError) {
      setActivities([])

      setActivityError(
        fetchError.response?.data?.message ||
          'Unable to load tender activity.'
      )
    } finally {
      setActivitiesLoading(false)
    }
  }

  fetchActivities()
}, [id, activeTab])

const openComplianceTemplateModal = async () => {
  try {
    setComplianceTemplateLoading(true)
    setComplianceError('')

    const response = await api.get(
      `/tenders/${id}/compliance/template-options`
    )

    const items = response.data.data || []

    setComplianceTemplate(
      response.data.template || null
    )

    setComplianceTemplateItems(items)

    setSelectedComplianceTemplateIds([])

    setShowComplianceTemplateModal(true)
  } catch (loadError) {
    setComplianceError(
      loadError.response?.data?.message ||
        'Unable to load compliance template.'
    )
  } finally {
    setComplianceTemplateLoading(false)
  }
}


  const handleApplyComplianceTemplate = async () => {
  const selectableIds = selectedComplianceTemplateIds.filter(
    (templateItemId) => {
      const templateItem = complianceTemplateItems.find(
        (item) => item.id === templateItemId
      )

      return (
        templateItem &&
        templateItem.tender_state !== 'ACTIVE'
      )
    }
  )

  if (selectableIds.length === 0) {
    setComplianceError(
      'Please select at least one compliance item to apply.'
    )
    return
  }

  try {
    setApplyingComplianceTemplate(true)
    setComplianceError('')

    const response = await api.post(
      `/tenders/${id}/compliance/apply-template`,
      {
        templateItemIds: selectableIds,
      }
    )

    setComplianceItems(response.data.data || [])

    setComplianceSummary(
      response.data.summary || {
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        notApplicable: 0,
        mandatory: 0,
        overdue: 0,
      }
    )

    setShowComplianceTemplateModal(false)
    setComplianceTemplateItems([])
    setComplianceTemplate(null)
    setSelectedComplianceTemplateIds([])
  } catch (applyError) {
    setComplianceError(
      applyError.response?.data?.message ||
        'Unable to apply selected compliance items.'
    )
  } finally {
    setApplyingComplianceTemplate(false)
  }
}

  const openCreateComplianceItem = () => {
    setEditingComplianceItem(null)

    setComplianceForm({
      category: 'OTHER',
      title: '',
      description: '',
      isMandatory: true,
      status: 'NOT_STARTED',
      assignedUserId: '',
      dueDate: '',
      notes: '',
      sortOrder: complianceItems.length,
    })

    setShowComplianceModal(true)
  }


  const openEditComplianceItem = (item) => {
    setEditingComplianceItem(item)

    setComplianceForm({
      category: item.category || 'OTHER',
      title: item.title || '',
      description: item.description || '',
      isMandatory: Number(item.is_mandatory) === 1,
      status: item.status || 'NOT_STARTED',
      assignedUserId: item.assigned_user_id || '',
      dueDate: item.due_date
        ? String(item.due_date).slice(0, 10)
        : '',
      notes: item.notes || '',
      sortOrder: item.sort_order || 0,
    })

    setShowComplianceModal(true)
  }


  const closeComplianceModal = () => {
    if (savingComplianceItem) return

    setShowComplianceModal(false)
    setEditingComplianceItem(null)
  }


  const handleComplianceFormChange = (event) => {
    const { name, value, type, checked } = event.target

    setComplianceForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }


  const handleComplianceSubmit = async (event) => {
    event.preventDefault()

    try {
      setSavingComplianceItem(true)
      setComplianceError('')

      const payload = {
        category: complianceForm.category,
        title: complianceForm.title.trim(),
        description:
          complianceForm.description.trim() || null,
        isMandatory: complianceForm.isMandatory,
        status: complianceForm.status,
        assignedUserId: complianceForm.assignedUserId
          ? Number(complianceForm.assignedUserId)
          : null,
        dueDate: complianceForm.dueDate || null,
        notes: complianceForm.notes.trim() || null,
        sortOrder:
          Number(complianceForm.sortOrder) || 0,
      }

      if (editingComplianceItem) {
        await api.put(
          `/tenders/${id}/compliance/${editingComplianceItem.id}`,
          payload
        )
      } else {
        await api.post(
          `/tenders/${id}/compliance`,
          payload
        )
      }

      const response = await api.get(
        `/tenders/${id}/compliance`
      )

      setComplianceItems(response.data.data || [])

      setComplianceSummary(
        response.data.summary || {
          total: 0,
          notStarted: 0,
          inProgress: 0,
          completed: 0,
          notApplicable: 0,
          mandatory: 0,
          overdue: 0,
        }
      )

      setShowComplianceModal(false)
      setEditingComplianceItem(null)
    } catch (submitError) {
      setComplianceError(
        submitError.response?.data?.message ||
          'Unable to save compliance item.'
      )
    } finally {
      setSavingComplianceItem(false)
    }
  }


  const handleRemoveComplianceItem = async (item) => {
    const confirmed = window.confirm(
      `Remove "${item.title}" from this tender?`
    )

    if (!confirmed) return

    try {
      setComplianceError('')

      await api.delete(
        `/tenders/${id}/compliance/${item.id}`
      )

      const response = await api.get(
        `/tenders/${id}/compliance`
      )

      setComplianceItems(response.data.data || [])

      setComplianceSummary(
        response.data.summary || {
          total: 0,
          notStarted: 0,
          inProgress: 0,
          completed: 0,
          notApplicable: 0,
          mandatory: 0,
          overdue: 0,
        }
      )
    } catch (deleteError) {
      setComplianceError(
        deleteError.response?.data?.message ||
          'Unable to remove compliance item.'
      )
    }
  }

    if (loading) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />

          <p className="mt-4 text-sm text-slate-500">
            Loading tender workspace...
          </p>
        </div>
      )
    }


    const handleQuickComplianceStatus = async (item, status) => {
    try {
      setComplianceError('')

      await api.put(
        `/tenders/${id}/compliance/${item.id}`,
        {
          status,
        }
      )

      const response = await api.get(
        `/tenders/${id}/compliance`
      )

      setComplianceItems(response.data.data || [])

      setComplianceSummary(
        response.data.summary || {
          total: 0,
          notStarted: 0,
          inProgress: 0,
          completed: 0,
          notApplicable: 0,
          mandatory: 0,
          overdue: 0,
        }
      )
    } catch (updateError) {
      setComplianceError(
        updateError.response?.data?.message ||
          'Unable to update compliance status.'
      )
    }
  }


  const handleEmployeeComplianceStatusChange = async (
  item,
  status
) => {
  try {
    setComplianceError('')

    const response = await api.patch(
      `/tenders/${id}/compliance/${item.id}/progress`,
      {
        status,
      }
    )

    const updatedItem = response.data.data

    setComplianceItems((current) =>
      current.map((complianceItem) =>
        complianceItem.id === item.id
          ? updatedItem
          : complianceItem
      )
    )
  } catch (error) {
    setComplianceError(
      error.response?.data?.message ||
        'Unable to update compliance progress.'
    )
  }
}


  const handleAssignTeamEmployee = async () => {
    if (!selectedTeamEmployeeId) {
      setTeamError('Please select an employee.')
      return
    }

    try {
      setAssigningTeamEmployee(true)
      setTeamError('')

      const response = await api.post(
        `/tenders/${id}/assign`,
        {
          userId: Number(selectedTeamEmployeeId),
        }
      )

      setTender((current) => ({
        ...current,
        assignments:
          response.data.assignments ||
          response.data.data?.assignments ||
          current.assignments,
      }))

      setSelectedTeamEmployeeId('')
    } catch (assignError) {
      setTeamError(
        assignError.response?.data?.message ||
          'Unable to assign employee to this tender.'
      )
    } finally {
      setAssigningTeamEmployee(false)
    }
  }


  const handleRemoveTeamEmployee = async (assignment) => {
  const confirmed = window.confirm(
    `Remove "${assignment.employee_name}" from this tender team?`
  )

  if (!confirmed) return

  try {
    setRemovingTeamEmployeeId(assignment.user_id)
    setTeamError('')

    const response = await api.delete(
      `/tenders/${id}/assign/${assignment.user_id}`
    )

    setTender((current) => ({
      ...current,
      assignments:
        response.data.assignments ||
        response.data.data?.assignments ||
        current.assignments,
    }))
  } catch (removeError) {
    setTeamError(
      removeError.response?.data?.message ||
        'Unable to remove employee from this tender.'
    )
  } finally {
    setRemovingTeamEmployeeId(null)
  }
}


const handleEmployeeRequirementStatusChange = async (
  requirement,
  status
) => {
  try {
    setRequirementError('')

    const response = await api.patch(
      `/tenders/${id}/requirements/${requirement.id}/progress`,
      {
        status,
      }
    )

    const updatedRequirement = response.data.data

    setRequirements((current) =>
      current.map((item) =>
        item.id === requirement.id
          ? updatedRequirement
          : item
      )
    )
  } catch (error) {
    setRequirementError(
      error.response?.data?.message ||
        'Unable to update requirement progress.'
    )
  }
}


const handleInternalNoteSubmit = async (event) => {
  event.preventDefault()

  const content = internalNoteForm.content.trim()

  if (!content) {
    setInternalNotesError(
      'Please enter the internal note content.'
    )
    return
  }

  try {
    setSavingInternalNote(true)
    setInternalNotesError('')

    await api.post(
      `/tenders/${id}/internal-notes`,
      {
        noteType: internalNoteForm.noteType,
        content,
      }
    )

    const response = await api.get(
      `/tenders/${id}/internal-notes`
    )

    setInternalNotes(response.data.notes || [])

    setInternalNoteForm({
      noteType: 'GENERAL_NOTE',
      content: '',
    })
  } catch (submitError) {
    setInternalNotesError(
      submitError.response?.data?.message ||
        'Unable to add internal note.'
    )
  } finally {
    setSavingInternalNote(false)
  }
}



const handleInternalNoteUpdate = async () => {
  if (!editingInternalNote) {
    return
  }

  const content = editingInternalNote.content?.trim()

  if (!content) {
    setInternalNotesError(
      'Internal note content cannot be empty.'
    )
    return
  }

  try {
    setSavingInternalNote(true)
    setInternalNotesError('')

    await api.put(
      `/tenders/${id}/internal-notes/${editingInternalNote.id}`,
      {
        noteType: editingInternalNote.note_type,
        content,
      }
    )

    const response = await api.get(
      `/tenders/${id}/internal-notes`
    )

    setInternalNotes(response.data.notes || [])
    setEditingInternalNote(null)
  } catch (updateError) {
    setInternalNotesError(
      updateError.response?.data?.message ||
        'Unable to update internal note.'
    )
  } finally {
    setSavingInternalNote(false)
  }
}



const handleSubmissionFormChange = (event) => {
  const { name, value } = event.target

  setSubmissionForm((current) => ({
    ...current,
    [name]: value,
  }))
}

const handleFinalSubmission = async () => {
  if (!submissionData?.readiness?.ready) {
    setSubmissionError(
      'Tender is not ready for final submission.'
    )
    return
  }

  const confirmed = window.confirm(
    'Confirm that this tender has been submitted to the client/issuing authority?'
  )

  if (!confirmed) {
    return
  }

  try {
    setSubmittingTender(true)
    setSubmissionError('')

    const response = await api.patch(
      `/tenders/${id}/submission`,
      {
        submissionMethod:
          submissionForm.submissionMethod,
        submissionLocation:
          submissionForm.submissionLocation,
        submissionReference:
          submissionForm.submissionReference,
        submissionNotes:
          submissionForm.submissionNotes,
      }
    )

    const updatedTender = response.data.data

    setTender((current) => ({
      ...current,
      ...updatedTender,
      status: 'SUBMITTED',
    }))

    // Reload the authoritative submission information
    const refreshed = await api.get(
      `/tenders/${id}/submission`
    )

    setSubmissionData(refreshed.data)

    setSubmissionForm({
      submissionMethod:
        refreshed.data.tender?.submission_method || '',
      submissionLocation:
        refreshed.data.tender?.submission_location || '',
      submissionReference:
        refreshed.data.tender?.submission_reference || '',
      submissionNotes:
        refreshed.data.tender?.submission_notes || '',
    })
  } catch (submitError) {
    setSubmissionError(
      submitError.response?.data?.message ||
        'Unable to mark tender as submitted.'
    )
  } finally {
    setSubmittingTender(false)
  }
}


const handleInternalNoteDelete = async (note) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this internal note?'
  )

  if (!confirmed) {
    return
  }

  try {
    setInternalNotesError('')

    await api.delete(
      `/tenders/${id}/internal-notes/${note.id}`
    )

    setInternalNotes((current) =>
      current.filter(
        (currentNote) => currentNote.id !== note.id
      )
    )

    if (editingInternalNote?.id === note.id) {
      setEditingInternalNote(null)
    }
  } catch (deleteError) {
    setInternalNotesError(
      deleteError.response?.data?.message ||
        'Unable to delete internal note.'
    )
  }
}

    if (error || !tender) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-800">
                Unable to open workspace
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error ||
                  'Tender information is unavailable.'}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(tenderListPath)
                }
                className="mt-4 text-sm font-semibold text-red-700 underline"
              >
                Back to Tender Management
              </button>
            </div>
          </div>
        </div>
      )
    }

    const assignments =
      tender.assignments || []

    const activeTabItem = tabs.find(
      (tab) => tab.id === activeTab
    )

    const ActiveTabIcon =
      activeTabItem?.icon || LayoutDashboard

    return (
      <div className="mx-auto max-w-7xl pb-10">
        <button
          type="button"
          onClick={() => navigate(tenderListPath)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#6B3A98]"
        >
          <ArrowLeft size={17} />
          Back to Tender Management
        </button>

        {/* Tender Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative px-5 py-6 sm:px-7">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#6B3A98]" />

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6B3A98]">
                  Tender Workspace
                </p>

                <h1 className="mt-2 break-words text-2xl font-bold text-slate-950 sm:text-3xl">
                  {tender.title}
                </h1>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  {tender.reference_no}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
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

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      priorityStyles[
                        tender.priority
                      ] ||
                      'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tender.priority}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      resultStyles[
                        tender.result
                      ] ||
                      'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tender.result || 'PENDING'}
                  </span>
                </div>
              </div>

              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 lg:w-auto lg:min-w-[280px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-500">
                    Overall Progress
                  </span>

                  <span className="text-lg font-bold text-[#6B3A98]">
                    {tender.progress || 0}%
                  </span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#6B3A98]"
                    style={{
                      width: `${Math.min(
                        Number(
                          tender.progress || 0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Progress is currently based on the
                  existing tender value. Later it will
                  be calculated from requirements and
                  task completion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-1">
           {tabs
  .filter((tab) => {
    // Employee: hide Review & Approval and Submission
    if (
      user?.role === 'EMPLOYEE' &&
      ['review', 'submission'].includes(tab.id)
    ) {
      return false
    }

    // Manager: hide only Submission
    if (
      user?.role === 'MANAGER' &&
      tab.id === 'submission'
    ) {
      return false
    }

    return true
  })
  .map((tab) => {
    const Icon = tab.icon
    const selected = activeTab === tab.id

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => setActiveTab(tab.id)}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          selected
            ? 'bg-[#6B3A98] text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
        }`}
      >
        <Icon size={16} />
        {tab.label}
      </button>
    )
  })}
          </div>
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="mt-6 space-y-6">

           
     
            {/* KPI placeholders */}
           {/* Tender Overview KPIs */}
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

  {/* Requirements */}
  <button
    type="button"
    onClick={() => setActiveTab('requirements')}
    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#6B3A98]/40 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">
        Requirements
      </p>

      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
        <ClipboardCheck size={18} />
      </div>
    </div>

    <p className="mt-3 text-2xl font-bold text-slate-950">
      {requirementSummary.completed} / {requirementSummary.total}
    </p>

    <p className="mt-1 text-xs font-medium text-slate-500">
      {requirementSummary.total > 0
        ? `${Math.round(
            (requirementSummary.completed /
              requirementSummary.total) *
              100
          )}% completed`
        : 'No requirements added'}
    </p>

    {requirementSummary.overdue > 0 && (
      <p className="mt-2 text-xs font-semibold text-red-600">
        {requirementSummary.overdue} overdue
      </p>
    )}
  </button>


  {/* Compliance */}
  <button
    type="button"
    onClick={() => setActiveTab('compliance')}
    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#6B3A98]/40 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">
        Compliance
      </p>

      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
        <ShieldCheck size={18} />
      </div>
    </div>

    <p className="mt-3 text-2xl font-bold text-slate-950">
      {complianceSummary.completed} /{' '}
      {Math.max(
        complianceSummary.total -
          complianceSummary.notApplicable,
        0
      )}
    </p>

    <p className="mt-1 text-xs font-medium text-slate-500">
      {complianceSummary.total -
        complianceSummary.notApplicable >
      0
        ? `${complianceReadiness}% ready`
        : 'No compliance items added'}
    </p>

    {complianceSummary.overdue > 0 && (
      <p className="mt-2 text-xs font-semibold text-red-600">
        {complianceSummary.overdue} overdue
      </p>
    )}
  </button>


  {/* Team */}
  {/* <button
    type="button"
    onClick={() => setActiveTab('team')}
    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#6B3A98]/40 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">
        Team Members
      </p>

      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
        <Users size={18} />
      </div>
    </div>

    <p className="mt-3 text-2xl font-bold text-slate-950">
      {assignments.length}
    </p>

    <p className="mt-1 text-xs font-medium text-slate-500">
      {assignments.length === 1
        ? '1 employee assigned'
        : `${assignments.length} employees assigned`}
    </p>
  </button> */}


  {/* Documents */}
  <button
    type="button"
    onClick={() => setActiveTab('documents')}
    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#6B3A98]/40 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">
        Documents
      </p>

      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
        <Files size={18} />
      </div>
    </div>

    <p className="mt-3 text-2xl font-bold text-slate-950">
      {documentSummary.total}
    </p>

    <p className="mt-1 text-xs font-medium text-slate-500">
      {documentSummary.total === 1
        ? '1 document uploaded'
        : `${documentSummary.total} documents uploaded`}
    </p>
    </button>

  {/* Tender Submission Status */}
  <button
    type="button"
    onClick={() => setActiveTab('submission')}
    className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
      tender?.status === 'SUBMITTED'
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-slate-200 bg-white hover:border-[#6B3A98]/40'
    }`}
  >
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">
        Tender Status
      </p>

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          tender?.status === 'SUBMITTED'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-purple-50 text-[#6B3A98]'
        }`}
      >
        {tender?.status === 'SUBMITTED' ? (
          <CircleCheckBig size={18} />
        ) : (
          <Send size={18} />
        )}
      </div>
    </div>

    <p
      className={`mt-3 text-xl font-bold ${
        tender?.status === 'SUBMITTED'
          ? 'text-emerald-700'
          : 'text-slate-950'
      }`}
    >
      {tender?.status === 'SUBMITTED'
        ? 'Tender Completed'
        : 'In Progress'}
    </p>

    <p className="mt-1 text-xs font-medium text-slate-500">
      {tender?.status === 'SUBMITTED'
        ? 'Tender has been submitted'
        : 'Final submission pending'}
    </p>
  </button>

</div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Tender Information */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <h2 className="font-bold text-slate-950">
                    Tender Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Core tender details and commercial
                    information.
                  </p>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <InfoItem
                    icon={Building2}
                    label="Company"
                    value={
                      tender.company_name ||
                      'No company selected'
                    }
                  />

                  <InfoItem
                    label="Client / Authority"
                    value={
                      tender.client_name || '—'
                    }
                  />

                  <InfoItem
                    label="Category"
                    value={
                      tender.category || '—'
                    }
                  />

                  <InfoItem
                    label="Tender Value"
                    value={formatCurrency(
                      tender.tender_value
                    )}
                  />
                </div>

                {tender.description && (
                  <div className="border-t border-slate-100 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Scope / Description
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {tender.description}
                    </p>
                  </div>
                )}
              </section>

              {/* Deadlines */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <h2 className="font-bold text-slate-950">
                    Deadlines & Submission
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Official closing information and
                    internal preparation deadline.
                  </p>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <InfoItem
                    icon={CalendarDays}
                    label="Start Date"
                    value={formatDate(
                      tender.start_date
                    )}
                  />

                  <InfoItem
                    icon={CalendarDays}
                    label="Tender Closing Date"
                    value={formatDate(
                      tender.deadline
                    )}
                  />

                  <InfoItem
                    label="Closing Time"
                    value={formatTime(
                      tender.closing_time
                    )}
                  />

                  <InfoItem
                    label="Internal Deadline"
                    value={formatDateTime(
                      tender.internal_deadline
                    )}
                  />

                  <InfoItem
                    label="Submission Method"
                    value={
                      tender.submission_method ||
                      '—'
                    }
                  />

                  <InfoItem
                    label="Submission Location"
                    value={
                      tender.submission_location ||
                      '—'
                    }
                  />
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Responsibility */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <h2 className="font-bold text-slate-950">
                    Responsibility
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Internal ownership and currently
                    assigned employees.
                  </p>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B3A98]">
                      Internal Tender Owner
                    </p>

                    <p className="mt-2 font-semibold text-slate-900">
                      {tender.internal_owner_name ||
                        'Not assigned'}
                    </p>

                    {tender.internal_owner_email && (
                      <p className="mt-1 text-sm text-slate-500">
                        {
                          tender.internal_owner_email
                        }
                      </p>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Assigned Team
                    </p>

                    {assignments.length === 0 ? (
                      <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-5 text-center">
                        <Users
                          size={22}
                          className="mx-auto text-slate-400"
                        />

                        <p className="mt-2 text-sm font-medium text-slate-600">
                          No employees assigned yet.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {assignments.map(
                          (assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6B3A98] text-sm font-bold text-white">
                                {assignment.employee_name
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {
                                    assignment.employee_name
                                  }
                                </p>

                                <p className="truncate text-xs text-slate-400">
                                  {assignment.department ||
                                    'Employee'}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Workspace Status */}
            {/* Readiness & Attention */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <h2 className="font-bold text-slate-950">
                    Readiness & Attention
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Current preparation status and items requiring attention.
                  </p>
                </div>

                <div className="space-y-5 p-5 sm:p-6">

                  {/* Requirements */}
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-slate-700">
                        Requirements
                      </span>

                      <span className="text-sm font-bold text-[#6B3A98]">
                        {requirementSummary.total > 0
                          ? Math.round(
                              (requirementSummary.completed /
                                requirementSummary.total) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#6B3A98] transition-all"
                        style={{
                          width: `${
                            requirementSummary.total > 0
                              ? Math.round(
                                  (requirementSummary.completed /
                                    requirementSummary.total) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Compliance */}
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-slate-700">
                        Compliance
                      </span>

                      <span className="text-sm font-bold text-[#2F8CC9]">
                        {complianceReadiness}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#2F8CC9] transition-all"
                        style={{
                          width: `${Math.min(
                            Number(complianceReadiness || 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Attention Items */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('requirements')}
                      className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
                        requirementSummary.overdue > 0
                          ? 'border-red-200 bg-red-50'
                          : 'border-emerald-200 bg-emerald-50'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Overdue Requirements
                      </p>

                      <p
                        className={`mt-2 text-xl font-bold ${
                          requirementSummary.overdue > 0
                            ? 'text-red-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {requirementSummary.overdue}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('compliance')}
                      className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
                        complianceSummary.overdue > 0
                          ? 'border-red-200 bg-red-50'
                          : 'border-emerald-200 bg-emerald-50'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Overdue Compliance
                      </p>

                      <p
                        className={`mt-2 text-xl font-bold ${
                          complianceSummary.overdue > 0
                            ? 'text-red-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {complianceSummary.overdue}
                      </p>
                    </button>
                  </div>

                  {/* Workflow Status */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Workflow Status
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Manager Review
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Not Started
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Final Approval
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Not Started
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Submission
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Not Submitted
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            </div>

            {/* Recent Activity */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="font-bold text-slate-950">
                  Recent Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest changes made in this tender workspace.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                {activitiesLoading ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading recent activity...
                    </p>
                  </div>
                ) : activityError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">
                      {activityError}
                    </p>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center">
                    <Clock3
                      size={24}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No activity has been recorded for this tender yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[#6B3A98]">
                          <Clock3 size={17} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <p className="text-sm font-semibold leading-6 text-slate-800">
                              {activity.title}
                            </p>

                            <p className="shrink-0 text-xs text-slate-400">
                              {formatActivityDateTime(
                                activity.createdAt
                              )}
                            </p>
                          </div>

                          {activity.subtitle && (
                            <p className="mt-1 text-sm text-slate-500">
                              {activity.subtitle}
                            </p>
                          )}

                          {activity.changes.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {activity.changes.map(
                                (changeItem, index) => (
                                  <div
                                    key={`${activity.id}-change-${index}`}
                                    className="rounded-lg bg-slate-50 px-3 py-2"
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                      {changeItem.label}
                                    </p>

                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                      <span className="text-slate-500">
                                        {changeItem.previous}
                                      </span>

                                      <span className="font-semibold text-slate-400">
                                        →
                                      </span>

                                      <span className="font-semibold text-slate-800">
                                        {changeItem.next}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {activity.messages.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {activity.messages.map(
                                (message, index) => (
                                  <p
                                    key={`${activity.id}-message-${index}`}
                                    className="text-sm text-slate-500"
                                  >
                                    {message}
                                  </p>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>
        )}

        {/* Requirements */}
  {activeTab === 'requirements' && (
    <div className="mt-6 space-y-6">
      {/* Requirements Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
            Tender Requirements
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Requirements & Responsibility
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Track everything required for this tender,
            assign responsibility and monitor completion.
          </p>
        </div>

        {['ADMIN'].includes(user?.role) && (
          <button
            type="button"
            onClick={openCreateRequirement}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182]"
          >
            <Plus size={17} />
            Add Requirement
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Requirements
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {requirementSummary.total}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
              <ClipboardCheck size={21} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {requirementSummary.mandatory} mandatory
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Completed
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {requirementSummary.completed}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CircleCheckBig size={21} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Requirements completed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                In Progress
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {requirementSummary.inProgress}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 size={21} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Currently being prepared
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Overdue
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {requirementSummary.overdue}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <CircleAlert size={21} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Requires attention
          </p>
        </div>
      </div>

      {/* Error */}
      {requirementError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {requirementError}
        </div>
      )}

      {/* Requirements List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-950">
                Requirement Register
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {requirements.length} active requirement
                {requirements.length === 1 ? '' : 's'}
              </p>
            </div>

            {user?.role === 'CEO' && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                View Only
              </span>
            )}
          </div>
        </div>

        {requirementsLoading ? (
          <div className="p-10 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />

            <p className="mt-3 text-sm text-slate-500">
              Loading requirements...
            </p>
          </div>
        ) : requirements.length === 0 ? (
          <div className="p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#6B3A98]">
              <ClipboardCheck size={25} />
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              No requirements added yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add the mandatory, technical, financial,
              qualification and other requirements from the
              tender documents.
            </p>

            {['ADMIN'].includes(user?.role) && (
              <button
                type="button"
                onClick={openCreateRequirement}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={17} />
                Add First Requirement
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requirements.map((requirement) => {
              const linkedDocuments =
                getRequirementDocuments(requirement.id)

              const sourceDocuments = linkedDocuments.filter(
                (document) =>
                  document.document_type === 'ORIGINAL_TENDER'
              )

              const evidenceDocuments = linkedDocuments.filter(
                (document) =>
                  document.document_type === 'INTERNAL_SUBMISSION'
              )

              return (
              <div
                key={requirement.id}
                className="p-5 transition hover:bg-slate-50/60 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6B3A98]">
                        {requirement.category ||
                          'OTHER'}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          requirementStatusStyles[
                            requirement.status
                          ] ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {requirementStatusLabels[
                          requirement.status
                        ] || requirement.status}
                      </span>

                      {requirement.review_status && (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
      reviewStatusStyles[
        requirement.review_status
      ] ||
      'bg-slate-100 text-slate-600'
    }`}
  >
    {reviewStatusLabels[
      requirement.review_status
    ] ||
      requirement.review_status.replaceAll(
        '_',
        ' '
      )}
  </span>
)}

                      {Number(
                        requirement.is_mandatory
                      ) === 1 && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                          Mandatory
                        </span>
                      )}
                      {user?.role === 'EMPLOYEE' &&
                      Number(requirement.assigned_user_id) === Number(user.id) && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-[#6B3A98]">
                          My Responsibility
                        </span>
                      )}              
                      
                    </div>
                     

                   {['ADMIN', 'CEO', 'MANAGER', 'EMPLOYEE'].includes(user?.role) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          ['NOT_STARTED', 'Not Started'],
                          ['IN_PROGRESS', 'In Progress'],
                          ['COMPLETED', 'Completed'],
                        ].map(([status, label]) => (
                          <button
                            key={status}
                            type="button"
                            disabled={requirement.status === status}
                            onClick={() =>
                              handleEmployeeRequirementStatusChange(
                                requirement,
                                status
                              )
                            }
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                              requirement.status === status
                                ? 'border-[#6B3A98] bg-purple-50 text-[#6B3A98]'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-[#6B3A98] hover:text-[#6B3A98]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}

                    <h4 className="mt-3 text-base font-bold text-slate-900">
                      {requirement.title}
                    </h4>

                    {requirement.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {requirement.description}
                      </p>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Responsible
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {requirement.assigned_user_name ||
                            'Not assigned'}
                        </p>
                      </div> */}

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Due Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(
                            requirement.due_date
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Created By
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {requirement.created_by_name ||
                            '—'}
                        </p>
                      </div>
                    </div>

                    {requirement.status ===
                      'COMPLETED' && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-emerald-700">
                        <CircleCheckBig size={15} />

                        <span>
                          Completed
                          {requirement.completed_by_name
                            ? ` by ${requirement.completed_by_name}`
                            : ''}
                          {requirement.completed_at
                            ? ` on ${formatDateTime(
                                requirement.completed_at
                              )}`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>

                 {['ADMIN'].includes(user?.role) && (
                    <div className="flex shrink-0 gap-2">
                      <button
                      type="button"
                      onClick={() =>
                          openEditRequirement(requirement)
                      }
                      title="Edit requirement"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#6B3A98]/30 hover:bg-purple-50 hover:text-[#6B3A98]"
                      >
                      <Pencil size={16} />
                      </button>
                      <button
                      type="button"
                      onClick={() =>
                          handleRemoveRequirement(requirement)
                      }
                      title="Remove requirement"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                      <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Requirement Document Actions */}
<div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
  {['ADMIN'].includes(user?.role) && (
    <button
      type="button"
      onClick={() =>
        openRequirementDocumentUpload(
          requirement,
          'ORIGINAL_TENDER'
        )
      }
      className="inline-flex items-center gap-2 rounded-xl border border-[#6B3A98]/20 bg-purple-50 px-3 py-2 text-xs font-bold text-[#6B3A98] transition hover:bg-purple-100"
    >
      <Upload size={14} />
      Add Source Document
    </button>
  )}

{['ADMIN', 'CEO', 'MANAGER', 'EMPLOYEE'].includes(user?.role) && (
      <button
        type="button"
        onClick={() =>
          openRequirementDocumentUpload(
            requirement,
            'INTERNAL_SUBMISSION'
          )
        }
        className="inline-flex items-center gap-2 rounded-xl bg-[#6B3A98] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#5a3181]"
      >
        <Upload size={14} />
        Upload Evidence
      </button>
    )}
</div>

                {/* Linked Requirement Documents */}
<div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2">
  {/* Source / Reference Documents */}
  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <div className="flex items-center gap-2">
      <FileText size={16} className="text-[#6B3A98]" />

      <p className="text-sm font-bold text-slate-800">
        Source / Reference Documents
      </p>
    </div>

    {sourceDocuments.length === 0 ? (
      <p className="mt-3 text-sm text-slate-400">
        No source documents linked.
      </p>
    ) : (
      <div className="mt-3 space-y-2">
        {sourceDocuments.map((document) => (
          <div
            key={document.id}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <p className="break-words text-sm font-semibold text-slate-800">
              {document.title}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {document.file_name}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {['application/pdf', 'image/jpeg', 'image/png'].includes(
                document.mime_type
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    handlePreviewDocument(document)
                  }
                  disabled={
                    previewingDocumentId === document.id
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B3A98] hover:underline disabled:opacity-50"
                >
                  <Eye size={14} />
                  {previewingDocumentId === document.id
                    ? 'Opening...'
                    : 'Preview'}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleDownloadDocument(document)
                }
                disabled={
                  downloadingDocumentId === document.id
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 disabled:opacity-50"
              >
                <Download size={14} />
                {downloadingDocumentId === document.id
                  ? 'Downloading...'
                  : 'Download'}
              </button>

              {['ADMIN'].includes(user?.role) && (
  <>
    <button
      type="button"
      onClick={() => openEditDocument(document)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B3A98] hover:underline"
    >
      <Pencil size={14} />
      Edit
    </button>

    <button
      type="button"
      onClick={() => handleRemoveDocument(document)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
    >
      <Trash2 size={14} />
      Delete
    </button>
  </>
)}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Evidence / Submission Documents */}
  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <div className="flex items-center gap-2">
      <FileCheck2 size={16} className="text-[#6B3A98]" />

      <p className="text-sm font-bold text-slate-800">
        Evidence / Submission
      </p>
    </div>

    {evidenceDocuments.length === 0 ? (
      <p className="mt-3 text-sm text-slate-400">
        No evidence uploaded yet.
      </p>
    ) : (
      <div className="mt-3 space-y-2">
        {evidenceDocuments.map((document) => (
          <div
            key={document.id}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <p className="break-words text-sm font-semibold text-slate-800">
              {document.title}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {document.file_name}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {['application/pdf', 'image/jpeg', 'image/png'].includes(
                document.mime_type
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    handlePreviewDocument(document)
                  }
                  disabled={
                    previewingDocumentId === document.id
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B3A98] hover:underline disabled:opacity-50"
                >
                  <Eye size={14} />
                  {previewingDocumentId === document.id
                    ? 'Opening...'
                    : 'Preview'}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleDownloadDocument(document)
                }
                disabled={
                  downloadingDocumentId === document.id
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 disabled:opacity-50"
              >
                <Download size={14} />

                {downloadingDocumentId === document.id
                  ? 'Downloading...'
                  : 'Download'}
              </button>


              {['ADMIN', 'MANAGER','CEO','EMPLOYEE'].includes(user?.role) && (
  <>
    <button
      type="button"
      onClick={() => openEditDocument(document)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B3A98] hover:underline"
    >
      <Pencil size={14} />
      Edit
    </button>

    <button
      type="button"
      onClick={() => handleRemoveDocument(document)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
    >
      <Trash2 size={14} />
      Delete
    </button>
  </>
)}

             {user?.role === 'EMPLOYEE' &&
        Number(requirement.assigned_user_id) ===
        Number(user.id) &&
        Number(document.uploaded_by) ===
    Number(user.id) && (
    <>
      <button
        type="button"
        onClick={() => openEditDocument(document)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B3A98] hover:underline"
      >
        <Pencil size={14} />
        Edit
      </button>

      <button
        type="button"
        onClick={() => handleRemoveDocument(document)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </>
  )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
               </div>
              )
              })}
          </div>
        )}
      </section>

      
    </div>
  )}



  {/* Compliance */}
  {activeTab === 'compliance' && (
    <div className="mt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
            Tender Compliance
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Compliance Checklist
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Track registration, tax, certificates, declarations,
            technical documents and other compliance obligations
            required before tender submission.
          </p>
        </div>

     {['ADMIN'].includes(user?.role) && (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={openCreateComplianceItem}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-[#6B3A98] transition hover:bg-purple-50"
      >
        <Plus size={17} />
        Add Compliance Item
      </button>

      <button
        type="button"
        onClick={openComplianceTemplateModal}
        disabled={applyingComplianceTemplate}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShieldCheck size={17} />

        {applyingComplianceTemplate
          ? 'Applying...'
          : 'Apply Standard Template'}
      </button>
    </div>
  )}
      </div>

      {/* Summary */}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Items
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {complianceSummary.total}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {complianceSummary.mandatory} mandatory
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {complianceSummary.completed}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Compliance items completed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            In Progress
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-700">
            {complianceSummary.inProgress}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Currently being prepared
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Overdue
          </p>

          <p className="mt-2 text-3xl font-bold text-red-700">
            {complianceSummary.overdue}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Requires attention
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">
      Readiness
    </p>

    <div className="mt-2 flex items-end justify-between gap-3">
      <p className="text-3xl font-bold text-[#6B3A98]">
        {complianceReadiness}%
      </p>

      <ShieldCheck
        size={23}
        className="text-[#6B3A98]"
      />
    </div>

    <div className="mt-4 h-2 overflow-hidden rounded-full bg-purple-100">
      <div
        className="h-full rounded-full bg-[#6B3A98] transition-all duration-300"
        style={{
          width: `${complianceReadiness}%`,
        }}
      />
    </div>

    <p className="mt-2 text-xs text-slate-400">
      Applicable items completed
    </p>
  </div>
      </div>

      {/* Error */}
      {complianceError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {complianceError}
        </div>
      )}

      {/* Checklist */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-950">
                Compliance Register
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {complianceItems.length} active compliance{' '}
                {complianceItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>

            {user?.role === 'CEO' && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                View Only
              </span>
            )}
          </div>
        </div>

        {complianceLoading ? (
          <div className="p-10 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />

            <p className="mt-3 text-sm text-slate-500">
              Loading compliance checklist...
            </p>
          </div>
        ) : complianceItems.length === 0 ? (
          <div className="p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#6B3A98]">
              <ShieldCheck size={25} />
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              No compliance items yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Apply the standard compliance template to start with
              the common tender compliance requirements.
            </p>

            {['ADMIN'].includes(user?.role) && (
              <button
                type="button"
                onClick={openComplianceTemplateModal}
                disabled={applyingComplianceTemplate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                <ShieldCheck size={17} />

                {applyingComplianceTemplate
                  ? 'Applying...'
                  : 'Apply Standard Template'}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complianceItems.map((item) => {
  const linkedDocuments =
    getComplianceDocuments(item.id)

  const sourceDocuments = linkedDocuments.filter(
    (document) =>
      document.document_type === 'ORIGINAL_TENDER'
  )

  const evidenceDocuments = linkedDocuments.filter(
    (document) =>
      document.document_type === 'INTERNAL_SUBMISSION'
  )


  

  return (
    <div
      key={item.id}
      className="p-5 transition hover:bg-slate-50/60 sm:p-6"
    >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6B3A98]">
                        {item.category || 'OTHER'}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          requirementStatusStyles[item.status] ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {requirementStatusLabels[item.status] ||
                          item.status}
                      </span>
                      

                      {item.review_status && (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
      reviewStatusStyles[
        item.review_status
      ] ||
      'bg-slate-100 text-slate-600'
    }`}
  >
    {reviewStatusLabels[
      item.review_status
    ] ||
      item.review_status.replaceAll(
        '_',
        ' '
      )}
  </span>
)}
      

                      {Number(item.is_mandatory) === 1 && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                          Mandatory
                        </span>
                      )}

                      {item.source_template_item_id && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                          Standard Template
                        </span>
                      )}

                      {user?.role === 'EMPLOYEE' &&
                    Number(item.assigned_user_id) === Number(user.id) && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-[#6B3A98]">
                        My Responsibility
                      </span>
                    )}
                    </div>



      {['ADMIN', 'CEO', 'MANAGER', 'EMPLOYEE'].includes(user?.role) && (
    <div className="mt-3 flex flex-wrap gap-2">
      {[
        ['NOT_STARTED', 'Not Started'],
        ['IN_PROGRESS', 'In Progress'],
        ['COMPLETED', 'Completed'],
      ].map(([status, label]) => (
        <button
          key={status}
          type="button"
          disabled={item.status === status}
          onClick={() =>
            handleEmployeeComplianceStatusChange(
              item,
              status
            )
          }
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            item.status === status
              ? 'border-[#6B3A98] bg-purple-50 text-[#6B3A98]'
              : 'border-slate-200 bg-white text-slate-600 hover:border-[#6B3A98] hover:text-[#6B3A98]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )}

                    <h4 className="mt-3 text-base font-bold text-slate-900">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Responsible
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {item.assigned_user_name ||
                            'Not assigned'}
                        </p>
                      </div> */}

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Due Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(item.due_date)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Notes
                        </p>

                        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                          {item.notes || '—'}
                        </p>
                      </div>
                    </div>



                    {/* Compliance Document Actions */}
<div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
  {['ADMIN'].includes(user?.role) && (
    <button
      type="button"
      onClick={() =>
        openComplianceDocumentUpload(
          item,
          'ORIGINAL_TENDER'
        )
      }
      className="inline-flex items-center gap-2 rounded-lg border border-[#6B3A98] px-3 py-2 text-xs font-semibold text-[#6B3A98] transition hover:bg-purple-50"
    >
      <Upload size={14} />
      Add Source Document
    </button>
  )}

{['ADMIN', 'CEO', 'MANAGER', 'EMPLOYEE'].includes(user?.role) && (
      <button
        type="button"
        onClick={() =>
          openComplianceDocumentUpload(
            item,
            'INTERNAL_SUBMISSION'
          )
        }
        className="inline-flex items-center gap-2 rounded-lg bg-[#6B3A98] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5a3182]"
      >
        <Upload size={14} />
        Upload Evidence
      </button>
    )}
</div>


                    {/* Linked Compliance Documents */}
<div className="mt-5 grid gap-4 lg:grid-cols-2">
  {/* Source / Reference Documents */}
  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="flex items-center gap-2">
      <FileText
        size={16}
        className="text-[#6B3A98]"
      />

      <h5 className="text-sm font-bold text-slate-900">
        Source / Reference Documents
      </h5>
    </div>

    {sourceDocuments.length === 0 ? (
      <p className="mt-3 text-xs text-slate-400">
        No source documents linked.
      </p>
    ) : (
      <div className="mt-3 space-y-3">
        {sourceDocuments.map((document) => (
          <div
            key={document.id}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <p className="break-words text-sm font-semibold text-slate-800">
              {document.title}
            </p>

            <p className="mt-1 break-all text-xs text-slate-400">
              {document.file_name}
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              {['application/pdf', 'image/jpeg', 'image/png'].includes(
                document.mime_type
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    handlePreviewDocument(document)
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F8CC9] hover:underline"
                >
                  <Eye size={14} />
                  Preview
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleDownloadDocument(document)
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <Download size={14} />
                Download
              </button>

              {['ADMIN'].includes(user?.role) && (
                <>
                  <button
                    type="button"
                    onClick={() => openEditDocument(document)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B3A98] hover:underline"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(document)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Evidence / Submission */}
  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="flex items-center gap-2">
      <FileCheck2
        size={16}
        className="text-emerald-600"
      />

      <h5 className="text-sm font-bold text-slate-900">
        Evidence / Submission
      </h5>
    </div>

    {evidenceDocuments.length === 0 ? (
      <p className="mt-3 text-xs text-slate-400">
        No evidence uploaded.
      </p>
    ) : (
      <div className="mt-3 space-y-3">
        {evidenceDocuments.map((document) => (
          <div
            key={document.id}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <p className="break-words text-sm font-semibold text-slate-800">
              {document.title}
            </p>

            <p className="mt-1 break-all text-xs text-slate-400">
              {document.file_name}
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              {['application/pdf', 'image/jpeg', 'image/png'].includes(
                document.mime_type
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    handlePreviewDocument(document)
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F8CC9] hover:underline"
                >
                  <Eye size={14} />
                  Preview
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleDownloadDocument(document)
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <Download size={14} />
                Download
              </button>

              {['ADMIN', 'MANAGER','CEO','EMPLOYEE'].includes(user?.role) && (
  <>
    <button
      type="button"
      onClick={() => openEditDocument(document)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B3A98] hover:underline"
    >
      <Pencil size={14} />
      Edit
    </button>

    <button
      type="button"
      onClick={() => handleRemoveDocument(document)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
    >
      <Trash2 size={14} />
      Delete
    </button>
  </>
)}

{user?.role === 'EMPLOYEE' &&
  Number(item.assigned_user_id) ===
    Number(user.id) &&
  Number(document.uploaded_by) ===
    Number(user.id) && (
    <>
      <button
        type="button"
        onClick={() => openEditDocument(document)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B3A98] hover:underline"
      >
        <Pencil size={14} />
        Edit
      </button>

      <button
        type="button"
        onClick={() => handleRemoveDocument(document)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </>
  )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

                    {/* {['ADMIN', 'MANAGER'].includes(user?.role) && (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          handleQuickComplianceStatus(
            item,
            'NOT_STARTED'
          )
        }
        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
          item.status === 'NOT_STARTED'
            ? 'border-slate-400 bg-slate-100 text-slate-800'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        Not Started
      </button>

      <button
        type="button"
        onClick={() =>
          handleQuickComplianceStatus(
            item,
            'IN_PROGRESS'
          )
        }
        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
          item.status === 'IN_PROGRESS'
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-slate-200 text-slate-500 hover:bg-blue-50'
        }`}
      >
        In Progress
      </button>

      <button
        type="button"
        onClick={() =>
          handleQuickComplianceStatus(
            item,
            'COMPLETED'
          )
        }
        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
          item.status === 'COMPLETED'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-slate-200 text-slate-500 hover:bg-emerald-50'
        }`}
      >
        Completed
      </button>

      <button
        type="button"
        onClick={() =>
          handleQuickComplianceStatus(
            item,
            'NOT_APPLICABLE'
          )
        }
        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
          item.status === 'NOT_APPLICABLE'
            ? 'border-slate-300 bg-slate-100 text-slate-600'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        N/A
      </button>
    </div>
  )} */}

                    {item.status === 'COMPLETED' && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-emerald-700">
                        <CircleCheckBig size={15} />

                        <span>
                          Completed
                          {item.completed_by_name
                            ? ` by ${item.completed_by_name}`
                            : ''}
                          {item.completed_at
                            ? ` on ${formatDateTime(
                                item.completed_at
                              )}`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {['ADMIN'].includes(user?.role) && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditComplianceItem(item)}
                        title="Edit compliance item"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#6B3A98]/30 hover:bg-purple-50 hover:text-[#6B3A98]"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveComplianceItem(item)}
                        title="Remove compliance item"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                 </div>
  )
})}
          </div>
        )}
      </section>
    </div>
  )}


  {showComplianceTemplateModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
            Compliance Template
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Apply Standard Compliance Template
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the compliance items required for this tender.
          </p>
        </div>


        

        <button
          type="button"
          onClick={() =>
            setShowComplianceTemplateModal(false)
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={18} />
        </button>
      </div>

      {/* Template name */}
      {complianceTemplate && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
          <p className="text-sm font-semibold text-slate-700">
            {complianceTemplate.name}
          </p>

          <button
            type="button"
            onClick={() => {
              const selectableIds = complianceTemplateItems
                .filter(
                  (item) => item.tender_state !== 'ACTIVE'
                )
                .map((item) => item.id)

              const allSelected =
                selectableIds.length > 0 &&
                selectableIds.every((itemId) =>
                  selectedComplianceTemplateIds.includes(itemId)
                )

              setSelectedComplianceTemplateIds(
                allSelected ? [] : selectableIds
              )
            }}
            className="text-sm font-semibold text-[#6B3A98] hover:underline"
          >
            {(() => {
              const selectableIds = complianceTemplateItems
                .filter(
                  (item) => item.tender_state !== 'ACTIVE'
                )
                .map((item) => item.id)

              const allSelected =
                selectableIds.length > 0 &&
                selectableIds.every((itemId) =>
                  selectedComplianceTemplateIds.includes(itemId)
                )

              return allSelected ? 'Clear Selection' : 'Select All'
            })()}
          </button>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="space-y-2">
          {complianceTemplateItems.map((item) => {
            const isActive =
              item.tender_state === 'ACTIVE'

            const checked =
                isActive ||
                selectedComplianceTemplateIds.includes(
                  item.id
                )

            return (
              <label
                key={item.id}
                className={`flex gap-3 rounded-xl border p-4 ${
                  isActive
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isActive}
                  onChange={(event) => {
                    const isChecked =
                      event.target.checked

                    setSelectedComplianceTemplateIds(
                      (current) =>
                        isChecked
                          ? [...current, item.id]
                          : current.filter(
                              (itemId) =>
                                itemId !== item.id
                            )
                    )
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#6B3A98]"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>

                    {isActive && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        Already added
                      </span>
                    )}

                    {item.tender_state ===
                      'ARCHIVED' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        Previously removed
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  )}
                </div>
              </label>
            )
          })}


          
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <button
          type="button"
          onClick={() =>
            setShowComplianceTemplateModal(false)
          }
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>

        

        <button
            type="button"
            onClick={handleApplyComplianceTemplate}
            disabled={
              applyingComplianceTemplate ||
              selectedComplianceTemplateIds.filter(
                (templateItemId) =>
                  complianceTemplateItems.some(
                    (item) =>
                      item.id === templateItemId &&
                      item.tender_state !== 'ACTIVE'
                  )
              ).length === 0
            }
            className="rounded-xl bg-[#6B3A98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applyingComplianceTemplate
              ? 'Applying...'
              : 'Apply Selected'}
          </button>
      </div>
    </div>
  </div>
)}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
                  Tender Documents
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Document Register & Evidence
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Keep original tender files separate from internal submission documents and link supporting evidence to requirements or compliance items.
                </p>
              </div>

              {['ADMIN'].includes(user?.role) && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    openCreateDocument('ORIGINAL_TENDER')
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182]"
                >
                  <Upload size={17} />
                  Upload Document
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ['Total Documents', documentSummary.total, Files],
                ['Original Tender', documentSummary.originalTender, FileText],
                ['Internal Submission', documentSummary.internalSubmission, FileCheck2],
                ['Requirement Evidence', documentSummary.requirementEvidence, ClipboardCheck],
                ['Compliance Evidence', documentSummary.complianceEvidence, ShieldCheck],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{label}</p>
                      <p className="mt-2 text-3xl font-bold text-slate-950">{value || 0}</p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {documentError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {documentError}
              </div>
            )}

            {documentsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />
                <p className="mt-3 text-sm text-slate-500">Loading documents...</p>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                {[
                  {
                    type: 'ORIGINAL_TENDER',
                    title: 'Original Tender Documents',
                    description: 'Government-issued tender files, specifications, forms and source documents.',
                    icon: FileText,
                  },
                  {
                    type: 'INTERNAL_SUBMISSION',
                    title: 'Internal Submission Documents',
                    description: 'Technical proposals, pricing schedules, certificates and prepared submission files.',
                    icon: FileCheck2,
                  },
                ].map((section) => {
                  const sectionDocuments = documents.filter(
                    (document) => document.document_type === section.type
                  )
                  const SectionIcon = section.icon

                  return (
                    <section key={section.type} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
                              <SectionIcon size={21} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-950">{section.title}</h3>
                              <p className="mt-1 text-sm leading-5 text-slate-500">{section.description}</p>
                              <p className="mt-2 text-xs font-semibold text-slate-400">
                                {sectionDocuments.length} document{sectionDocuments.length === 1 ? '' : 's'}
                              </p>
                            </div>
                          </div>

                          {(
                              ['ADMIN'].includes(user?.role) ||
                              (
                                 ['CEO', 'EMPLOYEE','MANAGER'].includes(user?.role) &&
                                section.type === 'INTERNAL_SUBMISSION'
                              )
                            ) && (
                              <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                openCreateDocument(section.type)
                              }}
                              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[#6B3A98]/30 px-3 py-2 text-sm font-semibold text-[#6B3A98] transition hover:bg-purple-50"
                            >
                              <Plus size={16} /> Upload
                            </button>
                          )}
                        </div>
                      </div>

                      {sectionDocuments.length === 0 ? (
                        <div className="p-8 text-center sm:p-10">
                          <Files size={28} className="mx-auto text-slate-300" />
                          <p className="mt-3 font-semibold text-slate-700">No documents uploaded</p>
                          <p className="mt-1 text-sm text-slate-500">Files added to this section will appear here.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {sectionDocuments.map((document) => (
                            <div key={document.id} className="p-5 transition hover:bg-slate-50/60 sm:p-6">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6B3A98]">
                                      {documentTypeLabels[document.document_type] || document.document_type}
                                    </span>
                                    {document.requirement_title && (
                                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        Requirement Evidence
                                      </span>
                                    )}
                                    {document.compliance_item_title && (
                                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        Compliance Evidence
                                      </span>
                                    )}

                                    {isEmployeeDocumentResponsibility(document) && (
                                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        My Responsibility
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="mt-3 break-words font-bold text-slate-900">{document.title}</h4>
                                  {document.description && (
                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{document.description}</p>
                                  )}

                                  <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <span className="font-semibold text-slate-700">File:</span>{' '}
                                      <span className="break-all">{document.file_name}</span>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <span className="font-semibold text-slate-700">Size:</span>{' '}
                                      {formatFileSize(document.file_size)}
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <span className="font-semibold text-slate-700">Uploaded by:</span>{' '}
                                      {document.uploaded_by_name || '—'}
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <span className="font-semibold text-slate-700">Uploaded:</span>{' '}
                                      {formatDateTime(document.created_at)}
                                    </div>
                                  </div>

                                  {(document.requirement_title || document.compliance_item_title) && (
                                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                      <span className="font-semibold text-slate-800">Linked to:</span>{' '}
                                      {document.requirement_title || document.compliance_item_title}
                                    </div>
                                  )}
                                </div>

                                <div className="flex shrink-0 gap-2">

                                  <button
                                    type="button"
                                    onClick={() => handlePreviewDocument(document)}
                                    disabled={previewingDocumentId === document.id}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[#6B3A98] hover:text-[#6B3A98] disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Preview document"
                                  >
                                    {previewingDocumentId === document.id ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#6B3A98]" />
                                    ) : (
                                      <Eye size={16} />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(document)}
                                    disabled={downloadingDocumentId === document.id}
                                    title="Download document"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#6B3A98]/30 hover:bg-purple-50 hover:text-[#6B3A98] disabled:opacity-50"
                                  >
                                    <Download size={16} />
                                  </button>

                                 {(
                                 
                                  isEmployeeDocumentResponsibility(document) ||
                                  (
                                    ['CEO', 'MANAGER','EMPLOYEE'].includes(user?.role) &&
                                    document.document_type === 'INTERNAL_SUBMISSION'
                                  )
                                ) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openEditDocument(document)}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-[#6B3A98] transition hover:border-purple-200 hover:bg-purple-50"
                                        title="Edit document"
                                      >
                                        <Pencil size={17} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDocument(document)}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
                                        title="Delete document"
                                      >
                                        <Trash2 size={17} />
                                      </button>
                                    </>
                                  )}
                                  {['ADMIN'].includes(user?.role) && (

                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openEditDocument(document)}
                                        title="Edit document information"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#6B3A98]/30 hover:bg-purple-50 hover:text-[#6B3A98]"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDocument(document)}
                                        title="Remove document"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        )}





        {/* Team */}
  {activeTab === 'team' && (
    <div className="mt-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
            Tender Team
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Team Assignment
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            View the employees currently assigned to this
            tender and manage tender responsibilities.
          </p>
          {['ADMIN', 'MANAGER'].includes(user?.role) && (
    <div className="border-b border-slate-100 bg-slate-50/60 p-5 sm:p-6">
      <label className="text-sm font-semibold text-slate-700">
        Add Employee to Tender Team
      </label>

      <select
        value={selectedTeamEmployeeId}
        onChange={(event) =>
          setSelectedTeamEmployeeId(event.target.value)
        }
        disabled={teamLoading}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#6B3A98] sm:max-w-md"
      >

        

        
        <option value="">
          {teamLoading
            ? 'Loading employees...'
            : 'Select an employee'}
        </option>

      {assignableEmployees
      .filter(
        (employee) =>
          !assignments.some(
            (assignment) =>
              Number(assignment.user_id) ===
              Number(employee.id)
          )
      )
      .map((employee) => (
        <option
          key={employee.id}
          value={employee.id}
        >
          {employee.name}
        </option>
      ))}
      </select>

      <button
        type="button"
        onClick={handleAssignTeamEmployee}
        disabled={
          !selectedTeamEmployeeId ||
          assigningTeamEmployee
        }
        className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={17} />

        {assigningTeamEmployee
          ? 'Assigning...'
          : 'Assign Employee'}
      </button>

            {teamError && (
              <p className="mt-2 text-sm font-medium text-red-600">
                {teamError}
              </p>
            )}
          </div>
        )}
        </div>

        <div className="p-5 sm:p-6">
          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <Users
                size={28}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-3 font-bold text-slate-800">
                No team members assigned
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Employees assigned to this tender will
                appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6B3A98] font-bold text-white">
                      {assignment.employee_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {assignment.employee_name}
                      </p>

                      <p className="truncate text-sm text-slate-500">
                        {assignment.employee_email ||
                          'Employee'}
                      </p>
                    </div>
                  </div>

                 <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Assigned by
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {assignment.assigned_by_name || '—'}
                  </p>
                </div>

                {['ADMIN', 'MANAGER'].includes(user?.role) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveTeamEmployee(assignment)
                    }
                    disabled={
                      removingTeamEmployeeId ===
                      assignment.user_id
                    }
                    className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={15} />

                    {removingTeamEmployeeId ===
                    assignment.user_id
                      ? 'Removing...'
                      : 'Remove'}
                  </button>
                )}
              </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )}


  {/* Internal Notes */}
{activeTab === 'notes' && (
  <div className="mt-6">
    <section className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
            <MessageSquareText size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-950">
              Internal Notes
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              Team discussion, instructions, risks and
              internal tender matters.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {internalNotesError && (
        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-6">
          {internalNotesError}
        </div>
      )}

      {/* Conversation */}
     <div className="hide-scrollbar h-[420px] overflow-y-auto bg-slate-50/60 p-4 sm:h-[500px] sm:p-6">
        {internalNotesLoading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />

              <p className="mt-3 text-sm text-slate-500">
                Loading internal notes...
              </p>
            </div>
          </div>
        ) : internalNotes.length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                <MessageSquareText size={23} />
              </div>

              <p className="mt-4 font-semibold text-slate-700">
                No internal notes yet
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Start the internal discussion for this
                tender below.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            {internalNotes.map((note) => {
              const isOwnNote =
                Number(note.created_by) ===
                Number(user?.id)

                const canManageNote =
                ['ADMIN', 'MANAGER'].includes(user?.role) ||
                (user?.role === 'EMPLOYEE' && isOwnNote)

              return (
                <div
                  key={note.id}
                  className={`flex ${
                    isOwnNote
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[75%] ${
                      isOwnNote
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >
                    {/* Author */}
                    <div
                      className={`mb-1 flex items-center gap-2 ${
                        isOwnNote
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                        {note.created_by_name
                          ?.charAt(0)
                          ?.toUpperCase() || '?'}
                      </div>

                      <span className="text-xs font-semibold text-slate-500">
                        {isOwnNote
                          ? 'You'
                          : note.created_by_name ||
                            'Unknown user'}
                      </span>
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`rounded-2xl border px-4 py-3 shadow-sm ${
                        isOwnNote
                          ? 'rounded-br-md border-purple-200 bg-purple-50'
                          : 'rounded-bl-md border-slate-200 bg-white'
                      }`}
                    >
                      {editingInternalNote?.id !== note.id && (
                      <div className="mb-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            note.note_type === 'RISK'
                              ? 'bg-red-100 text-red-700'
                              : note.note_type ===
                                  'OUTSTANDING_ISSUE'
                                ? 'bg-amber-100 text-amber-700'
                                : note.note_type ===
                                    'QUESTION'
                                  ? 'bg-blue-100 text-blue-700'
                                  : note.note_type ===
                                      'INSTRUCTION'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {note.note_type?.replaceAll(
                            '_',
                            ' '
                          )}
                        </span>
                      </div>
                      )}

                     {editingInternalNote?.id === note.id ? (
                      <div className="space-y-2">
                        <select
                          value={editingInternalNote.note_type}
                          onChange={(event) =>
                            setEditingInternalNote((current) => ({
                              ...current,
                              note_type: event.target.value,
                            }))
                          }
                          disabled={savingInternalNote}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#6B3A98] focus:ring-2 focus:ring-purple-100"
                        >
                          <option value="GENERAL_NOTE">
                            General Note
                          </option>
                          <option value="INSTRUCTION">
                            Instruction
                          </option>
                          <option value="STRATEGY">
                            Strategy
                          </option>
                          <option value="OBSERVATION">
                            Observation
                          </option>
                          <option value="QUESTION">
                            Question
                          </option>
                          <option value="RISK">
                            Risk
                          </option>
                          <option value="OUTSTANDING_ISSUE">
                            Outstanding Issue
                          </option>
                        </select>

                        <textarea
                          value={editingInternalNote.content}
                          onChange={(event) =>
                            setEditingInternalNote((current) => ({
                              ...current,
                              content: event.target.value,
                            }))
                          }
                          rows={3}
                          autoFocus
                          disabled={savingInternalNote}
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#6B3A98] focus:ring-2 focus:ring-purple-100"
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingInternalNote(null)}
                            disabled={savingInternalNote}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleInternalNoteUpdate}
                            disabled={
                              savingInternalNote ||
                              !editingInternalNote.content?.trim()
                            }
                            className="rounded-lg bg-[#6B3A98] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#5b3183] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingInternalNote ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {note.content}
                      </p>
                    )}

                      <p
                        className={`mt-2 text-[11px] text-slate-400 ${
                          isOwnNote
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                       <div
                        className={`mt-2 flex items-center gap-2 ${
                            isOwnNote ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(note.created_at)}
                          </span>

                          {canManageNote && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingInternalNote(note)}
                                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#6B3A98]"
                                title="Edit note"
                                aria-label="Edit note"
                              >
                                <Pencil size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleInternalNoteDelete(note)}
                                className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Delete note"
                                aria-label="Delete note"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            <div ref={internalNotesBottomRef} />
          </div>
        )}
      </div>

      {/* Message Composer */}
      {['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(
        user?.role
      ) && (
        <form
          onSubmit={handleInternalNoteSubmit}
          className="border-t border-slate-200 bg-white p-3 sm:p-4"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-end">

            {/* Type */}
            <select
              value={internalNoteForm.noteType}
              onChange={(event) =>
                setInternalNoteForm((current) => ({
                  ...current,
                  noteType: event.target.value,
                }))
              }
              disabled={savingInternalNote}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-purple-100 sm:w-48"
            >
              <option value="GENERAL_NOTE">
                General Note
              </option>

              <option value="INSTRUCTION">
                Instruction
              </option>

              <option value="STRATEGY">
                Strategy
              </option>

              <option value="OBSERVATION">
                Observation
              </option>

              <option value="QUESTION">
                Question
              </option>

              <option value="RISK">
                Risk
              </option>

              <option value="OUTSTANDING_ISSUE">
                Outstanding Issue
              </option>
            </select>

            {/* Message */}
            <textarea
              value={internalNoteForm.content}
              onChange={(event) =>
                setInternalNoteForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              placeholder="Write an internal note..."
              rows={1}
              disabled={savingInternalNote}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6B3A98] focus:ring-2 focus:ring-purple-100"
            />

            {/* Send */}
            <button
              type="submit"
              disabled={
                savingInternalNote ||
                !internalNoteForm.content.trim()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-5 text-sm font-bold text-white transition hover:bg-[#5b3183] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={17} />

              <span className="sm:hidden">
                {savingInternalNote
                  ? 'Sending...'
                  : 'Send'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* CEO read-only indicator */}
      {user?.role === 'CEO' && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-center text-xs font-medium text-slate-500">
          Internal notes are available in read-only mode.
        </div>
      )}
    </section>
  </div>
)}


{/* Review & Approval */}
{activeTab === 'review' && (
  <div className="mt-6 space-y-6">

    {/* Header */}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
            Tender Review
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Review & Approval
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Completed requirements and compliance items
            are automatically sent here for review.
          </p>
        </div>

        {reviewData?.readiness && (
          <div
            className={`rounded-2xl border px-5 py-4 ${
              reviewData.readiness.ready
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {reviewData.readiness.ready ? (
                <CircleCheckBig
                  size={24}
                  className="text-emerald-600"
                />
              ) : (
                <Clock3
                  size={24}
                  className="text-amber-600"
                />
              )}

              <div>
                <p
                  className={`text-sm font-bold ${
                    reviewData.readiness.ready
                      ? 'text-emerald-800'
                      : 'text-amber-800'
                  }`}
                >
                  {reviewData.readiness.ready
                    ? 'Ready for Final Submission'
                    : 'Not Ready for Final Submission'}
                </p>

                <p className="mt-0.5 text-xs text-slate-600">
                  Readiness is calculated automatically.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>

    {/* Error */}
    {reviewError && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        {reviewError}
      </div>
    )}

    {reviewLoading ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />

        <p className="mt-4 text-sm text-slate-500">
          Loading review information...
        </p>
      </div>
    ) : !reviewData ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          Review information is unavailable.
        </p>
      </div>
    ) : (
      <>
        {/* Overall Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              'Approved',
              (reviewData.readiness?.requirements
                ?.approved || 0) +
                (reviewData.readiness?.compliance
                  ?.approved || 0),
              CircleCheckBig,
              'text-emerald-600',
            ],
            [
              'Awaiting Review',
              reviewData.readiness
                ?.pendingReviews || 0,
              Clock3,
              'text-amber-600',
            ],
            [
              'Changes Requested',
              reviewData.readiness
                ?.changesRequested || 0,
              CircleAlert,
              'text-red-600',
            ],
            [
              'Not Completed',
              (reviewData.readiness?.requirements
                ?.notCompleted || 0) +
                (reviewData.readiness?.compliance
                  ?.notCompleted || 0),
              ClipboardCheck,
              'text-slate-500',
            ],
          ].map(
            ([label, value, Icon, iconClass]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {label}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {value}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
                    <Icon
                      size={21}
                      className={iconClass}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Requirement / Compliance Summary */}
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            [
              'Requirements',
              reviewData.readiness?.requirements,
              ClipboardCheck,
            ],
            [
              'Compliance',
              reviewData.readiness?.compliance,
              ShieldCheck,
            ],
          ].map(([label, summary, Icon]) => (
            <section
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
                  <Icon size={19} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-950">
                    {label}
                  </h3>

                  <p className="text-xs text-slate-500">
                    {summary?.approved || 0} approved
                    {' • '}
                    {summary?.total || 0} total
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs font-semibold text-emerald-700">
                    Approved
                  </p>
                  <p className="mt-1 text-xl font-bold text-emerald-800">
                    {summary?.approved || 0}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">
                    Awaiting
                  </p>
                  <p className="mt-1 text-xl font-bold text-amber-800">
                    {summary?.awaitingReview || 0}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">
                    Changes
                  </p>
                  <p className="mt-1 text-xl font-bold text-red-800">
                    {summary?.changesRequested || 0}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">
                    Not Completed
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {summary?.notCompleted || 0}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Review Queue */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
              Live Review Queue
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-950">
              Items Awaiting Review
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Review the completed work and all evidence
              attached to each item.
            </p>
          </div>

          {[
            ...(reviewData.requirements || []).map(
              (item) => ({
                ...item,
                reviewType: 'requirement',
                reviewTypeLabel: 'Requirement',
              })
            ),
            ...(reviewData.compliance || []).map(
              (item) => ({
                ...item,
                reviewType: 'compliance',
                reviewTypeLabel: 'Compliance',
              })
            ),
          ].filter(
            (item) =>
              item.review_status ===
              'AWAITING_REVIEW'
          ).length === 0 ? (
            <div className="p-10 text-center sm:p-14">
              <CircleCheckBig
                size={34}
                className="mx-auto text-emerald-500"
              />

              <h4 className="mt-4 font-bold text-slate-900">
                No items awaiting review
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Completed items will automatically
                appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {[
                ...(reviewData.requirements || []).map(
                  (item) => ({
                    ...item,
                    reviewType: 'requirement',
                    reviewTypeLabel:
                      'Requirement',
                  })
                ),
                ...(reviewData.compliance || []).map(
                  (item) => ({
                    ...item,
                    reviewType: 'compliance',
                    reviewTypeLabel:
                      'Compliance',
                  })
                ),
              ]
                .filter(
                  (item) =>
                    item.review_status ===
                    'AWAITING_REVIEW'
                )
                .map((item) => {
                  const actionKey =
                    `${item.reviewType}-${item.id}`

                  const actionLoading =
                    reviewingItem === actionKey

                  return (
                    <div
                      key={actionKey}
                      className="p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6B3A98]">
                              {item.reviewTypeLabel}
                            </span>

                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                              Awaiting Review
                            </span>

                            {Number(
                              item.is_mandatory
                            ) === 1 && (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                                Mandatory
                              </span>
                            )}
                          </div>

                          <h4 className="mt-3 text-base font-bold text-slate-950">
                            {item.title}
                          </h4>

                          {item.description && (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span>
                              Completed by:{' '}
                              <strong className="text-slate-700">
                                {item.completed_by_name ||
                                  '—'}
                              </strong>
                            </span>

                            <span>
                              Completed:{' '}
                              <strong className="text-slate-700">
                                {formatDateTime(
                                  item.completed_at
                                )}
                              </strong>
                            </span>
                          </div>

                          {/* Evidence */}
                          <div className="mt-5">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Evidence
                            </p>

                            {!item.evidence ||
                            item.evidence.length ===
                              0 ? (
                              <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                No evidence attached to
                                this item.
                              </div>
                            ) : (
                              <div className="mt-2 space-y-2">
                                {item.evidence.map(
                                  (document) => (
                                    <div
                                      key={
                                        document.id
                                      }
                                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                          {document.title}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                          {document.file_name}
                                          {' • '}
                                          Uploaded by{' '}
                                          {document.uploaded_by_name ||
                                            '—'}
                                        </p>
                                      </div>

                                      <div className="flex shrink-0 gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handlePreviewDocument(
                                              document
                                            )
                                          }
                                          disabled={
                                            previewingDocumentId ===
                                            document.id
                                          }
                                          className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#6B3A98] hover:text-[#6B3A98] disabled:opacity-50"
                                        >
                                          <Eye
                                            size={14}
                                          />
                                          {previewingDocumentId ===
                                          document.id
                                            ? 'Opening...'
                                            : 'View Evidence'}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDownloadDocument(
                                              document
                                            )
                                          }
                                          disabled={
                                            downloadingDocumentId ===
                                            document.id
                                          }
                                          className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#6B3A98] hover:text-[#6B3A98] disabled:opacity-50"
                                        >
                                          <Download
                                            size={14}
                                          />
                                          Download
                                        </button>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {canReviewTender && (
                          <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleApproveReviewItem(
                                  item.reviewType,
                                  item
                                )
                              }
                              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CircleCheckBig
                                size={17}
                              />

                              {actionLoading
                                ? 'Saving...'
                                : 'Approve'}
                            </button>

                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                openRequestChangesModal(
                                  item.reviewType,
                                  item
                                )
                              }
                              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CircleAlert
                                size={17}
                              />
                              Request Changes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </section>

        {/* Previous Review Results */}
        {[
          ...(reviewData.requirements || []).map(
            (item) => ({
              ...item,
              reviewTypeLabel: 'Requirement',
            })
          ),
          ...(reviewData.compliance || []).map(
            (item) => ({
              ...item,
              reviewTypeLabel: 'Compliance',
            })
          ),
        ].some((item) =>
          [
            'APPROVED',
            'CHANGES_REQUESTED',
          ].includes(item.review_status)
        ) && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h3 className="font-bold text-slate-950">
                Review Results
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Previously reviewed requirements and
                compliance items.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                ...(reviewData.requirements || []).map(
                  (item) => ({
                    ...item,
                    reviewTypeLabel:
                      'Requirement',
                  })
                ),
                ...(reviewData.compliance || []).map(
                  (item) => ({
                    ...item,
                    reviewTypeLabel:
                      'Compliance',
                  })
                ),
              ]
                .filter((item) =>
                  [
                    'APPROVED',
                    'CHANGES_REQUESTED',
                  ].includes(
                    item.review_status
                  )
                )
                .map((item) => (
                  <div
                    key={`${item.reviewTypeLabel}-${item.id}`}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6B3A98]">
                            {item.reviewTypeLabel}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              reviewStatusStyles[
                                item.review_status
                              ]
                            }`}
                          >
                            {
                              reviewStatusLabels[
                                item.review_status
                              ]
                            }
                          </span>
                        </div>

                        <h4 className="mt-3 font-bold text-slate-900">
                          {item.title}
                        </h4>

                        {item.review_comment && (
                          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-red-500">
                              Reviewer Comment
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                              {
                                item.review_comment
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 sm:text-right">
                        <p>
                          Reviewed by{' '}
                          <strong className="text-slate-700">
                            {item.reviewed_by_name ||
                              '—'}
                          </strong>
                        </p>

                        <p className="mt-1">
                          {formatDateTime(
                            item.reviewed_at
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </>
    )}
  </div>
)}


{/* Final Submission */}
{activeTab === 'submission' && (
  <div className="mt-6 space-y-6">

    {/* Header */}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
            Final Stage
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Final Submission
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Record the final tender submission after all
            requirements and compliance items have been approved.
          </p>
        </div>

        {submissionData?.readiness && (
          <div
            className={`rounded-2xl border px-5 py-4 ${
              submissionData.readiness.ready
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {submissionData.readiness.ready ? (
                <CircleCheckBig
                  size={24}
                  className="text-emerald-600"
                />
              ) : (
                <Clock3
                  size={24}
                  className="text-amber-600"
                />
              )}

              <div>
                <p
                  className={`text-sm font-bold ${
                    submissionData.readiness.ready
                      ? 'text-emerald-800'
                      : 'text-amber-800'
                  }`}
                >
                  {submissionData.readiness.ready
                    ? 'Ready for Final Submission'
                    : 'Not Ready for Final Submission'}
                </p>

                <p className="mt-0.5 text-xs text-slate-600">
                  Based on Requirements & Compliance approval.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>

    {/* Error */}
    {submissionError && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        {submissionError}
      </div>
    )}

    {submissionLoading ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6B3A98]" />

        <p className="mt-4 text-sm text-slate-500">
          Loading final submission information...
        </p>
      </div>
    ) : !submissionData ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          Final submission information is unavailable.
        </p>
      </div>
    ) : tender?.status === 'SUBMITTED' ? (

      /* ================================
         ALREADY SUBMITTED
         ================================ */
      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CircleCheckBig size={25} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                Submission Complete
              </p>

              <h3 className="mt-1 text-xl font-bold text-emerald-950">
                Tender Submitted
              </h3>

              <p className="mt-1 text-sm text-emerald-800">
                This tender has been recorded as submitted.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Submitted By
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {submissionData.tender?.submitted_by_name || '—'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Submitted Date & Time
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {formatDateTime(
                submissionData.tender?.submitted_at
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Submission Method
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {submissionData.tender?.submission_method || '—'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Submission Location
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {submissionData.tender?.submission_location || '—'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Submission Reference
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {submissionData.tender?.submission_reference || '—'}
            </p>
          </div>

          {submissionData.tender?.submission_notes && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Submission Notes
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {submissionData.tender.submission_notes}
              </p>
            </div>
          )}
        </div>
      </section>

    ) : (

      /* ================================
         NOT YET SUBMITTED
         ================================ */
      <>
        {/* Readiness Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Requirements
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {submissionData.readiness?.requirements?.approved || 0}
              {' / '}
              {submissionData.readiness?.requirements?.total || 0}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Required items approved
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Compliance
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {submissionData.readiness?.compliance?.approved || 0}
              {' / '}
              {submissionData.readiness?.compliance?.total|| 0}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Required items approved
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Awaiting Review
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {submissionData.readiness?.pendingReviews || 0}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Pending approval
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Changes Requested
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {submissionData.readiness?.changesRequested || 0}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Requires correction
            </p>
          </div>
        </div>

        {/* Final Submission Documents */}
<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
        Final Package
      </p>

      <h3 className="mt-1 text-lg font-bold text-slate-950">
        Final Submission Documents
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Documents included in the final tender submission package.
      </p>
    </div>

    {['ADMIN', 'CEO'].includes(user?.role) &&
      tender?.status !== 'SUBMITTED' && (
        <button
          type="button"
          onClick={() =>
            openCreateDocument('INTERNAL_SUBMISSION')
          }
          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182]"
        >
          <Upload size={16} />
          Upload Final Document
        </button>
      )}
  </div>

  {!submissionData.finalSubmissionDocuments ||
  submissionData.finalSubmissionDocuments.length === 0 ? (
    <div className="p-10 text-center">
      <Files
        size={32}
        className="mx-auto text-slate-300"
      />

      <h4 className="mt-3 font-semibold text-slate-800">
        No final submission documents
      </h4>

      <p className="mt-1 text-sm text-slate-500">
        Upload the documents that form the final tender package.
      </p>
    </div>
  ) : (
    <div className="divide-y divide-slate-100">
      {submissionData.finalSubmissionDocuments.map(
        (document) => (
          <div
            key={document.id}
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
                <FileText size={18} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {document.title}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {document.file_name}
                </p>

                {document.uploaded_by_name && (
                  <p className="mt-1 text-xs text-slate-400">
                    Uploaded by {document.uploaded_by_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handlePreviewDocument(document)
                }
                disabled={
                  previewingDocumentId === document.id
                }
                className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#6B3A98] hover:text-[#6B3A98] disabled:opacity-50"
              >
                <Eye size={14} />

                {previewingDocumentId === document.id
                  ? 'Opening...'
                  : 'View'}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownloadDocument(document)
                }
                disabled={
                  downloadingDocumentId === document.id
                }
                className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#6B3A98] hover:text-[#6B3A98] disabled:opacity-50"
              >
                <Download size={14} />

                {downloadingDocumentId === document.id
                  ? 'Downloading...'
                  : 'Download'}
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )}
</section>

        {/* Admin / CEO Submission Form */}
        {['ADMIN', 'CEO'].includes(user?.role) ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
                Submission Record
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-950">
                Record Final Submission
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                After submitting the tender to the issuing
                authority, record the submission details here.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Submission Method
                  </label>

                  <input
                    type="text"
                    name="submissionMethod"
                    value={submissionForm.submissionMethod}
                    onChange={handleSubmissionFormChange}
                    placeholder="e.g. Online Portal"
                    disabled={!submissionData.readiness?.ready}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98] disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Submission Location / Destination
                  </label>

                  <input
                    type="text"
                    name="submissionLocation"
                    value={submissionForm.submissionLocation}
                    onChange={handleSubmissionFormChange}
                    placeholder="e.g. Procurement Portal"
                    disabled={!submissionData.readiness?.ready}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98] disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Submission Reference
                </label>

                <input
                  type="text"
                  name="submissionReference"
                  value={submissionForm.submissionReference}
                  onChange={handleSubmissionFormChange}
                  placeholder="Optional reference / confirmation number"
                  disabled={!submissionData.readiness?.ready}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98] disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Submission Notes
                </label>

                <textarea
                  name="submissionNotes"
                  rows={4}
                  value={submissionForm.submissionNotes}
                  onChange={handleSubmissionFormChange}
                  placeholder="Optional notes about the final submission..."
                  disabled={!submissionData.readiness?.ready}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98] disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {!submissionData.readiness?.ready && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <Clock3
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      Final submission is locked
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      Complete and approve all required
                      Requirements and Compliance items before
                      final submission.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleFinalSubmission}
                  disabled={
                    submittingTender ||
                    !submissionData.readiness?.ready
                  }
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#6B3A98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingTender ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      Mark as Submitted
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        ) : (
          /* Manager / Employee */
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
                <Send size={20} />
              </div>

              <div>
                <h3 className="font-bold text-slate-950">
                  Final Submission
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {submissionData.readiness?.ready
                    ? 'This tender is ready for final submission. An Admin or CEO can record the final submission.'
                    : 'Final submission becomes available after all required items have been approved.'}
                </p>
              </div>
            </div>
          </section>
        )}
      </>
    )}
  </div>
)}

        {/* Placeholder tabs */}
      {activeTab !== 'overview' &&
    activeTab !== 'requirements' &&
    activeTab !== 'compliance' &&
    activeTab !== 'documents' && 
        activeTab !== 'team' &&
        activeTab !== 'notes' && 
        activeTab !== 'review' && 
        activeTab !== 'submission' &&  (

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6B3A98]/10 text-[#6B3A98]">
              <ActiveTabIcon size={25} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-950">
              {activeTabItem?.label}
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              This workspace section is ready for its
              functional module. We will build it in
              the next tender-management steps.
            </p>
          </div>
        )}

        {showDocumentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">Tender Document</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    {editingDocument ? 'Edit Document Information' : 'Upload Document'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeDocumentModal}
                  disabled={savingDocument}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDocumentSubmit} className="space-y-5 p-5 sm:p-6">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Document Section</label>
                  <select
                    name="documentType"
                    value={documentForm.documentType}
                    onChange={handleDocumentFormChange}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
                  >
                    {['ADMIN', 'MANAGER'].includes(user?.role) && (
                      <option value="ORIGINAL_TENDER">
                        Original Tender Documents
                      </option>
                    )}
                    <option value="INTERNAL_SUBMISSION">Internal Submission Documents</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={documentForm.title}
                    onChange={handleDocumentFormChange}
                    placeholder="e.g. Original Tender Specification"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={documentForm.description}
                    onChange={handleDocumentFormChange}
                    placeholder="Optional notes about this document"
                    className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
                  />
                </div>

                {!editingDocument && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700">File</label>
                    <input
                      type="file"
                      name="file"
                      required
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt,.csv"
                      onChange={handleDocumentFormChange}
                      className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:font-semibold file:text-[#6B3A98]"
                    />
                    <p className="mt-2 text-xs text-slate-400">Maximum file size: 25 MB.</p>
                  </div>
                )}

              {editingDocument && (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Current File
        </p>

        <p className="mt-1 break-all text-sm font-semibold text-slate-700">
          {editingDocument.file_name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          This file will remain unchanged unless you select a replacement below.
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Replace File
          <span className="ml-1 font-normal text-slate-400">
            (Optional)
          </span>
        </label>

        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt,.csv"
          onChange={handleDocumentFormChange}
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:font-semibold file:text-[#6B3A98]"
        />

        <p className="mt-2 text-xs text-slate-400">
          Leave this empty to keep the current file. Maximum file size: 25 MB.
        </p>
      </div>
    </div>
  )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Requirement Evidence</label>
                    <select
                      name="requirementId"
                      value={documentForm.requirementId}
                      onChange={handleDocumentFormChange}
                      disabled={Boolean(documentForm.complianceItemId)}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#6B3A98]"
                    >
                      <option value="">Not linked</option>
                      {requirements.map((requirement) => (
                        <option key={requirement.id} value={requirement.id}>{requirement.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Compliance Evidence</label>
                    <select
                      name="complianceItemId"
                      value={documentForm.complianceItemId}
                      onChange={handleDocumentFormChange}
                      disabled={Boolean(documentForm.requirementId)}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#6B3A98]"
                    >
                      <option value="">Not linked</option>
                      {complianceItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Evidence is optional. A document can be linked to either one requirement or one compliance item.
                </p>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDocumentModal}
                    disabled={savingDocument}
                    className="min-h-[44px] rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDocument}
                    className="min-h-[44px] rounded-xl bg-[#6B3A98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingDocument ? 'Saving...' : editingDocument ? 'Save Changes' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRequirementModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
              Tender Requirement
            </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
          {editingRequirement
              ? 'Edit Requirement'
              : 'Add Requirement'}
          </h2>
          </div>

          <button
            type="button"
            onClick={closeRequirementModal}
            disabled={savingRequirement}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleRequirementSubmit}
          className="space-y-5 p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Category
              </label>

              <select
                name="category"
                value={requirementForm.category}
                onChange={handleRequirementFormChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
              >
                <option value="MANDATORY">
                  Mandatory
                </option>
                <option value="ELIGIBILITY">
                  Eligibility / Qualification
                </option>
                <option value="TECHNICAL">
                  Technical
                </option>
                <option value="FINANCIAL">
                  Financial / Pricing
                </option>
                <option value="EXPERIENCE">
                  Experience
                </option>
                <option value="COMPANY">
                  Company / Registration
                </option>
                <option value="CERTIFICATION">
                  Certification
                </option>
                <option value="SITE_VISIT">
                  Site Visit / Briefing
                </option>
                <option value="SUBMISSION">
                  Submission
                </option>
                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                name="status"
                value={requirementForm.status}
                onChange={handleRequirementFormChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
              >
                <option value="NOT_STARTED">
                  Not Started
                </option>
                <option value="IN_PROGRESS">
                  In Progress
                </option>
                <option value="COMPLETED">
                  Completed
                </option>
                <option value="NOT_APPLICABLE">
                  Not Applicable
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Requirement Title
            </label>

            <input
              type="text"
              name="title"
              required
              value={requirementForm.title}
              onChange={handleRequirementFormChange}
              placeholder="e.g. Tax Good Standing Certificate"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              rows={4}
              value={requirementForm.description}
              onChange={handleRequirementFormChange}
              placeholder="Describe what must be provided for this requirement."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* <div>
              <label className="text-sm font-semibold text-slate-700">
                Assign To
              </label>

              <select
                name="assignedUserId"
                value={requirementForm.assignedUserId}
                onChange={handleRequirementFormChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
              >
                <option value="">
                  Not assigned
                </option>

                {assignments.map((assignment) => (
                  <option
                  key={assignment.user_id}
                      value={assignment.user_id}
                  >
                    {assignment.employee_name}
                  </option>
                ))}
              </select>
            </div> */}

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Due Date
              </label>

              <input
                type="date"
                name="dueDate"
                value={requirementForm.dueDate}
                onChange={handleRequirementFormChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              name="isMandatory"
              checked={requirementForm.isMandatory}
              onChange={handleRequirementFormChange}
              className="h-4 w-4 accent-[#6B3A98]"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Mandatory requirement
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                This requirement must be satisfied before submission.
              </p>
            </div>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeRequirementModal}
              disabled={savingRequirement}
              className="min-h-[44px] rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingRequirement}
              className="min-h-[44px] rounded-xl bg-[#6B3A98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182] disabled:cursor-not-allowed disabled:opacity-60"
            >
            {savingRequirement
              ? 'Saving...'
              : editingRequirement
                  ? 'Save Changes'
                  : 'Add Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {showComplianceModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B3A98]">
              Tender Compliance
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {editingComplianceItem
                ? 'Edit Compliance Item'
                : 'Add Compliance Item'}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeComplianceModal}
            disabled={savingComplianceItem}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleComplianceSubmit}
          className="space-y-5 p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Category
              </label>

              <select
                name="category"
                value={complianceForm.category}
                onChange={handleComplianceFormChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
              >
                <option value="REGISTRATION">
                  Registration
                </option>
                <option value="TAX">
                  Tax / VAT
                </option>
                <option value="SOCIAL_SECURITY">
                  Social Security
                </option>
                <option value="GOOD_STANDING">
                  Good Standing
                </option>
                <option value="BANKING">
                  Banking
                </option>
                <option value="OWNERSHIP">
                  Ownership
                </option>
                <option value="EXPERIENCE">
                  Experience
                </option>
                <option value="COMPANY_PROFILE">
                  Company Profile
                </option>
                <option value="REFERENCES">
                  References
                </option>
                <option value="PERSONNEL">
                  Personnel
                </option>
                <option value="TECHNICAL">
                  Technical
                </option>
                <option value="PRICING">
                  Pricing
                </option>
                <option value="FORMS">
                  Forms
                </option>
                <option value="DECLARATIONS">
                  Declarations
                </option>
                <option value="CERTIFICATES">
                  Certificates / Licences
                </option>
                <option value="ATTACHMENTS">
                  Attachments
                </option>
                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                name="status"
                value={complianceForm.status}
                onChange={handleComplianceFormChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
              >
                <option value="NOT_STARTED">
                  Not Started
                </option>
                <option value="IN_PROGRESS">
                  In Progress
                </option>
                <option value="COMPLETED">
                  Completed
                </option>
                <option value="NOT_APPLICABLE">
                  Not Applicable
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Compliance Item Title
            </label>

            <input
              type="text"
              name="title"
              required
              value={complianceForm.title}
              onChange={handleComplianceFormChange}
              placeholder="e.g. Tender Security / Bid Bond"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              rows={3}
              value={complianceForm.description}
              onChange={handleComplianceFormChange}
              placeholder="Describe what must be provided."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* <div>
              <label className="text-sm font-semibold text-slate-700">
                Assign To
              </label>

              <select
                name="assignedUserId"
                value={complianceForm.assignedUserId}
                onChange={handleComplianceFormChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
              >
                <option value="">
                  Not assigned
                </option>

                {assignments.map((assignment) => (
                  <option
                    key={assignment.user_id}
                    value={assignment.user_id}
                  >
                    {assignment.employee_name}
                  </option>
                ))}
              </select>
            </div> */}

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Due Date
              </label>

              <input
                type="date"
                name="dueDate"
                value={complianceForm.dueDate}
                onChange={handleComplianceFormChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Notes
            </label>

            <textarea
              name="notes"
              rows={3}
              value={complianceForm.notes}
              onChange={handleComplianceFormChange}
              placeholder="Internal notes, outstanding issues or instructions."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#6B3A98]"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              name="isMandatory"
              checked={complianceForm.isMandatory}
              onChange={handleComplianceFormChange}
              className="h-4 w-4 accent-[#6B3A98]"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Mandatory compliance item
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                This item must be satisfied before tender submission.
              </p>
            </div>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeComplianceModal}
              disabled={savingComplianceItem}
              className="min-h-[44px] rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingComplianceItem}
              className="min-h-[44px] rounded-xl bg-[#6B3A98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3182] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingComplianceItem
                ? 'Saving...'
                : editingComplianceItem
                  ? 'Save Changes'
                  : 'Add Compliance Item'}
            </button>
          </div>
        </form>
      </div>
    </div>



  )}

  {previewDocument && previewUrl && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-slate-950">
            {previewDocument.title}
          </h3>

          <p className="mt-1 truncate text-xs text-slate-500">
            {previewDocument.file_name}
          </p>
        </div>

        <button
          type="button"
          onClick={closeDocumentPreview}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          title="Close preview"
        >
          <X size={18} />
        </button>
      </div>

      {/* Preview */}
      <div className="min-h-0 flex-1 bg-slate-100 p-3">
        {previewDocument.mime_type === 'application/pdf' ? (
          <iframe
            src={previewUrl}
            title={previewDocument.title}
            className="h-full w-full rounded-xl bg-white"
          />
        ) : previewDocument.mime_type?.startsWith('image/') ? (
          <div className="flex h-full items-center justify-center overflow-auto rounded-xl bg-white p-4">
            <img
              src={previewUrl}
              alt={previewDocument.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl bg-white p-6 text-center">
            <div>
              <FileText
                size={44}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-semibold text-slate-700">
                Preview is not available for this file type.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Please download the document to view it.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}


{showReviewChangesModal &&
  reviewChangesTarget && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
              Review Decision
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Request Changes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {
                reviewChangesTarget.item
                  .title
              }
            </p>
          </div>

          <button
            type="button"
            onClick={
              closeRequestChangesModal
            }
            disabled={Boolean(reviewingItem)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleRequestChanges}
          className="p-5"
        >
          <label className="text-sm font-semibold text-slate-700">
            What needs to be changed?
          </label>

          <textarea
            autoFocus
            rows={5}
            value={reviewComment}
            onChange={(event) =>
              setReviewComment(
                event.target.value
              )
            }
            placeholder="Explain what should be corrected or what additional evidence is required..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#6B3A98] focus:ring-2 focus:ring-purple-100"
          />

          {reviewError && (
            <p className="mt-2 text-sm font-medium text-red-600">
              {reviewError}
            </p>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={
                closeRequestChangesModal
              }
              disabled={Boolean(reviewingItem)}
              className="min-h-[44px] rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                Boolean(reviewingItem) ||
                !reviewComment.trim()
              }
              className="min-h-[44px] rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reviewingItem
                ? 'Submitting...'
                : 'Request Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
      </div>
    )
  }

  export default TenderWorkspace