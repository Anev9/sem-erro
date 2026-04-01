'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type ItemEdit = {
  id?: string
  titulo: string
  descricao: string
  ordem: number
  temRespostas?: boolean
  isNovo?: boolean
}

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
      setRecorrencia(checklist.recorrencia || 'nenhuma')
      setDiasTolerancia(checklist.dias_tolerancia || 0)
      setPrazoAlerta(checklist.prazo_alerta?.split('T')[0] || '')
      setTipoNegocio(checklist.tipo_negocio || '')
      setEmpresaId(checklist.empresa_id || '')
      setColaboradorId(checklist.colaborador_id || '')

      // Carregar itens e verificar quais têm respostas
      const { data: itensData } = await supabase
        .from('checklist_futuro_itens')
        .select('id, titulo, descricao, ordem')
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
    setItens([...itens, { titulo: '', descricao: '', ordem: itens.length + 1, isNovo: true }])
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

      // 3. Atualizar itens existentes e inserir novos
      for (const item of itensValidos) {
        if (item.id) {
          await supabase
            .from('checklist_futuro_itens')
            .update({ titulo: item.titulo, descricao: item.descricao || null, ordem: item.ordem })
            .eq('id', item.id)
        } else {
          await supabase
            .from('checklist_futuro_itens')
            .insert({
              checklist_futuro_id: id,
              titulo: item.titulo,
              descricao: item.descricao || null,
              ordem: item.ordem,
            })
        }
      }

      setMensagem('✅ Checklist atualizado com sucesso!')
      setTimeout(() => router.push('/checklists-futuros'), 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setMensagem(`❌ Erro: ${msg}`)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid #f3f4f6', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280' }}>Carregando checklist...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <button
          type="button"
          onClick={() => router.push('/checklists-futuros')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '2rem', color: '#374151', fontSize: '0.95rem' }}
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '2rem' }}>
            Editar Checklist
          </h1>

          <form onSubmit={handleSalvar}>

            {/* Nome */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Nome do checklist *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', backgroundColor: 'white' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', resize: 'vertical', backgroundColor: 'white', fontFamily: 'inherit' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Grid de campos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                  Próxima execução *
                </label>
                <input
                  type="date"
                  value={proximaExecucao}
                  onChange={(e) => setProximaExecucao(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                  Recorrência
                </label>
                <select
                  value={recorrencia}
                  onChange={(e) => setRecorrencia(e.target.value as 'nenhuma' | 'diaria' | 'semanal' | 'mensal')}
                  style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', cursor: 'pointer', backgroundColor: 'white' }}
                >
                  <option value="nenhuma">Sem recorrência</option>
                  <option value="diaria">🔄 Diária</option>
                  <option value="semanal">🔄 Semanal</option>
                  <option value="mensal">🔄 Mensal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                  Dias de tolerância
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={diasTolerancia}
                  onChange={(e) => setDiasTolerancia(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', backgroundColor: 'white' }}
                />
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.375rem' }}>
                  Dias antes e depois que o funcionário pode realizar
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                  Tipo de negócio *
                </label>
                <select
                  value={tipoNegocio}
                  onChange={(e) => setTipoNegocio(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', cursor: 'pointer', backgroundColor: 'white' }}
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

            {/* Prazo de alerta */}
            <div style={{ marginBottom: '1.75rem', padding: '1.25rem', backgroundColor: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '600', color: '#92400e', fontSize: '0.95rem' }}>
                Prazo de alerta (opcional)
              </label>
              <p style={{ fontSize: '0.8rem', color: '#a16207', margin: '0 0 0.75rem' }}>
                Defina uma data limite. O checklist aparecerá em destaque vermelho quando vencer ou amarelo quando faltar 3 dias.
              </p>
              <input
                type="date"
                value={prazoAlerta}
                onChange={(e) => setPrazoAlerta(e.target.value)}
                style={{ padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', backgroundColor: 'white' }}
              />
              {prazoAlerta && (
                <button type="button" onClick={() => setPrazoAlerta('')} style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Remover prazo
                </button>
              )}
            </div>

            {/* Empresa e Colaborador */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                  Empresa
                </label>
                <select
                  value={empresaId}
                  onChange={(e) => handleEmpresaChange(e.target.value)}
                  style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', cursor: 'pointer', backgroundColor: 'white' }}
                >
                  <option value="">Selecione a empresa...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
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
                  style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', cursor: empresaId ? 'pointer' : 'not-allowed', backgroundColor: empresaId ? 'white' : '#f3f4f6', opacity: empresaId ? 1 : 0.7 }}
                >
                  <option value="">Selecione o colaborador...</option>
                  {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>

            {/* Itens */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Itens do checklist
                </h3>
                <button
                  type="button"
                  onClick={adicionarItem}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
                >
                  <Plus size={16} /> Adicionar Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
                {itens.map((item, index) => (
                  <div
                    key={item.id || `novo-${index}`}
                    style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', border: `1px solid ${item.temRespostas ? '#fed7aa' : '#e5e7eb'}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Item {index + 1}</span>
                        {item.temRespostas && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                            <AlertCircle size={12} /> tem respostas
                          </span>
                        )}
                        {item.isNovo && (
                          <span style={{ fontSize: '0.75rem', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                            novo
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removerItem(index)}
                        disabled={item.temRespostas}
                        title={item.temRespostas ? 'Item com respostas não pode ser removido' : 'Remover item'}
                        style={{ padding: '0.375rem', backgroundColor: 'transparent', border: 'none', cursor: item.temRespostas ? 'not-allowed' : 'pointer', color: item.temRespostas ? '#d1d5db' : '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Título do item *"
                      value={item.titulo}
                      onChange={(e) => atualizarItem(index, 'titulo', e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.95rem', marginBottom: '0.75rem', outline: 'none' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />

                    <textarea
                      placeholder="Descrição (opcional)"
                      value={item.descricao}
                      onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.95rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                  </div>
                ))}
              </div>
            </div>

            {mensagem && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem 1.5rem',
                backgroundColor: mensagem.includes('❌') ? '#fee2e2' : mensagem.includes('✅') ? '#dcfce7' : '#dbeafe',
                border: `2px solid ${mensagem.includes('❌') ? '#ef4444' : mensagem.includes('✅') ? '#22c55e' : '#3b82f6'}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: mensagem.includes('❌') ? '#991b1b' : mensagem.includes('✅') ? '#15803d' : '#1e40af',
                textAlign: 'center'
              }}>
                {mensagem}
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', backgroundColor: salvando ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '1rem' }}
            >
              <Save size={18} />
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
