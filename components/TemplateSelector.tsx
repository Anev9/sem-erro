'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Loader2, FileText, CheckCircle2 } from 'lucide-react'

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Template {
  id: string
  nome: string
  descricao: string | null
  tipo_negocio: string | null
  totalAcoes?: number
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template | null) => void
  selectedTemplateId?: string | null
}

export default function TemplateSelector({ 
  onSelectTemplate, 
  selectedTemplateId 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarTemplates()
  }, [])

  async function buscarTemplates() {
    try {
      // Buscar templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('checklists')
        .select('id, nome, descricao, tipo_negocio')
        .eq('is_template', true)
        .order('nome')

      if (templatesError) throw templatesError

      // Buscar contagem de ações para cada template
      const templatesComAcoes = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { count } = await supabase
            .from('actions')
            .select('*', { count: 'exact', head: true })
            .eq('checklist_id', template.id)

          return {
            ...template,
            totalAcoes: count || 0
          }
        })
      )

      setTemplates(templatesComAcoes)
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      alert('Erro ao carregar templates. Verifique o console.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '2px dashed #e5e7eb'
      }}>
        <Loader2 size={24} style={{ 
          animation: 'spin 1s linear infinite',
          color: '#3b82f6' 
        }} />
        <span style={{ marginLeft: '0.75rem', color: '#6b7280' }}>
          Carregando templates...
        </span>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: '#fef3c7',
        borderRadius: '0.75rem',
        border: '2px solid #fbbf24'
      }}>
        <FileText size={48} style={{ 
          margin: '0 auto 1rem',
          color: '#f59e0b' 
        }} />
        <p style={{ 
          color: '#92400e',
          fontSize: '1rem',
          fontWeight: '500',
          margin: 0
        }}>
          Nenhum template disponível
        </p>
        <p style={{ 
          color: '#78350f',
          fontSize: '0.875rem',
          marginTop: '0.5rem'
        }}>
          Execute os scripts SQL para criar os templates
        </p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '2px solid #e5e7eb'
    }}>
      <p style={{
        fontSize: '0.95rem',
        color: '#4b5563',
        marginBottom: '1.25rem',
        fontWeight: '500'
      }}>
        📋 Selecione um modelo para copiar ({templates.length} disponíveis):
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            style={{
              padding: '1.25rem',
              backgroundColor: selectedTemplateId === template.id ? '#eff6ff' : 'white',
              border: `2px solid ${selectedTemplateId === template.id ? '#3b82f6' : '#e5e7eb'}`,
              borderRadius: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (selectedTemplateId !== template.id) {
                e.currentTarget.style.borderColor = '#93c5fd'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTemplateId !== template.id) {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            {/* Indicador de seleção */}
            {selectedTemplateId === template.id && (
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem'
              }}>
                <CheckCircle2 size={24} style={{ color: '#3b82f6' }} />
              </div>
            )}

            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.5rem',
              paddingRight: '2rem'
            }}>
              {template.nome}
            </h3>
            
            {template.descricao && (
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.75rem',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {template.descricao}
              </p>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.8125rem',
              marginTop: '0.75rem'
            }}>
              {template.tipo_negocio && (
                <span style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontWeight: '500'
                }}>
                  {template.tipo_negocio}
                </span>
              )}
              {template.totalAcoes && template.totalAcoes > 0 && (
                <span style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontWeight: '600'
                }}>
                  {template.totalAcoes} ações
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTemplateId && (
        <button
          onClick={() => onSelectTemplate(null)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            color: '#6b7280',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb'
            e.currentTarget.style.borderColor = '#9ca3af'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.borderColor = '#d1d5db'
          }}
        >
          Limpar seleção
        </button>
      )}
    </div>
  )
}