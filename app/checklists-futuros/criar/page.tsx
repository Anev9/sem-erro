'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Plus, Trash2, Copy, FileText, Upload, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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

const inputClass = 'w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60'
const labelClass = 'mb-2 block text-sm font-semibold text-ink-muted'

const OPCOES_CRIACAO = [
  { value: 'proprio', label: 'Fazer do meu jeito', icon: FileText, tone: 'brand' },
  { value: 'modelo', label: 'Copiar um modelo pronto', icon: Copy, tone: 'brand' },
  { value: 'importar', label: 'Importar de planilha (CSV/Excel)', icon: Upload, tone: 'teal' },
] as const

const toneClasses = {
  brand: { bgActive: 'bg-brand-tint', borderActive: 'border-brand', icon: 'text-brand', accent: 'accent-brand' },
  teal: { bgActive: 'bg-teal-tint', borderActive: 'border-teal', icon: 'text-teal', accent: 'accent-teal' },
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
  const [horaLimite, setHoraLimite] = useState('')

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

  function decodeCsvBuffer(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    // BOM UTF-8 (EF BB BF) — o arquivo é UTF-8 de verdade
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return new TextDecoder('utf-8').decode(bytes)
    }
    const utf8 = new TextDecoder('utf-8').decode(bytes)
    // Se a decodificação UTF-8 gerar caracteres inválidos (�), o arquivo
    // provavelmente foi salvo pelo Excel como CSV ANSI (Windows-1252), que é
    // o padrão do Windows em português — refaz a leitura com essa codificação.
    if (utf8.includes('�')) {
      return new TextDecoder('windows-1252').decode(bytes)
    }
    return utf8
  }

  function importarCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      const text = decodeCsvBuffer(buffer)
      const linhas = text.split(/\r?\n/).filter(l => l.trim())
      // Ignora cabeçalho se começar com "Título" ou "titulo"
      const inicio = linhas[0]?.toLowerCase().startsWith('título') || linhas[0]?.toLowerCase().startsWith('titulo') ? 1 : 0
      const novosItens: ItemChecklist[] = linhas.slice(inicio).map((linha, i): ItemChecklist => {
        const partes = linha.split(/[;,\t]/)
        return {
          titulo: partes[0]?.trim() || '',
          descricao: partes[1]?.trim() || '',
          ordem: i + 1,
          foto_obrigatoria: false
        }
      }).filter(item => item.titulo)
      if (novosItens.length === 0) {
        toast.warning('Nenhum item encontrado no arquivo. Verifique o formato.')
        return
      }
      setItens(novosItens)
      setRecorrente('proprio')
    }
    reader.readAsArrayBuffer(file)
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
        hora_limite: horaLimite || null,
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
        hora_limite: horaLimite || null,
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
        hora_limite: horaLimite || null,
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

  function renderItensEditor(titulo: string) {
    return (
      <div className="rounded-2xl bg-surface-2 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-ink">{titulo}</h4>
          <Button type="button" variant="primary" size="sm" onClick={adicionarItem} icon={<Plus size={16} />}>
            Adicionar Item
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {itens.map((item, index) => (
            <div key={index} className="rounded-xl bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-muted">Item {index + 1}</span>
                {itens.length > 1 && (
                  <button type="button" onClick={() => removerItem(index)} className="text-coral">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Título do item *"
                value={item.titulo}
                onChange={(e) => atualizarItem(index, 'titulo', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                className={`${inputClass} mb-3`}
              />

              <textarea
                placeholder="Descrição (opcional)"
                value={item.descricao}
                onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                rows={2}
                className={`${inputClass} resize-y font-sans`}
              />

              <label className="mt-3 flex select-none items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.foto_obrigatoria}
                  onChange={() => toggleFotoObrigatoria(index)}
                  className="h-4 w-4 cursor-pointer accent-brand"
                />
                <span className="text-sm text-ink-muted">Foto obrigatória</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const mensagemTone = mensagemSalvamento.includes('❌')
    ? { bg: 'bg-coral-tint', text: 'text-coral' }
    : mensagemSalvamento.includes('✅')
    ? { bg: 'bg-teal-tint', text: 'text-teal' }
    : { bg: 'bg-blue-tint', text: 'text-blue' }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <PageHeader title="Criar Checklist Futuro" backHref="/checklists-futuros" />

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit}>

            <div className="mb-8">
              <h3 className="mb-3 text-base font-bold text-ink">Como deseja criar?</h3>

              <div className="flex flex-col gap-2.5">
                {OPCOES_CRIACAO.map(({ value, label, icon: Icon, tone }) => {
                  const t = toneClasses[tone]
                  const ativo = recorrente === value
                  return (
                    <label
                      key={value}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-colors ${ativo ? `${t.bgActive} ${t.borderActive}` : 'border-transparent'}`}
                    >
                      <input
                        type="radio"
                        name="recorrente"
                        value={value}
                        checked={ativo}
                        onChange={() => setRecorrente(value)}
                        className={`h-5 w-5 cursor-pointer ${t.accent}`}
                      />
                      <Icon size={20} className={ativo ? t.icon : 'text-ink-faint'} />
                      <span className={`text-sm text-ink ${ativo ? 'font-semibold' : ''}`}>{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* SEÇÃO: COPIAR MODELO */}
            {recorrente === 'modelo' && (
              <div className="mb-8 rounded-2xl bg-surface-2 p-6">
                <h4 className="mb-4 text-sm font-semibold text-ink">Selecione um template</h4>

                {loadingTemplates ? (
                  <p className="py-8 text-center text-sm text-ink-muted">Carregando templates...</p>
                ) : templates.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-muted">Nenhum template disponível</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {templates.map((template) => {
                      const selecionado = templateSelecionado === template.id
                      const expandido = templateExpandido === template.id
                      return (
                        <div key={template.id}>
                          <label
                            className={`flex rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                              selecionado ? 'border-brand bg-brand-tint' : 'border-transparent bg-white'
                            } ${expandido ? 'rounded-b-none' : ''}`}
                          >
                            <input
                              type="radio"
                              name="template"
                              value={template.id}
                              checked={selecionado}
                              onChange={(e) => setTemplateSelecionado(e.target.value)}
                              className="mr-3 h-[1.125rem] w-[1.125rem] flex-shrink-0 cursor-pointer accent-brand"
                            />
                            <div className="flex-1">
                              <div className="mb-1 font-semibold text-ink">{template.nome}</div>
                              <div className="mb-2 text-sm text-ink-muted">{template.descricao || 'Sem descrição'}</div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-ink-faint">
                                  {template.total_itens} {template.total_itens === 1 ? 'item' : 'itens'}
                                  {template.categoria && ` • ${template.categoria}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); verItensDoTemplate(template.id) }}
                                  className="text-xs font-medium text-brand underline"
                                >
                                  {expandido ? '▲ Ocultar itens' : '▼ Ver itens'}
                                </button>
                              </div>
                            </div>
                          </label>

                          {expandido && itensDoTemplate[template.id] && (
                            <div className="rounded-b-xl bg-white p-4">
                              <h5 className="mb-3 text-sm font-semibold text-ink-muted">Itens do checklist:</h5>
                              <ol className="flex flex-col gap-2 pl-6">
                                {itensDoTemplate[template.id].map((item: any) => (
                                  <li key={item.id} className="list-decimal text-sm leading-relaxed text-ink">
                                    <strong>{item.titulo}</strong>
                                    {item.descricao && (
                                      <span className="mt-1 block text-xs text-ink-muted">{item.descricao}</span>
                                    )}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO: FAZER DO PRÓPRIO JEITO */}
            {recorrente === 'proprio' && (
              <div className="mb-8">{renderItensEditor('Itens do checklist')}</div>
            )}

            {/* SEÇÃO: IMPORTAR PLANILHA */}
            {recorrente === 'importar' && (
              <div className="mb-8 rounded-2xl border-2 border-dashed border-teal bg-teal-tint p-6">
                <h4 className="mb-1 text-sm font-semibold text-ink">Importar itens de planilha</h4>
                <p className="mb-5 text-sm text-ink-muted">
                  Faça o upload de um arquivo <strong>.csv</strong> ou <strong>.txt</strong> com um item por linha.
                  Você pode separar título e descrição com ponto e vírgula (<code>;</code>).
                </p>

                <div className="mb-5">
                  <Button type="button" variant="secondary" onClick={baixarModeloCSV} icon={<Download size={16} />}>
                    Baixar modelo de planilha
                  </Button>
                </div>

                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ink-faint/30 bg-white p-6">
                  <Upload size={32} className="text-teal" />
                  <span className="text-sm font-medium text-ink">Clique para selecionar o arquivo</span>
                  <span className="text-xs text-ink-faint">CSV, TXT — máx. 1MB</span>
                  <input type="file" accept=".csv,.txt" onChange={importarCSV} className="hidden" />
                </label>

                {itens.length > 0 && itens[0].titulo && (
                  <div className="mt-4 rounded-xl bg-white px-3 py-2.5">
                    <p className="text-sm font-semibold text-teal">
                      {itens.length} {itens.length === 1 ? 'item importado' : 'itens importados'} — revise abaixo antes de salvar
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Itens importados — mostrar para revisar */}
            {recorrente === 'importar' && itens.length > 0 && itens[0].titulo && (
              <div className="mb-8">{renderItensEditor('Itens importados (revise e edite se necessário)')}</div>
            )}

            {/* CAMPOS COMUNS */}
            <div className="mb-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Próxima execução *</label>
                <input type="date" value={proximaExecucao} onChange={(e) => setProximaExecucao(e.target.value)} required className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Recorrência</label>
                <select
                  value={recorrencia}
                  onChange={(e) => setRecorrencia(e.target.value as 'nenhuma' | 'diaria' | 'semanal' | 'mensal')}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="nenhuma">Sem recorrência</option>
                  <option value="diaria">🔄 Diária</option>
                  <option value="semanal">🔄 Semanal</option>
                  <option value="mensal">🔄 Mensal</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Dias de tolerância</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={diasTolerancia}
                  onChange={(e) => setDiasTolerancia(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-ink-faint">Dias antes e depois que o funcionário pode realizar</p>
              </div>

              <div>
                <label className={labelClass}>Horário limite</label>
                <input type="time" value={horaLimite} onChange={(e) => setHoraLimite(e.target.value)} className={inputClass} />
                <p className="mt-1.5 text-xs text-ink-faint">
                  Ex: 08:00 para “abertura de loja”. O funcionário verá um alerta ao se aproximar do horário.
                </p>
              </div>

              <div>
                <label className={labelClass}>Tipo de negócio *</label>
                <select value={tipoNegocio} onChange={(e) => setTipoNegocio(e.target.value)} required className={`${inputClass} cursor-pointer`}>
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
            <div className="mb-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Empresa</label>
                <select value={empresaId} onChange={(e) => handleEmpresaChange(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="">Selecione a empresa...</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nome_fantasia}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Colaborador responsável</label>
                <select
                  value={colaboradorId}
                  onChange={(e) => setColaboradorId(e.target.value)}
                  disabled={!empresaId}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Selecione o colaborador...</option>
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-7">
              <label className={labelClass}>Nome do checklist *</label>
              <input
                type="text"
                value={nomeChecklist}
                onChange={(e) => setNomeChecklist(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                placeholder="Digite o nome do checklist"
                required
                className={inputClass}
              />
            </div>

            <div className="mb-8">
              <label className={labelClass}>Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Adicione informações adicionais"
                rows={3}
                className={`${inputClass} resize-y font-sans`}
              />
            </div>

            {mensagemSalvamento && (
              <div className={`mb-6 rounded-xl px-6 py-4 text-center text-sm font-semibold ${mensagemTone.bg} ${mensagemTone.text}`}>
                {mensagemSalvamento}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading} icon={<Save size={18} />}>
              {loading ? 'Salvando...' : 'Criar Checklist'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
