'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, Copy, FileText, Upload, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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
  foto_obrigatoria: boolean
}

export default function CriarChecklistFuturoPage() {
  const router = useRouter()
  
  const [recorrente, setRecorrente] = useState<'modelo' | 'proprio' | 'importar'>('proprio')
  const [proximaExecucao, setProximaExecucao] = useState('')
  const [tipoNegocio, setTipoNegocio] = useState('')
  const [nomeChecklist, setNomeChecklist] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateSelecionado, setTemplateSelecionado] = useState<string>('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [itensDoTemplate, setItensDoTemplate] = useState<{[key: string]: any[]}>({})
  const [templateExpandido, setTemplateExpandido] = useState<string | null>(null)
  
  const [itens, setItens] = useState<ItemChecklist[]>([
    { titulo: '', descricao: '', ordem: 1, foto_obrigatoria: false }
  ])
  
  const [chaveCompartilhamento, setChaveCompartilhamento] = useState('')
  const [mensagemSalvamento, setMensagemSalvamento] = useState('')

  const [recorrencia, setRecorrencia] = useState<'nenhuma' | 'diaria' | 'semanal' | 'mensal'>('nenhuma')
  const [diasTolerancia, setDiasTolerancia] = useState(0)

  const [empresas, setEmpresas] = useState<{id: string, nome_fantasia: string}[]>([])
  const [colaboradores, setColaboradores] = useState<{id: string, nome: string}[]>([])
  const [empresaId, setEmpresaId] = useState('')
  const [colaboradorId, setColaboradorId] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserId(user.id)
      carregarEmpresas(user.id)
    }
    if (recorrente === 'modelo') {
      buscarTemplates()
    }
  }, [recorrente])

  async function carregarEmpresas(alunoId: string) {
    const res = await fetch(`/api/aluno/empresas?aluno_id=${alunoId}`)
    if (res.ok) setEmpresas(await res.json())
  }

  async function handleEmpresaChange(empId: string) {
    setEmpresaId(empId)
    setColaboradorId('')
    if (!empId || !userId) { setColaboradores([]); return }
    const res = await fetch(`/api/aluno/colaboradores?aluno_id=${userId}`)
    if (res.ok) {
      const todos = await res.json()
      setColaboradores(todos.filter((c: any) => c.empresa_id === empId))
    }
  }

  async function buscarTemplates() {
    setLoadingTemplates(true)
    
    try {
      const { data: templatesData, error: errorTemplates } = await supabase
        .from('checklist_templates')
        .select('id, nome, descricao, categoria')
        .order('nome')

      if (errorTemplates) throw errorTemplates

      const templatesUnicos = templatesData?.reduce((acc: Template[], current) => {
        const existe = acc.find(item => item.id === current.id)
        if (!existe) acc.push(current)
        return acc
      }, []) || []

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

  function baixarModeloCSV() {
    const conteudo = 'Título do item;Descrição (opcional)\nVerificar estoque;Verificar todos os produtos do setor\nLimpar equipamentos;\nFechar caixa;Conferir valores do dia'
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo-checklist.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importarCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const linhas = text.split(/\r?\n/).filter(l => l.trim())
      // Ignora cabeçalho se começar com "Título" ou "titulo"
      const inicio = linhas[0]?.toLowerCase().startsWith('título') || linhas[0]?.toLowerCase().startsWith('titulo') ? 1 : 0
      const novosItens: ItemChecklist[] = linhas.slice(inicio).map((linha, i) => {
        const partes = linha.split(/[;,\t]/)
        return {
          titulo: partes[0]?.trim() || '',
          descricao: partes[1]?.trim() || '',
          ordem: i + 1
        }
      }).filter(item => item.titulo)
      if (novosItens.length === 0) {
        toast.warning('Nenhum item encontrado no arquivo. Verifique o formato.')
        return
      }
      setItens(novosItens)
      setRecorrente('proprio')
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  function adicionarItem() {
    setItens([...itens, { titulo: '', descricao: '', ordem: itens.length + 1, foto_obrigatoria: false }])
  }

  function removerItem(index: number) {
    if (itens.length === 1) {
      toast.warning('Você precisa ter pelo menos 1 item no checklist')
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

  function toggleFotoObrigatoria(index: number) {
    const novosItens = [...itens]
    novosItens[index].foto_obrigatoria = !novosItens[index].foto_obrigatoria
    setItens(novosItens)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMensagemSalvamento('')

    try {
      if (recorrente === 'proprio' || recorrente === 'importar') {
        await criarPropio()
      } else if (recorrente === 'modelo') {
        await criarDeTemplate()
      } else if (recorrente === 'chave') {
        await criarDeChave()
      }
    } catch (error: any) {
      console.error('ERRO:', error)
      toast.error(`Erro: ${error?.message || 'Erro desconhecido'}`)
      setMensagemSalvamento(`❌ Erro: ${error?.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  async function criarPropio() {
    const itensValidos = itens.filter(item => item.titulo.trim() !== '')
    
    if (itensValidos.length === 0) {
      toast.warning('❌ Adicione pelo menos 1 item com título')
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
        recorrencia,
        dias_tolerancia: diasTolerancia,
        aluno_id: Number(userId),
        empresa_id: empresaId || null,
        colaborador_id: colaboradorId || null,
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
      ordem: item.ordem,
      foto_obrigatoria: item.foto_obrigatoria ?? false
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
      toast.warning('Selecione um template')
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
        recorrencia,
        dias_tolerancia: diasTolerancia,
        template_id: templateSelecionado,
        aluno_id: Number(userId),
        empresa_id: empresaId || null,
        colaborador_id: colaboradorId || null,
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
      ordem: item.ordem,
      foto_obrigatoria: item.foto_obrigatoria ?? false
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
      toast.warning('Digite a chave de compartilhamento')
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
      toast.error('Chave inválida')
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
        recorrencia,
        dias_tolerancia: diasTolerancia,
        aluno_id: Number(userId),
        empresa_id: empresaId || null,
        colaborador_id: colaboradorId || null,
        ativo: true
      })
      .select()
      .single()

    if (errorChecklist) throw errorChecklist

    const itensParaInserir = checklistOriginal.itens.map((item: any) => ({
      checklist_futuro_id: novoChecklist.id,
      titulo: item.titulo,
      descricao: item.descricao,
      ordem: item.ordem,
      foto_obrigatoria: item.foto_obrigatoria ?? false
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
                  backgroundColor: recorrente === 'importar' ? '#f0fdf4' : 'transparent',
                  border: `2px solid ${recorrente === 'importar' ? '#10b981' : 'transparent'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="recorrente"
                    value="importar"
                    checked={recorrente === 'importar'}
                    onChange={() => setRecorrente('importar')}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      cursor: 'pointer',
                      accentColor: '#10b981'
                    }}
                  />
                  <Upload size={20} color={recorrente === 'importar' ? '#10b981' : '#6b7280'} />
                  <span style={{ fontSize: '1rem', color: '#374151', fontWeight: recorrente === 'importar' ? '600' : '400' }}>
                    Importar de planilha (CSV/Excel)
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

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={item.foto_obrigatoria}
                          onChange={() => toggleFotoObrigatoria(index)}
                          style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>Foto obrigatória</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO: IMPORTAR PLANILHA */}
            {recorrente === 'importar' && (
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.75rem',
                marginBottom: '2rem',
                border: '2px dashed #10b981'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                  Importar itens de planilha
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                  Faça o upload de um arquivo <strong>.csv</strong> ou <strong>.txt</strong> com um item por linha.
                  Você pode separar título e descrição com ponto e vírgula (<code>;</code>).
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={baixarModeloCSV}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 1rem', backgroundColor: 'white',
                      border: '1px solid #10b981', borderRadius: '0.375rem',
                      cursor: 'pointer', fontSize: '0.875rem', color: '#059669', fontWeight: '500'
                    }}
                  >
                    <Download size={16} />
                    Baixar modelo de planilha
                  </button>
                </div>

                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '0.75rem', padding: '1.5rem',
                  backgroundColor: 'white', borderRadius: '0.5rem',
                  border: '2px dashed #d1d5db', cursor: 'pointer'
                }}>
                  <Upload size={32} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.95rem', color: '#374151', fontWeight: '500' }}>
                    Clique para selecionar o arquivo
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>CSV, TXT — máx. 1MB</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={importarCSV}
                    style={{ display: 'none' }}
                  />
                </label>

                {itens.length > 0 && itens[0].titulo && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: '600', margin: 0 }}>
                      {itens.length} {itens.length === 1 ? 'item importado' : 'itens importados'} — revise abaixo antes de salvar
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Itens importados — mostrar para revisar */}
            {recorrente === 'importar' && itens.length > 0 && itens[0].titulo && (
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.75rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Itens importados (revise e edite se necessário)
                  </h4>
                  <button type="button" onClick={adicionarItem} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white',
                    border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
                    fontSize: '0.875rem', fontWeight: '500'
                  }}>
                    <Plus size={16} /> Adicionar Item
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {itens.map((item, index) => (
                    <div key={index} style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Item {index + 1}</span>
                        {itens.length > 1 && (
                          <button type="button" onClick={() => removerItem(index)} style={{ padding: '0.375rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <input type="text" placeholder="Título do item *" value={item.titulo}
                        onChange={(e) => atualizarItem(index, 'titulo', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.95rem', marginBottom: '0.75rem', outline: 'none' }}
                      />
                      <textarea placeholder="Descrição (opcional)" value={item.descricao}
                        onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                        rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.95rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                  ))}
                </div>
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
                  Recorrência
                </label>
                <select
                  value={recorrencia}
                  onChange={(e) => setRecorrencia(e.target.value as 'nenhuma' | 'diaria' | 'semanal' | 'mensal')}
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
                  <option value="nenhuma">Sem recorrência</option>
                  <option value="diaria">🔄 Diária</option>
                  <option value="semanal">🔄 Semanal</option>
                  <option value="mensal">🔄 Mensal</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Dias de tolerância
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={diasTolerancia}
                  onChange={(e) => setDiasTolerancia(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
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
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.375rem' }}>
                  Dias antes e depois que o funcionário pode realizar
                </p>
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

            {/* Empresa e Colaborador */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.75rem'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                  Empresa
                </label>
                <select
                  value={empresaId}
                  onChange={(e) => handleEmpresaChange(e.target.value)}
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
                  <option value="">Selecione a empresa...</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nome_fantasia}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                  Colaborador responsável
                </label>
                <select
                  value={colaboradorId}
                  onChange={(e) => setColaboradorId(e.target.value)}
                  disabled={!empresaId}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    cursor: empresaId ? 'pointer' : 'not-allowed',
                    backgroundColor: empresaId ? 'white' : '#f3f4f6',
                    opacity: empresaId ? 1 : 0.7
                  }}
                >
                  <option value="">Selecione o colaborador...</option>
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
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