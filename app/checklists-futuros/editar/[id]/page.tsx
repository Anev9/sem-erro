'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

type ItemEdit = {
  id?: string
  titulo: string
  descricao: string
  ordem: number
  foto_obrigatoria: boolean
  temRespostas?: boolean
  isNovo?: boolean
}

const inputClass = 'w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60'
const labelClass = 'mb-2 block text-sm font-semibold text-ink-muted'

export default function EditarChecklistPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [userId, setUserId] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [proximaExecucao, setProximaExecucao] = useState('')
  const [recorrencia, setRecorrencia] = useState<'nenhuma' | 'diaria' | 'semanal' | 'mensal'>('nenhuma')
  const [diasTolerancia, setDiasTolerancia] = useState(0)
  const [prazoAlerta, setPrazoAlerta] = useState('')
  const [horaLimite, setHoraLimite] = useState('')
  const [tipoNegocio, setTipoNegocio] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [colaboradorId, setColaboradorId] = useState('')

  const [itens, setItens] = useState<ItemEdit[]>([])
  const [itensRemovidos, setItensRemovidos] = useState<string[]>([])

  const [empresas, setEmpresas] = useState<{ id: string; nome_fantasia: string }[]>([])
  const [colaboradores, setColaboradores] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    setUserId(user.id)
    carregarDados(user.id)
  }, [id])

  async function carregarDados(alunoId: string) {
    setLoading(true)
    try {
      const { data: checklist, error } = await supabase
        .from('checklists_futuros')
        .select('*')
        .eq('id', id)
        .eq('aluno_id', Number(alunoId))
        .single()

      if (error || !checklist) {
        toast.error('Checklist não encontrado ou sem permissão.')
        router.push('/checklists-futuros')
        return
      }

      setNome(checklist.nome || '')
      setDescricao(checklist.descricao || '')
      setProximaExecucao(checklist.proxima_execucao?.split('T')[0] || '')
      setRecorrencia((checklist.recorrencia as 'diaria' | 'semanal' | 'mensal' | 'nenhuma') || 'nenhuma')
      setDiasTolerancia(checklist.dias_tolerancia || 0)
      setPrazoAlerta(checklist.prazo_alerta?.split('T')[0] || '')
      setHoraLimite(checklist.hora_limite?.slice(0, 5) || '')
      setTipoNegocio(checklist.tipo_negocio || '')
      setEmpresaId(checklist.empresa_id || '')
      setColaboradorId(checklist.colaborador_id || '')

      // Carregar itens e verificar quais têm respostas
      const { data: itensData } = await supabase
        .from('checklist_futuro_itens')
        .select('id, titulo, descricao, ordem, foto_obrigatoria')
        .eq('checklist_futuro_id', id)
        .order('ordem')

      const itensComInfo = await Promise.all(
        (itensData || []).map(async (item) => {
          const { count } = await supabase
            .from('checklist_respostas')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', item.id)
          return {
            id: item.id,
            titulo: item.titulo,
            descricao: item.descricao || '',
            ordem: item.ordem,
            foto_obrigatoria: item.foto_obrigatoria ?? false,
            temRespostas: (count || 0) > 0,
          }
        })
      )
      setItens(itensComInfo)

      // Carregar empresas
      const res = await fetch(`/api/aluno/empresas?aluno_id=${alunoId}`)
      if (res.ok) {
        const emps = await res.json()
        setEmpresas(emps)

        if (checklist.empresa_id) {
          const resColab = await fetch(`/api/aluno/colaboradores?aluno_id=${alunoId}`)
          if (resColab.ok) {
            const todos = await resColab.json()
            setColaboradores(
              todos.filter((c: { id: string; nome: string; empresa_id: string }) =>
                c.empresa_id === checklist.empresa_id
              )
            )
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleEmpresaChange(empId: string) {
    setEmpresaId(empId)
    setColaboradorId('')
    if (!empId) { setColaboradores([]); return }
    const res = await fetch(`/api/aluno/colaboradores?aluno_id=${userId}`)
    if (res.ok) {
      const todos = await res.json()
      setColaboradores(
        todos.filter((c: { id: string; nome: string; empresa_id: string }) => c.empresa_id === empId)
      )
    }
  }

  function adicionarItem() {
    setItens([...itens, { titulo: '', descricao: '', ordem: itens.length + 1, foto_obrigatoria: false, isNovo: true }])
  }

  function removerItem(index: number) {
    const item = itens[index]
    if (item.temRespostas) {
      toast.warning('Este item já tem respostas registradas e não pode ser removido.')
      return
    }
    if (itens.length === 1) {
      toast.warning('O checklist precisa ter pelo menos 1 item.')
      return
    }
    if (item.id) {
      setItensRemovidos(prev => [...prev, item.id!])
    }
    const novos = itens.filter((_, i) => i !== index)
    novos.forEach((it, i) => { it.ordem = i + 1 })
    setItens(novos)
  }

  function atualizarItem(index: number, campo: 'titulo' | 'descricao', valor: string) {
    const novos = [...itens]
    novos[index][campo] = valor
    setItens(novos)
  }

  function toggleFotoObrigatoria(index: number) {
    const novos = [...itens]
    novos[index].foto_obrigatoria = !novos[index].foto_obrigatoria
    setItens(novos)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { toast.warning('Digite o nome do checklist'); return }
    if (!proximaExecucao) { toast.warning('Selecione a data de execução'); return }

    const itensValidos = itens.filter(i => i.titulo.trim())
    if (itensValidos.length === 0) { toast.warning('Adicione pelo menos 1 item com título'); return }

    setSalvando(true)
    setMensagem('⏳ Salvando...')

    try {
      // 0. Salvar snapshot da versão anterior
      await fetch(`/api/aluno/checklists-criados/${id}/versoes`, { method: 'POST' })

      // 1. Atualizar dados do checklist
      const { error: errChecklist } = await supabase
        .from('checklists_futuros')
        .update({
          nome,
          descricao: descricao || null,
          proxima_execucao: proximaExecucao,
          recorrencia,
          dias_tolerancia: diasTolerancia,
          tipo_negocio: tipoNegocio,
          empresa_id: empresaId || null,
          colaborador_id: colaboradorId || null,
          prazo_alerta: prazoAlerta || null,
          hora_limite: horaLimite || null,
        })
        .eq('id', id)

      if (errChecklist) throw errChecklist

      // 2. Deletar itens removidos
      if (itensRemovidos.length > 0) {
        const { error: errDel } = await supabase
          .from('checklist_futuro_itens')
          .delete()
          .in('id', itensRemovidos)
        if (errDel) throw errDel
      }

      // 3. Atualizar itens existentes e inserir novos — em paralelo, mas
      // verificando o erro de cada um. Antes os erros eram ignorados e a
      // tela mostrava "sucesso" mesmo quando um item não era salvo.
      const resultadosItens = await Promise.all(
        itensValidos.map((item) =>
          item.id
            ? supabase
                .from('checklist_futuro_itens')
                .update({ titulo: item.titulo, descricao: item.descricao || null, ordem: item.ordem, foto_obrigatoria: item.foto_obrigatoria })
                .eq('id', item.id)
            : supabase
                .from('checklist_futuro_itens')
                .insert({
                  checklist_futuro_id: id,
                  titulo: item.titulo,
                  descricao: item.descricao || null,
                  ordem: item.ordem,
                  foto_obrigatoria: item.foto_obrigatoria,
                })
        )
      )
      const errItem = resultadosItens.find((r) => r.error)?.error
      if (errItem) throw errItem

      setMensagem('✅ Checklist atualizado com sucesso!')
      setTimeout(() => router.push('/checklists-futuros'), 1500)
    } catch (err: unknown) {
      // Erros do Supabase (PostgrestError) não são instâncias de Error, mas
      // têm .message — sem isso, o erro real ficava escondido atrás de
      // "Erro desconhecido".
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string } | null)?.message || 'Erro desconhecido'
      setMensagem(`❌ Erro: ${msg}`)
    } finally {
      setSalvando(false)
    }
  }

  const mensagemTone = mensagem.includes('❌')
    ? { bg: 'bg-coral-tint', text: 'text-coral' }
    : mensagem.includes('✅')
    ? { bg: 'bg-teal-tint', text: 'text-teal' }
    : { bg: 'bg-blue-tint', text: 'text-blue' }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-surface-2 border-t-brand" />
          <p className="text-sm text-ink-muted">Carregando checklist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <PageHeader title="Editar Checklist" backHref="/checklists-futuros" />

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSalvar}>

            {/* Nome */}
            <div className="mb-6">
              <label className={labelClass}>Nome do checklist *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                required
                className={inputClass}
              />
            </div>

            {/* Descrição */}
            <div className="mb-7">
              <label className={labelClass}>Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className={`${inputClass} resize-y font-sans`}
              />
            </div>

            {/* Grid de campos */}
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
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-ink-faint">Dias antes e depois que o funcionário pode realizar</p>
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

            {/* Prazo de alerta */}
            <div className="mb-7 rounded-2xl bg-amber-tint p-5">
              <label className="mb-1 block text-sm font-semibold text-amber">Prazo de alerta (opcional)</label>
              <p className="mb-3 text-xs text-ink-muted">
                Defina uma data limite. O checklist aparecerá em destaque vermelho quando vencer ou amarelo quando faltar 3 dias.
              </p>
              <input
                type="date"
                value={prazoAlerta}
                onChange={(e) => setPrazoAlerta(e.target.value)}
                className="rounded-xl bg-white px-3.5 py-2.5 text-sm outline-none"
              />
              {prazoAlerta && (
                <button type="button" onClick={() => setPrazoAlerta('')} className="ml-3 text-xs font-medium text-amber underline">
                  Remover prazo
                </button>
              )}
            </div>

            {/* Horário limite */}
            <div className="mb-8 rounded-2xl bg-blue-tint p-5">
              <label className="mb-1 block text-sm font-semibold text-blue">Horário limite (opcional)</label>
              <p className="mb-3 text-xs text-ink-muted">
                Defina um horário do dia até quando o checklist deve ser respondido (ex: 08:00 para “abertura de loja”).
                O funcionário verá um alerta visual e receberá um e-mail quando o horário estiver próximo.
              </p>
              <input
                type="time"
                value={horaLimite}
                onChange={(e) => setHoraLimite(e.target.value)}
                className="rounded-xl bg-white px-3.5 py-2.5 text-sm outline-none"
              />
              {horaLimite && (
                <button type="button" onClick={() => setHoraLimite('')} className="ml-3 text-xs font-medium text-blue underline">
                  Remover horário
                </button>
              )}
            </div>

            {/* Empresa e Colaborador */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Empresa</label>
                <select value={empresaId} onChange={(e) => handleEmpresaChange(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="">Selecione a empresa...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
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
                  {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>

            {/* Itens */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-ink">Itens do checklist</h3>
                <Button type="button" variant="primary" size="sm" onClick={adicionarItem} icon={<Plus size={16} />}>
                  Adicionar Item
                </Button>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-6">
                {itens.map((item, index) => (
                  <div key={item.id || `novo-${index}`} className="rounded-xl bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-muted">Item {index + 1}</span>
                        {item.temRespostas && (
                          <Badge tone="warning">
                            <AlertCircle size={12} /> tem respostas
                          </Badge>
                        )}
                        {item.isNovo && <Badge tone="success">novo</Badge>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removerItem(index)}
                        disabled={item.temRespostas}
                        title={item.temRespostas ? 'Item com respostas não pode ser removido' : 'Remover item'}
                        className={item.temRespostas ? 'cursor-not-allowed text-ink-faint' : 'text-coral'}
                      >
                        <Trash2 size={16} />
                      </button>
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

            {mensagem && (
              <div className={`mb-6 rounded-xl px-6 py-4 text-center text-sm font-semibold ${mensagemTone.bg} ${mensagemTone.text}`}>
                {mensagem}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={salvando} icon={<Save size={18} />}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
