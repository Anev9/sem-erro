'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Save, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import TemplateSelector from '@/components/TemplateSelector'

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

export default function CriarChecklistFuturoPage() {
  const router = useRouter()
  
  const [recorrente, setRecorrente] = useState('modelo')
  const [templateSelecionado, setTemplateSelecionado] = useState<Template | null>(null)
  const [proximaExecucao, setProximaExecucao] = useState('')
  const [tipoNegocio, setTipoNegocio] = useState('')
  const [nomeChecklist, setNomeChecklist] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)

  async function copiarAcoesDoTemplate(templateId: string, novoChecklistId: string) {
    try {
      // Buscar todas as ações do template
      const { data: acoes, error } = await supabase
        .from('actions')
        .select('*')
        .eq('checklist_id', templateId)
        .order('ordem')

      if (error) throw error

      if (!acoes || acoes.length === 0) {
        console.log('Template não tem ações para copiar')
        return
      }

      // Copiar as ações para o novo checklist
      const acoesParaCopiar = acoes.map(acao => ({
        checklist_id: novoChecklistId,
        titulo: acao.titulo,
        descricao: acao.descricao,
        ordem: acao.ordem,
        obrigatoria: acao.obrigatoria || false,
        tipo: acao.tipo || 'checkbox',
        status: 'pendente'
      }))

      const { error: insertError } = await supabase
        .from('actions')
        .insert(acoesParaCopiar)

      if (insertError) throw insertError

      console.log(`✅ ${acoesParaCopiar.length} ações copiadas com sucesso!`)
      
    } catch (error) {
      console.error('Erro ao copiar ações:', error)
      throw error
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (recorrente === 'modelo' && !templateSelecionado) {
        alert('⚠️ Selecione um template para copiar!')
        setLoading(false)
        return
      }

      // Definir nome (usar nome do template se não informado)
      const nomeFinal = nomeChecklist || templateSelecionado?.nome || 'Checklist sem nome'

      // Criar o novo checklist
      const { data: novoChecklist, error: checklistError } = await supabase
        .from('checklists')
        .insert({
          nome: nomeFinal,
          descricao: descricao || templateSelecionado?.descricao,
          tipo_negocio: tipoNegocio,
          proxima_execucao: proximaExecucao || null,
          is_template: false,
          status: 'ativo'
        })
        .select()
        .single()

      if (checklistError) throw checklistError

      console.log('✅ Checklist criado:', novoChecklist)

      // Se copiou de template, copiar as ações também
      if (recorrente === 'modelo' && templateSelecionado) {
        await copiarAcoesDoTemplate(templateSelecionado.id, novoChecklist.id)
      }

      alert('✅ Checklist criado com sucesso!')
      router.push('/checklists-futuros')
      
    } catch (error) {
      console.error('Erro ao criar checklist:', error)
      alert('❌ Erro ao criar checklist. Verifique o console para mais detalhes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Botão Voltar */}
        <button
          onClick={() => router.push('/checklists-futuros')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginBottom: '2rem',
            color: '#374151',
            fontSize: '0.95rem'
          }}
        >
          <ArrowLeft size={18} />
          Voltar para Checklists Programados
        </button>

        {/* Card principal */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Criando novo checklist que vai acontecer no futuro
          </h1>

          <form onSubmit={handleSubmit}>
            
            {/* Seção Recorrente */}
            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                Recorrente
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: recorrente === 'modelo' ? '#eff6ff' : 'transparent',
                  border: `2px solid ${recorrente === 'modelo' ? '#3b82f6' : 'transparent'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="recorrente"
                    value="modelo"
                    checked={recorrente === 'modelo'}
                    onChange={(e) => {
                      setRecorrente(e.target.value)
                      setTemplateSelecionado(null)
                    }}
                    style={{ 
                      width: '1.25rem', 
                      height: '1.25rem', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <span style={{ fontSize: '1rem', color: '#374151' }}>
                    Copiar um modelo do pronto pra mim
                  </span>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: recorrente === 'proprio' ? '#eff6ff' : 'transparent',
                  border: `2px solid ${recorrente === 'proprio' ? '#3b82f6' : 'transparent'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="recorrente"
                    value="proprio"
                    checked={recorrente === 'proprio'}
                    onChange={(e) => setRecorrente(e.target.value)}
                    style={{ 
                      width: '1.25rem', 
                      height: '1.25rem', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <span style={{ fontSize: '1rem', color: '#374151' }}>
                    Fazer do meu jeito
                  </span>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: recorrente === 'chave' ? '#eff6ff' : 'transparent',
                  border: `2px solid ${recorrente === 'chave' ? '#3b82f6' : 'transparent'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="recorrente"
                    value="chave"
                    checked={recorrente === 'chave'}
                    onChange={(e) => setRecorrente(e.target.value)}
                    style={{ 
                      width: '1.25rem', 
                      height: '1.25rem', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <span style={{ fontSize: '1rem', color: '#374151' }}>
                    Usar uma chave
                  </span>
                </label>
              </div>
            </div>

            {/* Mostrar selector de templates quando "modelo" estiver selecionado */}
            {recorrente === 'modelo' && (
              <div style={{ marginBottom: '2rem' }}>
                <TemplateSelector
                  onSelectTemplate={setTemplateSelecionado}
                  selectedTemplateId={templateSelecionado?.id}
                />
              </div>
            )}

            {/* Próxima execução */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Próxima execução
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar
                  size={20}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="date"
                  value={proximaExecucao}
                  onChange={(e) => setProximaExecucao(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            {/* Tipo de negócio */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Selecione o tipo de negócio
              </label>
              <select
                value={tipoNegocio}
                onChange={(e) => setTipoNegocio(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              >
                <option value="">Selecione...</option>
                <option value="Supermercado">Supermercado</option>
                <option value="Farmácia">Farmácia</option>
                <option value="Restaurante">Restaurante</option>
                <option value="Varejo">Loja de Varejo</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Gestão">Gestão</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Nome do checklist */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Nome do checklist {templateSelecionado && '(opcional - usará o nome do template)'}
              </label>
              <input
                type="text"
                value={nomeChecklist}
                onChange={(e) => setNomeChecklist(e.target.value)}
                placeholder={templateSelecionado?.nome || 'Digite o nome do checklist'}
                required={!templateSelecionado}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Descrição ou observações
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={templateSelecionado?.descricao || 'Adicione informações adicionais sobre este checklist'}
                rows={5}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  backgroundColor: 'white',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Botão Criar */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2rem',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#2563eb'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#3b82f6'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Criando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Criar Checklist
                </>
              )}
            </button>

            {/* Texto explicativo */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem 1.25rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              borderLeft: '4px solid #9ca3af'
            }}>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.9rem',
                margin: 0,
                lineHeight: '1.6',
                fontStyle: 'italic'
              }}>
                Nessa tela você cria uma programação de checklists que ocorrerão frequentemente. 
                Você pode usar um modelo pronto ou fazer do seu próprio jeito. Para fazer um do seu jeito 
                clique em criar manualmente.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}