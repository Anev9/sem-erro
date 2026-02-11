'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Save, Plus, Trash2, Copy, Key, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Template = {
  id: string
  nome: string
  descricao: string | null
  categoria: string | null
  total_itens?: number
}

type ItemChecklist = {
  titulo: string
  descricao: string
  ordem: number
}

export default function CriarChecklistFuturoPage() {
  const router = useRouter()
  
  const [recorrente, setRecorrente] = useState<'modelo' | 'proprio' | 'chave'>('proprio')
  const [proximaExecucao, setProximaExecucao] = useState('')
  const [tipoNegocio, setTipoNegocio] = useState('')
  const [nomeChecklist, setNomeChecklist] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateSelecionado, setTemplateSelecionado] = useState<string>('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [itensDoTemplate, setItensDoTemplate] = useState<{[key: string]: any[]}>({})
  const [templateExpandido, setTemplateExpandido] = useState<string | null>(null)
  
  const [itens, setItens] = useState<ItemChecklist[]>([
    { titulo: '', descricao: '', ordem: 1 }
  ])
  
  const [chaveCompartilhamento, setChaveCompartilhamento] = useState('')
  const [mensagemSalvamento, setMensagemSalvamento] = useState('')

  useEffect(() => {
    if (recorrente === 'modelo') {
      buscarTemplates()
    }
  }, [recorrente])

  async function buscarTemplates() {
    setLoadingTemplates(true)
    
    try {
      const { data: templatesData, error: errorTemplates } = await supabase
        .from('checklist_templates')
        .select('id, nome, descricao, categoria')
        .order('nome')

      if (errorTemplates) throw errorTemplates

      const templatesUnicosPorId = templatesData?.reduce((acc: Template[], current) => {
        const existe = acc.find(item => item.id === current.id)
        if (!existe) acc.push(current)
        return acc
      }, []) || []

      const templatesUnicos = templatesUnicosPorId.reduce((acc: Template[], current) => {
        const existe = acc.find(item => item.nome === current.nome)
        if (!existe) acc.push(current)
        return acc
      }, [])

      const templatesComContagem = await Promise.all(
        templatesUnicos.map(async (template) => {
          const { count } = await supabase
            .from('checklist_template_itens')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id)

          return {
            ...template,
            total_itens: count || 0
          }
        })
      )

      setTemplates(templatesComContagem)

    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  async function verItensDoTemplate(templateId: string) {
    if (templateExpandido === templateId) {
      setTemplateExpandido(null)
      return
    }

    if (itensDoTemplate[templateId]) {
      setTemplateExpandido(templateId)
      return
    }

    try {
      const { data: itens, error } = await supabase
        .from('checklist_template_itens')
        .select('*')
        .eq('template_id', templateId)
        .order('ordem')

      if (error) throw error

      setItensDoTemplate(prev => ({
        ...prev,
        [templateId]: itens || []
      }))
      setTemplateExpandido(templateId)

    } catch (error) {
      console.error('Erro ao buscar itens:', error)
    }
  }

  function adicionarItem() {
    setItens([...itens, { titulo: '', descricao: '', ordem: itens.length + 1 }])
  }

  function removerItem(index: number) {
    if (itens.length === 1) {
      alert('Você precisa ter pelo menos 1 item no checklist')
      return
    }
    const novosItens = itens.filter((_, i) => i !== index)
    novosItens.forEach((item, i) => item.ordem = i + 1)
    setItens(novosItens)
  }

  function atualizarItem(index: number, campo: 'titulo' | 'descricao', valor: string) {
    const novosItens = [...itens]
    novosItens[index][campo] = valor
    setItens(novosItens)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMensagemSalvamento('')

    try {
      if (recorrente === 'proprio') {
        await criarPropio()
      } else if (recorrente === 'modelo') {
        await criarDeTemplate()
      } else if (recorrente === 'chave') {
        await criarDeChave()
      }
    } catch (error: any) {
      console.error('ERRO:', error)
      alert(`Erro: ${error?.message || 'Erro desconhecido'}`)
      setMensagemSalvamento(`❌ Erro: ${error?.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  async function criarPropio() {
    const itensValidos = itens.filter(item => item.titulo.trim() !== '')
    
    if (itensValidos.length === 0) {
      alert('❌ Adicione pelo menos 1 item com título')
      return
    }

    setMensagemSalvamento('⏳ Salvando checklist...')

    const { data: checklistFuturo, error: errorChecklist } = await supabase
      .from('checklists_futuros')
      .insert({
        nome: nomeChecklist,
        descricao: descricao || null,
        tipo_negocio: tipoNegocio,
        proxima_execucao: proximaExecucao,
        ativo: true
      })
      .select()
      .single()

    if (errorChecklist) throw errorChecklist

    setMensagemSalvamento('⏳ Salvando itens...')

    const itensParaInserir = itensValidos.map((item: ItemChecklist) => ({
      checklist_futuro_id: checklistFuturo.id,
      titulo: item.titulo,
      descricao: item.descricao || null,
      ordem: item.ordem
    }))

    const { error: errorItens } = await supabase
      .from('checklist_futuro_itens')
      .insert(itensParaInserir)

    if (errorItens) throw errorItens

    setMensagemSalvamento(`✅ Sucesso! "${nomeChecklist}" criado!`)

    setTimeout(() => {
      router.push('/checklists-futuros')
    }, 1500)
  }

  async function criarDeTemplate() {
    if (!templateSelecionado) {
      alert('Selecione um template')
      return
    }

    setMensagemSalvamento('⏳ Buscando template...')

    const { data: itensTemplate, error: errorItens } = await supabase
      .from('checklist_template_itens')
      .select('*')
      .eq('template_id', templateSelecionado)
      .order('ordem')

    if (errorItens) throw errorItens

    setMensagemSalvamento('⏳ Criando checklist...')

    const { data: checklistFuturo, error: errorChecklist } = await supabase
      .from('checklists_futuros')
      .insert({
        nome: nomeChecklist,
        descricao: descricao || null,
        tipo_negocio: tipoNegocio,
        proxima_execucao: proximaExecucao,
        template_id: templateSelecionado,
        ativo: true
      })
      .select()
      .single()

    if (errorChecklist) throw errorChecklist

    setMensagemSalvamento('⏳ Salvando itens...')

    const itensParaInserir = itensTemplate.map((item: any) => ({
      checklist_futuro_id: checklistFuturo.id,
      titulo: item.titulo,
      descricao: item.descricao || null,
      ordem: item.ordem
    }))

    const { error: errorItensInserir } = await supabase
      .from('checklist_futuro_itens')
      .insert(itensParaInserir)

    if (errorItensInserir) throw errorItensInserir

    setMensagemSalvamento(`✅ Checklist criado com ${itensTemplate.length} itens!`)
    
    setTimeout(() => {
      router.push('/checklists-futuros')
    }, 1500)
  }

  async function criarDeChave() {
    if (!chaveCompartilhamento.trim()) {
      alert('Digite a chave de compartilhamento')
      return
    }

    setMensagemSalvamento('⏳ Buscando checklist...')

    const { data: checklistOriginal, error: errorBusca } = await supabase
      .from('checklists_futuros')
      .select(`
        *,
        itens:checklist_futuro_itens(*)
      `)
      .eq('chave_compartilhamento', chaveCompartilhamento)
      .single()

    if (errorBusca || !checklistOriginal) {
      alert('Chave inválida')
      setMensagemSalvamento('❌ Chave inválida')
      return
    }

    setMensagemSalvamento('⏳ Importando...')

    const { data: novoChecklist, error: errorChecklist } = await supabase
      .from('checklists_futuros')
      .insert({
        nome: nomeChecklist || checklistOriginal.nome,
        descricao: descricao || checklistOriginal.descricao,
        tipo_negocio: tipoNegocio || checklistOriginal.tipo_negocio,
        proxima_execucao: proximaExecucao,
        ativo: true
      })
      .select()
      .single()

    if (errorChecklist) throw errorChecklist

    const itensParaInserir = checklistOriginal.itens.map((item: any) => ({
      checklist_futuro_id: novoChecklist.id,
      titulo: item.titulo,
      descricao: item.descricao,
      ordem: item.ordem
    }))

    const { error: errorItens } = await supabase
      .from('checklist_futuro_itens')
      .insert(itensParaInserir)

    if (errorItens) throw errorItens

    setMensagemSalvamento('✅ Checklist importado!')
    
    setTimeout(() => {
      router.push('/checklists-futuros')
    }, 1500)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        <button
          type="button"
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
          Voltar
        </button>

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
            Criar Checklist Futuro
          </h1>

          <form onSubmit={handleSubmit}>
            
            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                Como deseja criar?
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
                    onChange={() => setRecorrente('proprio')}
                    style={{ 
                      width: '1.25rem', 
                      height: '1.25rem', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <FileText size={20} color={recorrente === 'proprio' ? '#3b82f6' : '#6b7280'} />
                  <span style={{ fontSize: '1rem', color: '#374151', fontWeight: recorrente === 'proprio' ? '600' : '400' }}>
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
                  backgroundColor: recorrente === 'modelo' ? '#eff6ff' : 'transparent',
                  border: `2px solid ${recorrente === 'modelo' ? '#3b82f6' : 'transparent'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="recorrente"
                    value="modelo"
                    checked={recorrente === 'modelo'}
                    onChange={() => setRecorrente('modelo')}
                    style={{ 
                      width: '1.25rem', 
                      height: '1.25rem', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <Copy size={20} color={recorrente === 'modelo' ? '#3b82f6' : '#6b7280'} />
                  <span style={{ fontSize: '1rem', color: '#374151', fontWeight: recorrente === 'modelo' ? '600' : '400' }}>
                    Copiar um modelo pronto
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
                    onChange={() => setRecorrente('chave')}
                    style={{ 
                      width: '1.25rem', 
                      height: '1.25rem', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <Key size={20} color={recorrente === 'chave' ? '#3b82f6' : '#6b7280'} />
                  <span style={{ fontSize: '1rem', color: '#374151', fontWeight: recorrente === 'chave' ? '600' : '400' }}>
                    Usar chave de compartilhamento
                  </span>
                </label>
              </div>
            </div>

            {/* SEÇÃO: COPIAR MODELO */}
            {recorrente === 'modelo' && (
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.75rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  marginBottom: '1rem'
                }}>
                  Selecione um template
                </h4>

                {loadingTemplates ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                    Carregando templates...
                  </p>
                ) : templates.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                    Nenhum template disponível
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {templates.map((template) => (
                      <div key={template.id}>
                        <label
                          style={{
                            display: 'flex',
                            padding: '1rem',
                            backgroundColor: templateSelecionado === template.id ? '#eff6ff' : 'white',
                            border: `2px solid ${templateSelecionado === template.id ? '#3b82f6' : '#e5e7eb'}`,
                            borderRadius: templateExpandido === template.id ? '0.5rem 0.5rem 0 0' : '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <input
                            type="radio"
                            name="template"
                            value={template.id}
                            checked={templateSelecionado === template.id}
                            onChange={(e) => setTemplateSelecionado(e.target.value)}
                            style={{ 
                              marginRight: '0.75rem',
                              width: '1.125rem',
                              height: '1.125rem',
                              cursor: 'pointer',
                              accentColor: '#3b82f6',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              color: '#1f2937',
                              marginBottom: '0.25rem'
                            }}>
                              {template.nome}
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              color: '#6b7280',
                              marginBottom: '0.5rem'
                            }}>
                              {template.descricao || 'Sem descrição'}
                            </div>
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}>
                              <span style={{ 
                                fontSize: '0.8rem', 
                                color: '#9ca3af'
                              }}>
                                {template.total_itens} {template.total_itens === 1 ? 'item' : 'itens'}
                                {template.categoria && ` • ${template.categoria}`}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  verItensDoTemplate(template.id)
                                }}
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#3b82f6',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: 0
                                }}
                              >
                                {templateExpandido === template.id ? '▲ Ocultar itens' : '▼ Ver itens'}
                              </button>
                            </div>
                          </div>
                        </label>

                        {templateExpandido === template.id && itensDoTemplate[template.id] && (
                          <div style={{
                            backgroundColor: 'white',
                            border: '2px solid #e5e7eb',
                            borderTop: 'none',
                            borderRadius: '0 0 0.5rem 0.5rem',
                            padding: '1rem',
                            marginTop: '-1px'
                          }}>
                            <h5 style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#6b7280',
                              marginBottom: '0.75rem'
                            }}>
                              Itens do checklist:
                            </h5>
                            <ol style={{
                              margin: 0,
                              paddingLeft: '1.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}>
                              {itensDoTemplate[template.id].map((item: any) => (
                                <li key={item.id} style={{
                                  fontSize: '0.875rem',
                                  color: '#374151',
                                  lineHeight: '1.5'
                                }}>
                                  <strong>{item.titulo}</strong>
                                  {item.descricao && (
                                    <span style={{ 
                                      color: '#6b7280',
                                      display: 'block',
                                      marginTop: '0.25rem',
                                      fontSize: '0.8rem'
                                    }}>
                                      {item.descricao}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO: FAZER DO PRÓPRIO JEITO */}
            {recorrente === 'proprio' && (
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.75rem',
                marginBottom: '2rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Itens do checklist
                  </h4>
                  <button
                    type="button"
                    onClick={adicionarItem}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <Plus size={16} />
                    Adicionar Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {itens.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '600',
                          color: '#6b7280'
                        }}>
                          Item {index + 1}
                        </span>
                        {itens.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removerItem(index)}
                            style={{
                              padding: '0.375rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Título do item *"
                        value={item.titulo}
                        onChange={(e) => atualizarItem(index, 'titulo', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.95rem',
                          marginBottom: '0.75rem',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                      />

                      <textarea
                        placeholder="Descrição (opcional)"
                        value={item.descricao}
                        onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.95rem',
                          resize: 'vertical',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO: CHAVE DE COMPARTILHAMENTO */}
            {recorrente === 'chave' && (
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.75rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Chave de compartilhamento
                </h4>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  marginBottom: '1rem'
                }}>
                  Digite a chave que foi compartilhada com você
                </p>
                <input
                  type="text"
                  placeholder="Ex: ABC123XYZ"
                  value={chaveCompartilhamento}
                  onChange={(e) => setChaveCompartilhamento(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>
            )}

            {/* CAMPOS COMUNS */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.75rem'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Próxima execução *
                </label>
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
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Tipo de negócio *
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
                >
                  <option value="">Selecione...</option>
                  <option value="supermercado">Supermercado</option>
                  <option value="farmacia">Farmácia</option>
                  <option value="restaurante">Restaurante</option>
                  <option value="loja">Loja de Varejo</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Nome do checklist *
              </label>
              <input
                type="text"
                value={nomeChecklist}
                onChange={(e) => setNomeChecklist(e.target.value)}
                placeholder="Digite o nome do checklist"
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
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Adicione informações adicionais"
                rows={3}
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
              />
            </div>

            {mensagemSalvamento && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem 1.5rem',
                backgroundColor: mensagemSalvamento.includes('❌') ? '#fee2e2' : 
                               mensagemSalvamento.includes('✅') ? '#dcfce7' : '#dbeafe',
                border: `2px solid ${mensagemSalvamento.includes('❌') ? '#ef4444' : 
                                    mensagemSalvamento.includes('✅') ? '#22c55e' : '#3b82f6'}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: mensagemSalvamento.includes('❌') ? '#991b1b' : 
                       mensagemSalvamento.includes('✅') ? '#15803d' : '#1e40af',
                textAlign: 'center'
              }}>
                {mensagemSalvamento}
              </div>
            )}

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
                transition: 'all 0.2s ease'
              }}
            >
              <Save size={18} />
              {loading ? 'Salvando...' : 'Criar Checklist'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}