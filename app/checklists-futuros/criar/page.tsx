'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Save, Plus, Trash2, Copy, Key, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Tipos
type Template = {
  id: string
  nome: string
  descricao: string | null
  categoria: string | null
  total_itens: number
}

type ItemChecklist = {
  titulo: string
  descricao: string
  ordem: number
}

export default function CriarChecklistFuturoPage() {
  const router = useRouter()
  
  // Estados básicos
  const [recorrente, setRecorrente] = useState<'modelo' | 'proprio' | 'chave'>('modelo')
  const [proximaExecucao, setProximaExecucao] = useState('')
  const [tipoNegocio, setTipoNegocio] = useState('')
  const [nomeChecklist, setNomeChecklist] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Estados para templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateSelecionado, setTemplateSelecionado] = useState<string>('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  
  // Estados para criar do próprio jeito
  const [itens, setItens] = useState<ItemChecklist[]>([
    { titulo: '', descricao: '', ordem: 1 }
  ])
  
  // Estados para usar chave
  const [chaveCompartilhamento, setChaveCompartilhamento] = useState('')

  // Buscar templates quando selecionar essa opção
  useEffect(() => {
    if (recorrente === 'modelo') {
      buscarTemplates()
    }
  }, [recorrente])

  async function buscarTemplates() {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔐 Sessão:', session)
    console.log('👤 Usuário:', session?.user?.email)
    
    if (!session) {
      alert('Você não está autenticado!')
      return
    }

    setLoadingTemplates(true)
    try {
      // Primeiro, buscar os templates
      const { data: templatesData, error: errorTemplates } = await supabase
        .from('checklist_templates')
        .select('id, nome, descricao, categoria')
        .order('nome')

      if (errorTemplates) {
        console.error('❌ Erro ao buscar templates:', errorTemplates)
        throw errorTemplates
      }

      console.log('📋 Templates encontrados:', templatesData)

      // Depois, buscar a contagem de itens para cada template
      const templatesComContagem = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { count, error: errorCount } = await supabase
            .from('checklist_template_itens')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id)

          if (errorCount) {
            console.error(`❌ Erro ao contar itens do template ${template.id}:`, errorCount)
          }

          return {
            ...template,
            total_itens: count || 0
          }
        })
      )

      console.log('✅ Templates formatados:', templatesComContagem)
      setTemplates(templatesComContagem)

    } catch (error) {
      console.error('❌ Erro geral:', error)
      alert('Erro ao carregar templates: ' + (error as Error).message)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Adicionar novo item
  function adicionarItem() {
    setItens([...itens, { titulo: '', descricao: '', ordem: itens.length + 1 }])
  }

  // Remover item
  function removerItem(index: number) {
    if (itens.length === 1) {
      alert('Você precisa ter pelo menos 1 item no checklist')
      return
    }
    const novosItens = itens.filter((_, i) => i !== index)
    // Reordenar
    novosItens.forEach((item, i) => item.ordem = i + 1)
    setItens(novosItens)
  }

  // Atualizar item
  function atualizarItem(index: number, campo: 'titulo' | 'descricao', valor: string) {
    const novosItens = [...itens]
    novosItens[index][campo] = valor
    setItens(novosItens)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (recorrente === 'modelo') {
        await criarDeTemplate()
      } else if (recorrente === 'proprio') {
        await criarPropio()
      } else if (recorrente === 'chave') {
        await criarDeChave()
      }
    } catch (error) {
      console.error('Erro ao criar checklist:', error)
      alert('Erro ao criar checklist')
    } finally {
      setLoading(false)
    }
  }

  async function criarDeTemplate() {
    if (!templateSelecionado) {
      alert('Selecione um template')
      return
    }

    // 1. Buscar itens do template
    const { data: itensTemplate, error: errorItens } = await supabase
      .from('checklist_template_itens')
      .select('*')
      .eq('template_id', templateSelecionado)
      .order('ordem')

    if (errorItens) throw errorItens

    // 2. Criar checklist futuro
    const { data: checklistFuturo, error: errorChecklist } = await supabase
      .from('checklists_futuros')
      .insert({
        nome: nomeChecklist,
        descricao,
        tipo_negocio: tipoNegocio,
        proxima_execucao: proximaExecucao,
        template_id: templateSelecionado,
        ativo: true
      })
      .select()
      .single()

    if (errorChecklist) throw errorChecklist

    // 3. Copiar itens para o checklist futuro
    const itensParaInserir = itensTemplate.map((item: any) => ({
      checklist_futuro_id: checklistFuturo.id,
      titulo: item.titulo,
      descricao: item.descricao,
      ordem: item.ordem
    }))

    const { error: errorItensInserir } = await supabase
      .from('checklist_futuro_itens')
      .insert(itensParaInserir)

    if (errorItensInserir) throw errorItensInserir

    alert('Checklist criado com sucesso!')
    router.push('/checklists-futuros')
  }

  async function criarPropio() {
    // Validar itens
    const itensValidos = itens.filter(item => item.titulo.trim() !== '')
    
    if (itensValidos.length === 0) {
      alert('Adicione pelo menos 1 item com título')
      return
    }

    // 1. Criar checklist futuro
    const { data: checklistFuturo, error: errorChecklist } = await supabase
      .from('checklists_futuros')
      .insert({
        nome: nomeChecklist,
        descricao,
        tipo_negocio: tipoNegocio,
        proxima_execucao: proximaExecucao,
        ativo: true
      })
      .select()
      .single()

    if (errorChecklist) throw errorChecklist

    // 2. Inserir itens
    const itensParaInserir = itensValidos.map((item: ItemChecklist) => ({
      checklist_futuro_id: checklistFuturo.id,
      titulo: item.titulo,
      descricao: item.descricao,
      ordem: item.ordem
    }))

    const { error: errorItens } = await supabase
      .from('checklist_futuro_itens')
      .insert(itensParaInserir)

    if (errorItens) throw errorItens

    alert('Checklist criado com sucesso!')
    router.push('/checklists-futuros')
  }

  async function criarDeChave() {
    if (!chaveCompartilhamento.trim()) {
      alert('Digite a chave de compartilhamento')
      return
    }

    // 1. Buscar checklist pela chave
    const { data: checklistOriginal, error: errorBusca } = await supabase
      .from('checklists_futuros')
      .select(`
        *,
        itens:checklist_futuro_itens(*)
      `)
      .eq('chave_compartilhamento', chaveCompartilhamento)
      .single()

    if (errorBusca || !checklistOriginal) {
      alert('Chave inválida ou checklist não encontrado')
      return
    }

    // 2. Criar cópia do checklist
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

    // 3. Copiar itens
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

    alert('Checklist importado com sucesso!')
    router.push('/checklists-futuros')
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
                    Copiar um modelo pronto pra mim
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
                    Usar uma chave
                  </span>
                </label>
              </div>
            </div>

            {/* CONTEÚDO BASEADO NA SELEÇÃO */}
            
            {/* OPÇÃO 1: COPIAR MODELO */}
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
                      <label
                        key={template.id}
                        style={{
                          display: 'flex',
                          padding: '1rem',
                          backgroundColor: templateSelecionado === template.id ? '#eff6ff' : 'white',
                          border: `2px solid ${templateSelecionado === template.id ? '#3b82f6' : '#e5e7eb'}`,
                          borderRadius: '0.5rem',
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
                            accentColor: '#3b82f6'
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
                            fontSize: '0.8rem', 
                            color: '#9ca3af'
                          }}>
                            {template.total_itens} {template.total_itens === 1 ? 'item' : 'itens'}
                            {template.categoria && ` • ${template.categoria}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OPÇÃO 2: FAZER DO PRÓPRIO JEITO */}
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

            {/* OPÇÃO 3: USAR CHAVE */}
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
                  Digite a chave que foi compartilhada com você para importar um checklist
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
              {/* Próxima execução */}
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
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
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

            {/* Nome do checklist */}
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
                placeholder="Adicione informações adicionais sobre este checklist"
                rows={4}
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
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#2563eb'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#3b82f6'
              }}
            >
              <Save size={18} />
              {loading ? 'Criando...' : 'Criar Checklist'}
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
                <strong>💡 Dica:</strong> Escolha uma das opções acima. 
                {recorrente === 'modelo' && ' Ao copiar um template, você pode editar o nome e descrição mas os itens virão prontos.'}
                {recorrente === 'proprio' && ' Criando do seu jeito, você tem controle total sobre todos os itens do checklist.'}
                {recorrente === 'chave' && ' Usando uma chave, você importa um checklist que alguém compartilhou com você.'}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}