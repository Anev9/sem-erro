'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Info,
  ArrowLeft
} from 'lucide-react'

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
        router.push('/dashboard-admin')
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
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        {/* Header com logo */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => router.push('/dashboard-admin')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: 'white',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            >
              <ArrowLeft size={18} />
              Voltar
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flex: 1
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                backgroundColor: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <img 
                  src="/logo-semerro.jpg" 
                  alt="Sem Erro"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  letterSpacing: '0.02em'
                }}>
                  Upload de Questionários
                </h1>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: '0.25rem 0 0 0'
                }}>
                  Importar questionários em formato CSV
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          {/* Success Alert */}
          {uploadSuccess && (
            <div className="fade-in" style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '1rem',
              padding: '1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                backgroundColor: '#10b981',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h3 style={{
                  color: '#065f46',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0'
                }}>
                  Upload realizado com sucesso!
                </h3>
                <p style={{
                  color: '#047857',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Redirecionando para o dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="fade-in" style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '1rem',
              padding: '1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={24} style={{ color: 'white' }} />
              </div>
              <p style={{
                color: '#991b1b',
                fontSize: '0.95rem',
                margin: 0,
                fontWeight: '500'
              }}>
                {error}
              </p>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {/* Upload Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                padding: '1.5rem',
                color: 'white'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  Selecionar Arquivo
                </h2>
              </div>

              <div style={{ padding: '2rem' }}>
                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? '#8b5cf6' : selectedFile ? '#10b981' : '#d1d5db'}`,
                    borderRadius: '0.75rem',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    backgroundColor: isDragging ? '#f5f3ff' : selectedFile ? '#f0fdf4' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: '1.5rem'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  {selectedFile ? (
                    <div>
                      <div style={{
                        backgroundColor: '#dbeafe',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                      }}>
                        <FileText size={32} style={{ color: '#2563eb' }} />
                      </div>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#047857',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {selectedFile.name}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 1rem 0'
                      }}>
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFile()
                        }}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          color: '#dc2626',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                      >
                        <X size={16} />
                        Remover
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        backgroundColor: '#ede9fe',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                      }}>
                        <Upload size={32} style={{ color: '#8b5cf6' }} />
                      </div>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 0.5rem 0'
                      }}>
                        {isDragging ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        Arquivo CSV (máx. 10MB)
                      </p>
                    </>
                  )}
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading || uploadSuccess}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: !selectedFile || uploading || uploadSuccess ? '#9ca3af' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: !selectedFile || uploading || uploadSuccess ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFile && !uploading && !uploadSuccess) {
                      e.currentTarget.style.backgroundColor = '#7c3aed'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFile && !uploading && !uploadSuccess) {
                      e.currentTarget.style.backgroundColor = '#8b5cf6'
                    }
                  }}
                >
                  {uploading ? (
                    <>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Fazer Upload
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instructions Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                padding: '1.5rem',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  Instruções
                </h2>
                <button
                  onClick={downloadTemplate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                >
                  <Download size={16} />
                  Baixar Modelo
                </button>
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{
                  backgroundColor: '#f5f3ff',
                  border: '1px solid #e9d5ff',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    <Info size={20} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '0.125rem' }} />
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#5b21b6',
                      margin: 0,
                      lineHeight: '1.6'
                    }}>
                      O arquivo deve ter os seguintes cabeçalhos: <strong>Questionário</strong>, <strong>Pergunta</strong> e <strong>Setor</strong>. Deve ser no formato CSV.
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#8b5cf6',
                        borderRadius: '50%'
                      }} />
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        Questionário
                      </h3>
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0 0 0 1.25rem',
                      lineHeight: '1.5'
                    }}>
                      É o título do checklist
                      <br />
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Exemplo: Checklist da limpeza</span>
                    </p>
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#8b5cf6',
                        borderRadius: '50%'
                      }} />
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        Pergunta
                      </h3>
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0 0 0 1.25rem',
                      lineHeight: '1.5'
                    }}>
                      É a descrição da pergunta
                      <br />
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Exemplo: O chão está limpo?</span>
                    </p>
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#8b5cf6',
                        borderRadius: '50%'
                      }} />
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        Setor
                      </h3>
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0 0 0 1.25rem',
                      lineHeight: '1.5'
                    }}>
                      É a tag principal
                      <br />
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Exemplo: limpeza</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}