import {
  getTenderInternalNotes,
  createTenderInternalNote,
  getTenderInternalNoteById,
  updateTenderInternalNote,
  archiveTenderInternalNote
} from '../models/tenderInternalNoteModel.js'
import { createTenderActivity } from '../models/tenderActivityModel.js'

export const listTenderInternalNotes = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const notes = await getTenderInternalNotes(
      tenderId
    )

    return res.status(200).json({
      success: true,
      notes,
    })
  } catch (error) {
    next(error)
  }
}



const ALLOWED_NOTE_TYPES = [
  'INSTRUCTION',
  'STRATEGY',
  'OBSERVATION',
  'QUESTION',
  'RISK',
  'OUTSTANDING_ISSUE',
  'GENERAL_NOTE',
]

export const addTenderInternalNote = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const noteType =
      req.body.noteType || 'GENERAL_NOTE'

   

    const content =
      typeof req.body.content === 'string'
        ? req.body.content.trim()
        : ''

    if (!ALLOWED_NOTE_TYPES.includes(noteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid internal note type.',
      })
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required.',
      })
    }

    const note = await createTenderInternalNote({
      tenderId,
      noteType,
     
      content,
      createdBy: req.user.id,
    })


    await createTenderActivity({
  tenderId,
  userId: req.user.id,
  actionType: 'INTERNAL_NOTE_CREATED',
  entityType: 'INTERNAL_NOTE',
  entityId: note.id,
  description: `Internal note of type "${note.note_type}" was added.`,
  metadata: {
    noteId: note.id,
    noteType: note.note_type,
  },
})

    return res.status(201).json({
      success: true,
      message: 'Internal note added successfully.',
      note,
    })
  } catch (error) {
    next(error)
  }
}


export const editTenderInternalNote = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)
    const noteId = Number(req.params.noteId)

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0 ||
      !Number.isInteger(noteId) ||
      noteId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender or note ID.',
      })
    }

    const existingNote =
      await getTenderInternalNoteById(noteId)

    if (
      !existingNote ||
      Number(existingNote.tender_id) !== tenderId
    ) {
      return res.status(404).json({
        success: false,
        message: 'Internal note not found.',
      })
    }

    if (
      req.user.role === 'EMPLOYEE' &&
      Number(existingNote.created_by) !==
        Number(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You can only edit your own internal notes.',
      })
    }

    const noteType =
      req.body.noteType ||
      existingNote.note_type

    const content =
      typeof req.body.content === 'string'
        ? req.body.content.trim()
        : existingNote.content

    if (!ALLOWED_NOTE_TYPES.includes(noteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid internal note type.',
      })
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required.',
      })
    }

    const note = await updateTenderInternalNote({
      noteId,
      noteType,
      content,
    })

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Internal note not found.',
      })
    }

    // --------------------------------------------------
    // Activity log - internal note updated
    // --------------------------------------------------

    const contentChanged =
      (existingNote.content || '') !==
      (note.content || '')

    await createTenderActivity({
      tenderId,
      userId: req.user.id,
      actionType: 'INTERNAL_NOTE_UPDATED',
      entityType: 'INTERNAL_NOTE',
      entityId: noteId,
      description: 'Internal note was updated.',
      metadata: {
        noteId,
        previousNoteType: existingNote.note_type,
        newNoteType: note.note_type,
        contentChanged,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Internal note updated successfully.',
      note,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteTenderInternalNote = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)
    const noteId = Number(req.params.noteId)

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0 ||
      !Number.isInteger(noteId) ||
      noteId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender or note ID.',
      })
    }

    const existingNote =
      await getTenderInternalNoteById(noteId)

    if (
      !existingNote ||
      Number(existingNote.tender_id) !== tenderId
    ) {
      return res.status(404).json({
        success: false,
        message: 'Internal note not found.',
      })
    }

    if (
      req.user.role === 'EMPLOYEE' &&
      Number(existingNote.created_by) !==
        Number(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You can only delete your own internal notes.',
      })
    }

    const archived =
      await archiveTenderInternalNote(noteId)

    if (!archived) {
      return res.status(404).json({
        success: false,
        message:
          'Internal note was not found or is already deleted.',
      })
    }
await createTenderActivity({
  tenderId,
  userId: req.user.id,
  actionType: 'INTERNAL_NOTE_ARCHIVED',
  entityType: 'INTERNAL_NOTE',
  entityId: noteId,
  description: 'Internal note was removed.',
  metadata: {
    noteId,
    noteType: existingNote.note_type,
  },
})
    return res.status(200).json({
      success: true,
      message: 'Internal note deleted successfully.',
    })
  } catch (error) {
    next(error)
  }
}