const humanizeValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}



const formatCurrency = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  const number = Number(value)

  if (Number.isNaN(number)) {
    return String(value)
  }

  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number)
}


export const formatActivityDateTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('en-NA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatDateValue = (value) => {
  if (!value) return '—'

  const datePart = String(value).slice(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)

  if (!year || !month || !day) {
    return humanizeValue(value)
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

const changed = (previousValue, newValue) =>
  String(previousValue ?? '') !== String(newValue ?? '')

const change = (label, previousValue, newValue) => ({
  label,
  previous: humanizeValue(previousValue),
  next: humanizeValue(newValue),
})

const dateChange = (label, previousValue, newValue) => ({
  label,
  previous: formatDateValue(previousValue),
  next: formatDateValue(newValue),
})

const dateTimeChange = (label, previousValue, newValue) => ({
  label,
  previous: formatActivityDateTime(previousValue),
  next: formatActivityDateTime(newValue),
})

const actorName = (activity) =>
  activity.user_name || 'System'

export const formatTenderActivity = (activity) => {
  const metadata = activity.metadata || {}
  const actor = actorName(activity)

  const result = {
    id: activity.id,
    actionType: activity.action_type,
    actor,
    title: activity.description || 'Tender activity',
    subtitle: null,
    changes: [],
    messages: [],
    createdAt: activity.created_at,
  }

  switch (activity.action_type) {
    /*
     * INTERNAL NOTES
     */
    case 'INTERNAL_NOTE_CREATED':
      result.title = `${actor} added an internal note`
      result.subtitle = `Type: ${humanizeValue(metadata.noteType)}`
      break

    case 'INTERNAL_NOTE_UPDATED':
      result.title = `${actor} updated an internal note`

      if (
        changed(
          metadata.previousNoteType,
          metadata.newNoteType
        )
      ) {
        result.changes.push(
          change(
            'Type',
            metadata.previousNoteType,
            metadata.newNoteType
          )
        )
      }

      if (metadata.contentChanged) {
        result.messages.push('Note content was updated.')
      }

      break

    case 'INTERNAL_NOTE_ARCHIVED':
      result.title = `${actor} removed an internal note`
      result.subtitle = `Type: ${humanizeValue(metadata.noteType)}`
      break

    /*
     * REQUIREMENTS
     */
    case 'REQUIREMENT_CREATED':
      result.title = `${actor} created requirement "${
        metadata.title || 'Untitled requirement'
      }"`
      break

    case 'REQUIREMENT_PROGRESS_UPDATED':
      result.title = `${actor} updated requirement "${
        metadata.title || 'Untitled requirement'
      }"`

      if (
        changed(
          metadata.previousStatus,
          metadata.newStatus
        )
      ) {
        result.changes.push(
          change(
            'Status',
            metadata.previousStatus,
            metadata.newStatus
          )
        )
      }

      break

    case 'REQUIREMENT_UPDATED': {
      result.title = `${actor} updated requirement "${
        metadata.newTitle ||
        metadata.previousTitle ||
        'Untitled requirement'
      }"`

      if (
        changed(
          metadata.previousTitle,
          metadata.newTitle
        )
      ) {
        result.changes.push(
          change(
            'Title',
            metadata.previousTitle,
            metadata.newTitle
          )
        )
      }

      if (
        changed(
          metadata.previousCategory,
          metadata.newCategory
        )
      ) {
        result.changes.push(
          change(
            'Category',
            metadata.previousCategory,
            metadata.newCategory
          )
        )
      }

      if (
        changed(
          metadata.previousMandatory,
          metadata.newMandatory
        )
      ) {
        result.changes.push({
          label: 'Mandatory',
          previous: metadata.previousMandatory ? 'Yes' : 'No',
          next: metadata.newMandatory ? 'Yes' : 'No',
        })
      }

      if (
        changed(
          metadata.previousStatus,
          metadata.newStatus
        )
      ) {
        result.changes.push(
          change(
            'Status',
            metadata.previousStatus,
            metadata.newStatus
          )
        )
      }

      if (
        changed(
          metadata.previousAssignedUserId,
          metadata.newAssignedUserId
        )
      ) {
        result.changes.push({
          label: 'Assigned To',
          previous:
            metadata.previousAssignedUserName ||
            'Unassigned',
          next:
            metadata.newAssignedUserName ||
            'Unassigned',
        })
      }

      if (
        changed(
          metadata.previousDueDate,
          metadata.newDueDate
        )
      ) {
        result.changes.push(
          dateChange(
            'Due Date',
            metadata.previousDueDate,
            metadata.newDueDate
          )
        )
      }

      if (
        changed(
          metadata.previousSortOrder,
          metadata.newSortOrder
        )
      ) {
        result.changes.push(
          change(
            'Sort Order',
            metadata.previousSortOrder,
            metadata.newSortOrder
          )
        )
      }

      if (metadata.descriptionChanged) {
        result.messages.push('Description was updated.')
      }

      break
    }

    case 'REQUIREMENT_ARCHIVED':
      result.title = `${actor} archived requirement "${
        metadata.title || 'Untitled requirement'
      }"`
      break

    /*
     * COMPLIANCE
     */
    case 'COMPLIANCE_TEMPLATE_APPLIED':
      result.title = `${actor} applied "${
        metadata.templateName || 'Compliance template'
      }"`

      result.subtitle = `${
        metadata.selectedCount ?? 0
      } items selected`

      break

    case 'COMPLIANCE_ITEM_CREATED':
      result.title = `${actor} created compliance item "${
        metadata.title || 'Untitled compliance item'
      }"`
      break

    case 'COMPLIANCE_PROGRESS_UPDATED':
      result.title = `${actor} updated compliance item "${
        metadata.title || 'Untitled compliance item'
      }"`

      if (
        changed(
          metadata.previousStatus,
          metadata.newStatus
        )
      ) {
        result.changes.push(
          change(
            'Status',
            metadata.previousStatus,
            metadata.newStatus
          )
        )
      }

      break

    case 'COMPLIANCE_ITEM_UPDATED': {
      result.title = `${actor} updated compliance item "${
        metadata.newTitle ||
        metadata.previousTitle ||
        metadata.title ||
        'Untitled compliance item'
      }"`

      if (
        changed(
          metadata.previousTitle,
          metadata.newTitle
        )
      ) {
        result.changes.push(
          change(
            'Title',
            metadata.previousTitle,
            metadata.newTitle
          )
        )
      }

      if (
        changed(
          metadata.previousCategory,
          metadata.newCategory
        )
      ) {
        result.changes.push(
          change(
            'Category',
            metadata.previousCategory,
            metadata.newCategory
          )
        )
      }

      if (
        changed(
          metadata.previousMandatory,
          metadata.newMandatory
        )
      ) {
        result.changes.push({
          label: 'Mandatory',
          previous: metadata.previousMandatory ? 'Yes' : 'No',
          next: metadata.newMandatory ? 'Yes' : 'No',
        })
      }

      if (
        changed(
          metadata.previousStatus,
          metadata.newStatus
        )
      ) {
        result.changes.push(
          change(
            'Status',
            metadata.previousStatus,
            metadata.newStatus
          )
        )
      }

      if (
        changed(
          metadata.previousAssignedUserId,
          metadata.newAssignedUserId
        )
      ) {
        result.changes.push({
          label: 'Assigned To',
          previous:
            metadata.previousAssignedUserName ||
            'Unassigned',
          next:
            metadata.newAssignedUserName ||
            'Unassigned',
        })
      }

      if (
        changed(
          metadata.previousDueDate,
          metadata.newDueDate
        )
      ) {
        result.changes.push(
          dateChange(
            'Due Date',
            metadata.previousDueDate,
            metadata.newDueDate
          )
        )
      }

      if (
        changed(
          metadata.previousSortOrder,
          metadata.newSortOrder
        )
      ) {
        result.changes.push(
          change(
            'Sort Order',
            metadata.previousSortOrder,
            metadata.newSortOrder
          )
        )
      }

      if (metadata.descriptionChanged) {
        result.messages.push('Description was updated.')
      }

      if (metadata.notesChanged) {
        result.messages.push('Notes were updated.')
      }

      break
    }

    case 'COMPLIANCE_ITEM_ARCHIVED':
      result.title = `${actor} archived compliance item "${
        metadata.title || 'Untitled compliance item'
      }"`
      break

    /*
     * DOCUMENTS
     */
    case 'DOCUMENT_UPLOADED': {
      const label =
        metadata.documentLabel === 'evidence'
          ? 'evidence'
          : 'source document'

      result.title = `${actor} uploaded ${label} "${
        metadata.fileName ||
        metadata.title ||
        'Document'
      }"`

      if (metadata.linkType && metadata.linkTitle) {
        result.subtitle = `for ${humanizeValue(
          metadata.linkType
        )}: ${metadata.linkTitle}`
      } else {
        result.subtitle = 'for Tender'
      }

      break
    }

    case 'DOCUMENT_UPDATED': {
      const label =
        metadata.newDocumentType === 'INTERNAL_SUBMISSION'
          ? 'evidence'
          : 'source document'

      result.title = `${actor} updated ${label} "${
        metadata.newTitle ||
        metadata.previousTitle ||
        metadata.newFileName ||
        'Document'
      }"`

      if (metadata.fileReplaced) {
        result.messages.push('File was replaced.')
      }

      if (metadata.descriptionChanged) {
        result.messages.push('Description was updated.')
      }

      if (metadata.linkChanged) {
        result.changes.push({
          label: 'Linked To',
          previous:
            metadata.previousLinkType &&
            metadata.previousLinkTitle
              ? `${humanizeValue(
                  metadata.previousLinkType
                )}: ${metadata.previousLinkTitle}`
              : 'Tender',
          next:
            metadata.newLinkType &&
            metadata.newLinkTitle
              ? `${humanizeValue(
                  metadata.newLinkType
                )}: ${metadata.newLinkTitle}`
              : 'Tender',
        })
      }

      break
    }

    case 'DOCUMENT_ARCHIVED': {
      const label =
        metadata.documentLabel === 'evidence'
          ? 'evidence'
          : 'source document'

      result.title = `${actor} removed ${label} "${
        metadata.fileName ||
        metadata.title ||
        'Document'
      }"`

      if (metadata.linkType && metadata.linkTitle) {
        result.subtitle = `from ${humanizeValue(
          metadata.linkType
        )}: ${metadata.linkTitle}`
      }

      break
    }

    /*
     * TEAM
     */
    case 'EMPLOYEE_ASSIGNED':
      result.title = metadata.assignedUserName
        ? `${actor} assigned ${metadata.assignedUserName} to this tender`
        : `${actor} assigned an employee to this tender`
      break

    case 'EMPLOYEE_REMOVED':
      result.title = metadata.removedUserName
        ? `${actor} removed ${metadata.removedUserName} from this tender`
        : `${actor} removed an employee from this tender`
      break

    /*
     * TENDER
     */
    case 'TENDER_CREATED':
      result.title = `${actor} created tender "${
        metadata.title || 'Untitled tender'
      }"`

      if (metadata.referenceNo) {
        result.subtitle = `Reference: ${metadata.referenceNo}`
      }

      break


    case 'TENDER_UPDATED': {
    result.title = `${actor} updated tender "${
        metadata.newTitle ||
        metadata.previousTitle ||
        'Untitled tender'
    }"`

    if (
        changed(
        metadata.previousCompanyId,
        metadata.newCompanyId
        )
    ) {
        result.changes.push({
        label: 'Company',
        previous:
            metadata.previousCompanyName || '—',
        next:
            metadata.newCompanyName || '—',
        })
    }

    if (
        changed(
        metadata.previousReferenceNo,
        metadata.newReferenceNo
        )
    ) {
        result.changes.push(
        change(
            'Reference Number',
            metadata.previousReferenceNo,
            metadata.newReferenceNo
        )
        )
    }

    if (
        changed(
        metadata.previousTitle,
        metadata.newTitle
        )
    ) {
        result.changes.push(
        change(
            'Title',
            metadata.previousTitle,
            metadata.newTitle
        )
        )
    }

    if (
        changed(
        metadata.previousClientName,
        metadata.newClientName
        )
    ) {
        result.changes.push(
        change(
            'Client / Authority',
            metadata.previousClientName,
            metadata.newClientName
        )
        )
    }

    if (
        changed(
        metadata.previousCategory,
        metadata.newCategory
        )
    ) {
        result.changes.push(
        change(
            'Category',
            metadata.previousCategory,
            metadata.newCategory
        )
        )
    }

    if (
        changed(
        metadata.previousStatus,
        metadata.newStatus
        )
    ) {
        result.changes.push(
        change(
            'Status',
            metadata.previousStatus,
            metadata.newStatus
        )
        )
    }

    if (
        changed(
        metadata.previousPriority,
        metadata.newPriority
        )
    ) {
        result.changes.push(
        change(
            'Priority',
            metadata.previousPriority,
            metadata.newPriority
        )
        )
    }

    if (
        changed(
        metadata.previousTenderValue,
        metadata.newTenderValue
        )
    ) {
       result.changes.push({
        label: 'Tender Value',
        previous: formatCurrency(
            metadata.previousTenderValue
        ),
        next: formatCurrency(
            metadata.newTenderValue
        ),
        })
    }

    if (
        changed(
        metadata.previousResult,
        metadata.newResult
        )
    ) {
        result.changes.push(
        change(
            'Result',
            metadata.previousResult,
            metadata.newResult
        )
        )
    }

    if (
        changed(
        metadata.previousProgress,
        metadata.newProgress
        )
    ) {
        result.changes.push({
        label: 'Progress',
        previous:
            metadata.previousProgress !== null &&
            metadata.previousProgress !== undefined
            ? `${metadata.previousProgress}%`
            : '—',
        next:
            metadata.newProgress !== null &&
            metadata.newProgress !== undefined
            ? `${metadata.newProgress}%`
            : '—',
        })
    }

    if (
        changed(
        metadata.previousStartDate,
        metadata.newStartDate
        )
    ) {
        result.changes.push(
        dateChange(
            'Start Date',
            metadata.previousStartDate,
            metadata.newStartDate
        )
        )
    }

    if (
        changed(
        metadata.previousDeadline,
        metadata.newDeadline
        )
    ) {
        result.changes.push(
        dateChange(
            'Closing Date',
            metadata.previousDeadline,
            metadata.newDeadline
        )
        )
    }

    if (
        changed(
        metadata.previousClosingTime,
        metadata.newClosingTime
        )
    ) {
        result.changes.push(
        change(
            'Closing Time',
            metadata.previousClosingTime,
            metadata.newClosingTime
        )
        )
    }

    if (
        changed(
        metadata.previousInternalDeadline,
        metadata.newInternalDeadline
        )
    ) {
        result.changes.push(
        dateChange(
            'Internal Deadline',
            metadata.previousInternalDeadline,
            metadata.newInternalDeadline
        )
        )
    }

    if (
        changed(
        metadata.previousSubmissionMethod,
        metadata.newSubmissionMethod
        )
    ) {
        result.changes.push(
        change(
            'Submission Method',
            metadata.previousSubmissionMethod,
            metadata.newSubmissionMethod
        )
        )
    }

    if (
        changed(
        metadata.previousSubmissionLocation,
        metadata.newSubmissionLocation
        )
    ) {
        result.changes.push(
        change(
            'Submission Location',
            metadata.previousSubmissionLocation,
            metadata.newSubmissionLocation
        )
        )
    }

    if (
        changed(
        metadata.previousInternalOwnerId,
        metadata.newInternalOwnerId
        )
    ) {
        result.changes.push({
        label: 'Internal Owner',
        previous:
            metadata.previousInternalOwnerName ||
            'Unassigned',
        next:
            metadata.newInternalOwnerName ||
            'Unassigned',
        })
    }

        if (
        changed(
            metadata.previousSubmittedAt,
            metadata.newSubmittedAt
        )
        ) {
        result.changes.push(
            dateTimeChange(
            'Submitted At',
            metadata.previousSubmittedAt,
            metadata.newSubmittedAt
            )
        )
        }

    if (metadata.descriptionChanged) {
        result.messages.push('Description was updated.')
    }

    break
    }

    case 'TENDER_ARCHIVED':
      result.title = `${actor} archived tender "${
        metadata.title || 'Untitled tender'
      }"`

      if (metadata.referenceNo) {
        result.subtitle = `Reference: ${metadata.referenceNo}`
      }

      break

    default:
      // Safe fallback for old or future activity types.
      result.title =
        activity.description || `${actor} updated this tender`
      break
  }

  return result
}