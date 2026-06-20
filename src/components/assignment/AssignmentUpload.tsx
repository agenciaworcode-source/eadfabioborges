'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle2, FileText, AlertCircle } from 'lucide-react'
import type { AssignmentData, SubmissionData } from '@/hooks/use-assignment'

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip']
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/zip', 'application/x-zip-compressed', 'application/octet-stream',
])
const MAX_SIZE_BYTES = 52_428_800 // 50 MB

interface AssignmentUploadProps {
  assignment: AssignmentData
  submission: SubmissionData | null
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function AssignmentUpload({
  assignment,
  submission,
  onUpload,
  isUploading,
}: AssignmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.has(file.type)) {
      return 'Tipo não permitido. Use PDF, imagem (JPG/PNG/GIF/WebP) ou ZIP.'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Arquivo muito grande. Máximo: 50 MB. Seu arquivo: ${formatBytes(file.size)}`
    }
    return null
  }

  function handleFileSelect(file: File) {
    const err = validateFile(file)
    if (err) {
      setClientError(err)
      setSelectedFile(null)
    } else {
      setClientError(null)
      setSelectedFile(file)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return
    await onUpload(selectedFile)
  }

  // Estado: já entregue
  if (submission) {
    return (
      <div
        className="p-6"
        style={{ background: '#f2f2f2', borderTop: '1px solid #e6e6e8' }}
      >
        <h2 className="mb-1 text-base font-semibold" style={{ color: '#1d1d1f' }}>
          {assignment.title}
        </h2>
        {assignment.instructions && (
          <p className="mb-4 text-sm" style={{ color: '#6e6e73' }}>
            {assignment.instructions}
          </p>
        )}

        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: 'rgba(23,138,74,.08)', border: '1px solid rgba(23,138,74,.2)' }}
        >
          <CheckCircle2 className="h-5 w-5 flex-none" style={{ color: '#178a4a' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#178a4a' }}>
              Tarefa enviada ✓
            </p>
            <p className="text-xs" style={{ color: '#6e6e73' }}>
              {formatDate(submission.created_at)}
            </p>
          </div>
          {submission.file_url && (
            <a
              href={submission.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
              style={{ borderColor: '#d8d8db', color: '#1d1d1f' }}
            >
              Ver arquivo
            </a>
          )}
        </div>

        {/* Resultado da correção */}
        {submission.grade !== null && (
          <div
            className="mt-3 rounded-xl p-4"
            style={{ background: '#fff', border: '1px solid #e6e6e8' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>
                Nota: {submission.grade}/100
              </p>
              {submission.graded_at && (
                <p className="text-xs" style={{ color: '#6e6e73' }}>
                  Corrigida em {formatDate(submission.graded_at)}
                </p>
              )}
            </div>
            {submission.feedback && (
              <p className="mt-2 text-sm" style={{ color: '#6e6e73' }}>
                {submission.feedback}
              </p>
            )}
          </div>
        )}

        {submission.grade === null && (
          <p className="mt-3 text-xs text-center" style={{ color: '#6e6e73' }}>
            Aguardando correção do instrutor
          </p>
        )}
      </div>
    )
  }

  // Estado: formulário de upload
  return (
    <form
      onSubmit={handleSubmit}
      className="p-6"
      style={{ background: '#f2f2f2', borderTop: '1px solid #e6e6e8' }}
    >
      <h2 className="mb-1 text-base font-semibold" style={{ color: '#1d1d1f' }}>
        {assignment.title}
      </h2>
      {assignment.instructions && (
        <p className="mb-4 text-sm" style={{ color: '#6e6e73' }}>
          {assignment.instructions}
        </p>
      )}
      {assignment.deadline && (
        <p className="mb-4 text-xs" style={{ color: '#dc3535' }}>
          Prazo: {formatDate(assignment.deadline)}
        </p>
      )}

      {/* Área drag-and-drop */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 transition"
        style={{
          borderColor: dragOver ? '#1d1d1f' : '#d8d8db',
          background: dragOver ? 'rgba(0,0,0,.03)' : '#fff',
        }}
      >
        {selectedFile ? (
          <>
            <FileText className="h-8 w-8" style={{ color: '#1d1d1f' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: '#1d1d1f' }}>
                {selectedFile.name}
              </p>
              <p className="text-xs" style={{ color: '#6e6e73' }}>
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            <p className="text-xs" style={{ color: '#6e6e73' }}>
              Clique para trocar o arquivo
            </p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8" style={{ color: '#6e6e73' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: '#1d1d1f' }}>
                Arraste o arquivo ou clique para selecionar
              </p>
              <p className="text-xs" style={{ color: '#6e6e73' }}>
                PDF, imagem ou ZIP · máx. 50 MB
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(',')}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
      />

      {/* Erro de validação */}
      {clientError && (
        <div className="mt-3 flex items-start gap-2 text-sm" style={{ color: '#dc3535' }}>
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          {clientError}
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedFile || isUploading || !!clientError}
        className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-white transition disabled:opacity-40"
        style={{ background: '#1d1d1f' }}
      >
        {isUploading ? 'Enviando...' : 'Enviar tarefa'}
      </button>
    </form>
  )
}
