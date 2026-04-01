'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Building2,
  User,
  Calendar,
  ClipboardList,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
  FileDown,
  MessageSquare,
  Send,
  Trash2
} from 'lucide-react'

interface Checklist {
  id: string
  titulo: string
  descricao?: string
  status: string
  data_inicio: string
  data_fim: string
  created_at: string
  empresas?: { nome_fantasia: string }
  colaboradores?: { nome: string }
}

interface Item {
  id: string
  titulo: string
  descricao?: string
  ordem: number
}

interface Resposta {
  item_id: string
  resposta: 'sim' | 'nao' | 'na' | null
  observacao?: string
  foto_url?: string
}

interface AcaoVinculada {
  id: string
  titulo: string
  status: string
  prioridade: string
  responsavel?: string
  prazo?: string
  item_id?: string
}

export default function DetalhesChecklistPage() {
  const router = useRouter()
  const params = useParams()
  const checklistId = params.id as string

  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({})
  const [acoes, setAcoes] = useState<AcaoVinculada[]>([])
  const [loading, setLoading] = useState(true)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)
  const [comentarios, setComentarios] = useState<Array<{ id: string; item_id: string; autor: string; texto: string; created_at: string }>>([])
  const [comentarioAberto, setComentarioAberto] = useState<string | null>(null)
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [versoes, setVersoes] = useState<Array<{ id: string; versao: number; titulo: string; descricao?: string; itens: Array<{ titulo: string; descricao?: string; ordem: number }>; created_at: string }>>([])
  const [showVersoes, setShowVersoes] = useState(false)
  const [versaoExpandida, setVersaoExpandida] = useState<string | null>(null)

  useEffect(() => {
    verificarAutenticacao()
  }, [checklistId])

  async function verificarAutenticacao() {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') { router.push('/login'); return }
    await carregarDados(user.id)
  }

  async function carregarDados(alunoId: string) {
    try {
      setLoading(true)

      const res = await fetch(`/api/aluno/checklists-criados/${checklistId}?aluno_id=${alunoId}`)
      if (!res.ok) {
        toast.error('Checklist não encontrado.')
        router.push('/checklists-criados')
        return
      }

      const { checklist: cl, itens: it, respostas: resp, acoes: ac } = await res.json()

      setChecklist(cl)
      setItens(it || [])

      const mapaRespostas: Record<string, Resposta> = {}
      ;(resp || []).forEach((r: any) => {
        mapaRespostas[r.item_id] = {
          item_id: r.item_id,
          resposta: r.resposta,
          observacao: r.observacao || '',
          foto_url: r.foto_url || undefined
        }
      })
      setRespostas(mapaRespostas)
      setAcoes(ac || [])

      // Carregar histórico de versões
      const resVersoes = await fetch(`/api/aluno/checklists-criados/${checklistId}/versoes`)
      if (resVersoes.ok) setVersoes(await resVersoes.json())

      // Carregar comentários
      const resComentarios = await fetch(`/api/aluno/comentarios?checklist_id=${checklistId}`)
      if (resComentarios.ok) setComentarios(await resComentarios.json())

    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white', fontSize: '1rem' }}>Carregando detalhes...</p>
      </div>
    )
  }

  if (!checklist) return null

  const totalItens = itens.length
  const conformes = itens.filter(i => respostas[i.id]?.resposta === 'sim').length
  const naoConformes = itens.filter(i => respostas[i.id]?.resposta === 'nao').length
  const naAplicavel = itens.filter(i => respostas[i.id]?.resposta === 'na').length
  const semResposta = itens.filter(i => !respostas[i.id]?.resposta).length
  const respondidos = totalItens - semResposta
  const percentual = totalItens > 0 ? Math.round((conformes / Math.max(1, totalItens - naAplicavel)) * 100) : 0

  const getStatusChecklist = (status: string) => {
    const s = { pendente: { bg: '#FFF3E0', text: '#E65100', border: '#FFB74D', label: 'Pendente' }, em_andamento: { bg: '#E3F2FD', text: '#1565C0', border: '#64B5F6', label: 'Em Andamento' }, concluido: { bg: '#E8F5E9', text: '#2E7D32', border: '#81C784', label: 'Concluído' } }
    return s[status as keyof typeof s] || s.pendente
  }

  const getStatusAcao = (status: string) => {
    const s = { aguardando: { bg: '#FFF3E0', text: '#E65100', label: 'Aguardando' }, em_andamento: { bg: '#E3F2FD', text: '#1565C0', label: 'Em Andamento' }, concluida: { bg: '#E8F5E9', text: '#2E7D32', label: 'Concluída' }, atrasada: { bg: '#FFEBEE', text: '#C62828', label: 'Atrasada' } }
    return s[status as keyof typeof s] || s.aguardando
  }

  const getPrioridadeCor = (p: string) => ({ baixa: '#4CAF50', media: '#FF9800', alta: '#ef5350' }[p] || '#FF9800')

  const formatarData = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  function exportarPDF() {
    const labelResposta = { sim: '✅ Conforme', nao: '❌ Não Conforme', na: '➖ N/A', null: '⬜ Sem resposta' }
    const conteudo = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório – ${checklist.titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 2rem; color: #1f2937; font-size: 13px; }
          h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
          .meta { color: #6b7280; margin-bottom: 1.5rem; font-size: 12px; }
          .resumo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; text-align: center; }
          .card .num { font-size: 2rem; font-weight: bold; }
          .card .label { font-size: 11px; color: #6b7280; }
          .item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.875rem; margin-bottom: 0.75rem; }
          .item-titulo { font-weight: 600; margin-bottom: 0.375rem; }
          .item-resposta { font-size: 12px; }
          .obs { font-size: 11px; color: #6b7280; margin-top: 0.25rem; }
          h2 { font-size: 1rem; margin: 1.5rem 0 0.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
          @media print { body { margin: 1rem; } }
        </style>
      </head>
      <body>
        <h1>${checklist.titulo}</h1>
        <p class="meta">
          ${checklist.empresas ? `Empresa: ${checklist.empresas.nome_fantasia} | ` : ''}
          ${checklist.colaboradores ? `Colaborador: ${checklist.colaboradores.nome} | ` : ''}
          Prazo: ${formatarData(checklist.data_fim)} |
          Status: ${getStatusChecklist(checklist.status).label} |
          Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <h2>Resumo</h2>
        <div class="resumo">
          <div class="card"><div class="num" style="color:#16a34a">${conformes}</div><div class="label">Conforme</div></div>
          <div class="card"><div class="num" style="color:#dc2626">${naoConformes}</div><div class="label">Não Conforme</div></div>
          <div class="card"><div class="num" style="color:#6b7280">${naAplicavel}</div><div class="label">N/A</div></div>
          <div class="card"><div class="num" style="color:#2563eb">${percentual}%</div><div class="label">Conformidade</div></div>
        </div>
        <h2>Itens (${totalItens})</h2>
        ${itens.map(item => {
          const resp = respostas[item.id]
          const respLabel = labelResposta[(resp?.resposta ?? null) as keyof typeof labelResposta]
          return `
            <div class="item">
              <div class="item-titulo">${item.ordem}. ${item.titulo}</div>
              <div class="item-resposta">${respLabel}</div>
              ${resp?.observacao ? `<div class="obs">Obs: ${resp.observacao}</div>` : ''}
            </div>
          `
        }).join('')}
        ${acoes.length > 0 ? `
          <h2>Ações Corretivas (${acoes.length})</h2>
          ${acoes.map(a => `
            <div class="item">
              <div class="item-titulo">${a.titulo}</div>
              <div class="item-resposta">Status: ${getStatusAcao(a.status).label} | Prioridade: ${a.prioridade}${a.responsavel ? ` | Responsável: ${a.responsavel}` : ''}${a.prazo ? ` | Prazo: ${formatarData(a.prazo)}` : ''}</div>
            </div>
          `).join('')}
        ` : ''}
      </body>
      </html>
    `
    const janela = window.open('', '_blank')
    if (!janela) return
    janela.document.write(conteudo)
    janela.document.close()
    janela.focus()
    setTimeout(() => { janela.print(); janela.close() }, 500)
  }

  async function enviarComentario(itemId: string) {
    if (!novoComentario.trim()) return
    setEnviandoComentario(true)
    try {
      const res = await fetch('/api/aluno/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist_id: checklistId, item_id: itemId, texto: novoComentario }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao enviar')
      const novo = await res.json()
      setComentarios(prev => [...prev, novo])
      setNovoComentario('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar comentário')
    } finally {
      setEnviandoComentario(false)
    }
  }

  async function excluirComentario(id: string) {
    try {
      const res = await fetch(`/api/aluno/comentarios?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setComentarios(prev => prev.filter(c => c.id !== id))
    } catch {
      toast.error('Erro ao excluir comentário')
    }
  }

  const statusCl = getStatusChecklist(checklist.status)

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1.5rem 2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <button
              onClick={() => router.push('/checklists-criados')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 }}
            >
              <ArrowLeft size={16} />
              Voltar para Checklists
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white', margin: '0 0 0.5rem' }}>
                  {checklist.titulo}
                </h1>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  {checklist.empresas && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                      <Building2 size={14} /> {checklist.empresas.nome_fantasia}
                    </span>
                  )}
                  {checklist.colaboradores && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                      <User size={14} /> {checklist.colaboradores.nome}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                    <Calendar size={14} /> Prazo: {formatarData(checklist.data_fim)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                    <ClipboardList size={14} /> {respondidos}/{totalItens} respondidos
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.375rem 1rem', background: statusCl.bg, color: statusCl.text, border: `1.5px solid ${statusCl.border}`, borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {statusCl.label}
                </span>
                <button
                  onClick={exportarPDF}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' }}
                  title="Exportar relatório em PDF"
                >
                  <FileDown size={14} />
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

          {/* Cards de resumo */}
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #bbf7d0' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#16a34a', margin: 0 }}>{conformes}</p>
              <p style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '600', margin: '0.25rem 0 0' }}>Conforme</p>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #fecaca' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#dc2626', margin: 0 }}>{naoConformes}</p>
              <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: '600', margin: '0.25rem 0 0' }}>Não Conforme</p>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #e5e7eb' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#6b7280', margin: 0 }}>{naAplicavel}</p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600', margin: '0.25rem 0 0' }}>N/A</p>
            </div>
            {semResposta > 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #fed7aa' }}>
                <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#ea580c', margin: 0 }}>{semResposta}</p>
                <p style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: '600', margin: '0.25rem 0 0' }}>Sem Resposta</p>
              </div>
            )}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: '800', color: 'white', margin: 0 }}>{percentual}%</p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: '600', margin: '0.25rem 0 0' }}>Conformidade</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="fade-in" style={{ background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>
              <span>Conformidade geral</span>
              <span style={{ color: percentual >= 80 ? '#16a34a' : percentual >= 50 ? '#ca8a04' : '#dc2626' }}>{percentual}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${percentual}%`, height: '100%', borderRadius: '999px', transition: 'width 0.6s ease',
                background: percentual >= 80 ? '#16a34a' : percentual >= 50 ? '#ca8a04' : '#dc2626'
              }} />
            </div>
          </div>

          {/* Lista de itens */}
          <div className="fade-in" style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={20} style={{ color: '#667eea' }} />
              Itens do Checklist
            </h2>

            {/* Lightbox */}
            {fotoExpandida && (
              <div
                onClick={() => setFotoExpandida(null)}
                style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}
              >
                <img src={fotoExpandida} alt="Foto ampliada" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '0.75rem', objectFit: 'contain' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {itens.map((item, index) => {
                const r = respostas[item.id]
                const acaoItem = acoes.find(a => a.item_id === item.id)

                const corFundo = r?.resposta === 'sim' ? '#f0fdf4' : r?.resposta === 'nao' ? '#fef2f2' : r?.resposta === 'na' ? '#f9fafb' : '#fffbeb'
                const corBorda = r?.resposta === 'sim' ? '#bbf7d0' : r?.resposta === 'nao' ? '#fecaca' : r?.resposta === 'na' ? '#e5e7eb' : '#fed7aa'

                return (
                  <div key={item.id} style={{ background: corFundo, border: `1.5px solid ${corBorda}`, borderRadius: '10px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                      {/* Ícone de resposta */}
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        {r?.resposta === 'sim' ? <CheckCircle size={20} style={{ color: '#16a34a' }} /> :
                         r?.resposta === 'nao' ? <XCircle size={20} style={{ color: '#dc2626' }} /> :
                         r?.resposta === 'na' ? <MinusCircle size={20} style={{ color: '#9ca3af' }} /> :
                         <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #fb923c', background: 'white' }} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{index + 1}.</span>
                          <p style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '500', margin: 0 }}>{item.titulo}</p>
                        </div>

                        {r?.observacao && (
                          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.375rem 0 0', fontStyle: 'italic', paddingLeft: '1rem', borderLeft: '2px solid #cbd5e1' }}>
                            {r.observacao}
                          </p>
                        )}

                        {/* Foto do funcionário */}
                        {r?.foto_url && (
                          <button
                            onClick={() => setFotoExpandida(r.foto_url!)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'zoom-in', padding: 0 }}
                            title="Ver foto"
                          >
                            <img
                              src={r.foto_url}
                              alt="Foto do funcionário"
                              style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #cbd5e1' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: '500' }}>Ver foto</span>
                          </button>
                        )}

                        {/* Ação vinculada a este item */}
                        {acaoItem && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: '#ea580c' }}>
                            <AlertTriangle size={12} />
                            Ação: {acaoItem.titulo}
                          </div>
                        )}

                        {/* Botão de comentários */}
                        <button
                          onClick={() => setComentarioAberto(comentarioAberto === item.id ? null : item.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', marginLeft: acaoItem ? '0.5rem' : '0', background: 'none', border: 'none', cursor: 'pointer', color: '#667eea', fontSize: '0.75rem', fontWeight: '600', padding: 0 }}
                        >
                          <MessageSquare size={12} />
                          {comentarios.filter(c => c.item_id === item.id).length > 0
                            ? `${comentarios.filter(c => c.item_id === item.id).length} comentário(s)`
                            : 'Comentar'}
                        </button>

                        {/* Painel de comentários */}
                        {comentarioAberto === item.id && (
                          <div style={{ marginTop: '0.75rem', padding: '0.875rem', background: 'white', borderRadius: '8px', border: '1.5px solid #e2e8f0' }}>
                            {comentarios.filter(c => c.item_id === item.id).map(com => (
                              <div key={com.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div>
                                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#667eea', margin: 0 }}>{com.autor}</p>
                                  <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: '0.125rem 0 0' }}>{com.texto}</p>
                                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.125rem 0 0' }}>{new Date(com.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <button onClick={() => excluirComentario(com.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem', flexShrink: 0 }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                              <input
                                type="text"
                                value={novoComentario}
                                onChange={(e) => setNovoComentario(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario(item.id); } }}
                                placeholder="Adicionar comentário..."
                                style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', outline: 'none' }}
                              />
                              <button
                                onClick={() => enviarComentario(item.id)}
                                disabled={enviandoComentario || !novoComentario.trim()}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.75rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: enviandoComentario || !novoComentario.trim() ? 0.6 : 1 }}
                              >
                                <Send size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Label da resposta */}
                      <div style={{ flexShrink: 0 }}>
                        <span style={{
                          fontSize: '0.8rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '999px',
                          background: r?.resposta === 'sim' ? '#dcfce7' : r?.resposta === 'nao' ? '#fee2e2' : r?.resposta === 'na' ? '#f3f4f6' : '#ffedd5',
                          color: r?.resposta === 'sim' ? '#16a34a' : r?.resposta === 'nao' ? '#dc2626' : r?.resposta === 'na' ? '#6b7280' : '#ea580c'
                        }}>
                          {r?.resposta === 'sim' ? 'Sim' : r?.resposta === 'nao' ? 'Não' : r?.resposta === 'na' ? 'N/A' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ações corretivas vinculadas */}
          {acoes.length > 0 && (
            <div className="fade-in" style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} style={{ color: '#ea580c' }} />
                Ações Corretivas ({acoes.length})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {acoes.map(acao => {
                  const statusAcao = getStatusAcao(acao.status)
                  return (
                    <div key={acao.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getPrioridadeCor(acao.prioridade), flexShrink: 0 }} title={`Prioridade ${acao.prioridade}`} />
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{acao.titulo}</p>
                          {acao.responsavel && (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>Responsável: {acao.responsavel}</p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {acao.prazo && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Prazo: {formatarData(acao.prazo)}
                          </span>
                        )}
                        <span style={{ padding: '0.25rem 0.75rem', background: statusAcao.bg, color: statusAcao.text, borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                          {statusAcao.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => router.push('/acoes')}
                style={{ marginTop: '1.25rem', padding: '0.75rem 1.5rem', background: 'transparent', color: '#667eea', border: '2px solid #667eea', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#667eea'; }}
              >
                Ver todas as ações
              </button>
            </div>
          )}

          {/* Histórico de versões */}
          {versoes.length > 0 && (
            <div className="fade-in" style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <button
                onClick={() => setShowVersoes(!showVersoes)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={20} style={{ color: '#667eea' }} />
                  Histórico de Versões ({versoes.length})
                </h2>
                {showVersoes ? <ChevronUp size={20} style={{ color: '#94a3b8' }} /> : <ChevronDown size={20} style={{ color: '#94a3b8' }} />}
              </button>

              {showVersoes && (
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {versoes.map(v => (
                    <div key={v.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <button
                        onClick={() => setVersaoExpandida(versaoExpandida === v.id ? null : v.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.875rem 1.25rem', background: versaoExpandida === v.id ? '#f1f5f9' : 'white', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div>
                          <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>Versão {v.versao}</span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.75rem' }}>
                            {new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.2rem 0 0' }}>{v.titulo}</p>
                        </div>
                        {versaoExpandida === v.id ? <ChevronUp size={16} style={{ color: '#94a3b8', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />}
                      </button>

                      {versaoExpandida === v.id && (
                        <div style={{ padding: '0.75rem 1.25rem 1rem', borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>
                          {v.descricao && <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>{v.descricao}</p>}
                          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
                            Itens ({v.itens.length})
                          </p>
                          <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {v.itens.map((item, idx) => (
                              <li key={idx} style={{ fontSize: '0.875rem', color: '#475569' }}>{item.titulo}</li>
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

        </div>
      </div>
    </>
  )
}
