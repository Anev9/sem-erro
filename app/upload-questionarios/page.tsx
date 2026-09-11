'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Info } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const INSTRUCOES = [
  { titulo: 'Questionário', descricao: 'É o título do checklist', exemplo: 'Checklist da limpeza' },
  { titulo: 'Pergunta', descricao: 'É a descrição da pergunta', exemplo: 'O chão está limpo?' },
  { titulo: 'Setor', descricao: 'É a tag principal', exemplo: 'limpeza' },
]

export default function UploadQuestionarios() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file)
      setError('')
    } else {
      setError('Por favor, selecione um arquivo CSV válido')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file)
      setError('')
    } else {
      setError('Por favor, selecione um arquivo CSV válido')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Simula upload - AQUI VOCÊ VAI INTEGRAR COM O SUPABASE
      await new Promise(resolve => setTimeout(resolve, 2000))

      setUploadSuccess(true)

      setTimeout(() => {
        router.push('/dashboard-aluno')
      }, 2000)

    } catch (err) {
      setError('Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const csvContent = "Questionário,Pergunta,Setor\nChecklist da limpeza,O chão está limpo?,limpeza\nChecklist da limpeza,As janelas estão limpas?,limpeza"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_questionario.csv'
    link.click()
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <PageHeader
          title="Upload de Questionários"
          subtitle="Importar questionários em formato CSV"
          backHref="/dashboard-admin"
        />

        {/* Success Alert */}
        {uploadSuccess && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-teal-tint p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Upload realizado com sucesso!</h3>
              <p className="text-sm text-ink-muted">Redirecionando para o dashboard...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-coral-tint p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral">
              <AlertCircle size={20} className="text-white" />
            </div>
            <p className="text-sm font-medium text-coral">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upload Card */}
          <Card className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-surface-2 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet">
                <Upload size={22} className="text-white" />
              </div>
              <h2 className="font-display text-lg font-bold text-ink">Selecionar Arquivo</h2>
            </div>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mb-5 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? 'border-violet bg-violet-tint'
                  : selectedFile
                  ? 'border-teal bg-teal-tint'
                  : 'border-ink-faint/30 bg-surface-2'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />

              {selectedFile ? (
                <div>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
                    <FileText size={32} className="text-teal" />
                  </div>
                  <p className="mb-1 text-base font-semibold text-teal">{selectedFile.name}</p>
                  <p className="mb-4 text-sm text-ink-muted">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
                    icon={<X size={16} />}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-tint">
                    <Upload size={32} className="text-violet" />
                  </div>
                  <p className="mb-1.5 text-base font-semibold text-ink">
                    {isDragging ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-ink-muted">Arquivo CSV (máx. 10MB)</p>
                </>
              )}
            </div>

            {/* Upload Button */}
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading || uploadSuccess}
              className="w-full justify-center py-3"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Fazer Upload
                </>
              )}
            </Button>
          </Card>

          {/* Instructions Card */}
          <Card className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-surface-2 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet">
                  <Info size={22} className="text-white" />
                </div>
                <h2 className="font-display text-lg font-bold text-ink">Instruções</h2>
              </div>
              <Button variant="secondary" size="sm" onClick={downloadTemplate} icon={<Download size={16} />}>
                Baixar Modelo
              </Button>
            </div>

            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-violet-tint p-4">
              <Info size={18} className="mt-0.5 flex-shrink-0 text-violet" />
              <p className="text-sm leading-relaxed text-ink-muted">
                O arquivo deve ter os seguintes cabeçalhos: <strong className="text-ink">Questionário</strong>, <strong className="text-ink">Pergunta</strong> e <strong className="text-ink">Setor</strong>. Deve ser no formato CSV.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {INSTRUCOES.map(({ titulo, descricao, exemplo }) => (
                <div key={titulo}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-violet" />
                    <h3 className="text-sm font-semibold text-ink">{titulo}</h3>
                  </div>
                  <p className="ml-5 text-sm leading-relaxed text-ink-muted">
                    {descricao}
                    <br />
                    <span className="text-xs text-ink-faint">Exemplo: {exemplo}</span>
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
