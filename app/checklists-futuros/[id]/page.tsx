'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar, CheckCircle, XCircle, MinusCircle, Clock, AlertCircle, PlayCircle, ClipboardList, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ChecklistFuturo {
  id: string
  nome: string
  descricao?: string | null
  proxima_execucao?: string | null
  status: string
  tipo_negocio?: string | null
  departamento?: string | null
  recorrencia?: string | null
  dias_tolerancia?: number | null
  aluno_id: number | null
  empresa_id?: string | null
  colaborador_id?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  empresas?: { nome_fantasia: string } | null
  colaboradores?: { nome: string; cargo?: string | null } | null
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

export default function DetalhesChecklistFuturoPage() {
  const router = useRouter()
  const params = useParams()
  const checklistId = params.id as string

  const [checklist, setChecklist] = useState<ChecklistFuturo | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({})
  const [loading, setLoading] = useState(true)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userData)

    // Somente aluno ou admin
    if (user.role !== 'admin' && user.role !== 'aluno') {
      router.push('/meus-checklists')
      return
    }

    carregarDados(user.id)
  }, [router, checklistId])

  async function carregarDados(userId: string) {
    try {
      setLoading(true)

      // Buscar checklist — só carrega se pertencer ao aluno logado
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklists_futuros')
        .select(`
          *,
          empresas ( nome_fantasia ),
          colaboradores ( nome, cargo )
        `)
        .eq('id', checklistId)
        .eq('aluno_id', Number(userId))
        .single()

      if (checklistError || !checklistData) {
        toast.error('Checklist não encontrado ou sem permissão de acesso.')
        router.push('/checklists-futuros')
        return
      }

      setChecklist(checklistData as unknown as ChecklistFuturo)

      // Buscar itens
      const { data: itensData, error: itensError } = await supabase
        .from('checklist_futuro_itens')
        .select('*')
        .eq('checklist_futuro_id', checklistId)
        .order('ordem')

      if (itensError) throw itensError

      const listaItens: Item[] = itensData || []
      setItens(listaItens)

      // Buscar respostas do funcionário (se houver)
      const { data: respostasData } = await supabase
        .from('checklist_respostas')
        .select('*')
        .eq('checklist_futuro_id', checklistId)

      const mapaRespostas: Record<string, Resposta> = {}
      ;(respostasData || []).forEach((r: any) => {
        mapaRespostas[r.item_id] = {
          item_id: r.item_id,
          resposta: r.resposta,
          observacao: r.observacao,
          foto_url: r.foto_url
        }
      })
      setRespostas(mapaRespostas)
    } catch (error) {
      console.error('Erro ao carregar checklist:', error)
      toast.error('Erro ao carregar checklist.')
    } finally {
      setLoading(false)
    }
  }

  function obterCorStatus(status: string) {
    switch (status) {
      case 'concluido':
        return { bg: '#dcfce7', text: '#166534', icon: CheckCircle, label: 'Concluído' }
      case 'em_andamento':
        return { bg: '#dbeafe', text: '#1e40af', icon: PlayCircle, label: 'Em Andamento' }
      case 'pendente':
        return { bg: '#fef3c7', text: '#92400e', icon: Clock, label: 'Pendente' }
      case 'atrasado':
        return { bg: '#fee2e2', text: '#991b1b', icon: AlertCircle, label: 'Atrasado' }
      default:
        return { bg: '#f3f4f6', text: '#374151', icon: Clock, label: status }
    }
  }

  const totalRespondidos = Object.values(respostas).filter(r => r.resposta !== null).length
  const conformes = Object.values(respostas).filter(r => r.resposta === 'sim').length
  const naoConformes = Object.values(respostas).filter(r => r.resposta === 'nao').length
  const naAplicavel = Object.values(respostas).filter(r => r.resposta === 'na').length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Carregando...</p>
      </div>
    )
  }

  if (!checklist) return null

  const statusInfo = obterCorStatus(checklist.status || 'pendente')
  const StatusIcon = statusInfo.icon

  return (
    <>
      {fotoExpandida && (
        <div
          onClick={() => setFotoExpandida(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}
        >
          <img src={fotoExpandida} alt="Foto ampliada" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '0.75rem', objectFit: 'contain' }} />
        </div>
      )}

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Voltar */}
          <button
            onClick={() => router.push('/checklists-futuros')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem', color: '#374151', fontSize: '0.95rem' }}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          {/* Header */}
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem' }}>
                  {checklist.nome}
                </h1>
                {checklist.descricao && (
                  <p style={{ color: '#6b7280', margin: 0 }}>{checklist.descricao}</p>
                )}
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: statusInfo.bg, color: statusInfo.text, fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                <StatusIcon size={16} />
                {statusInfo.label}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#6b7280' }}>
              {checklist.proxima_execucao && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Calendar size={16} />
                  {new Date(checklist.proxima_execucao).toLocaleDateString('pt-BR')}
                </div>
              )}
              {checklist.empresas && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Building2 size={16} />
                  {checklist.empresas.nome_fantasia}
                </div>
              )}
              {checklist.colaboradores && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <ClipboardList size={16} />
                  {checklist.colaboradores.nome}
                  {checklist.colaboradores.cargo && ` — ${checklist.colaboradores.cargo}`}
                </div>
              )}
              {checklist.recorrencia && checklist.recorrencia !== 'nenhuma' && (
                <span style={{ padding: '0.2rem 0.6rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '9999px', fontWeight: '600', fontSize: '0.8rem', border: '1px solid #bfdbfe' }}>
                  🔄 {checklist.recorrencia.charAt(0).toUpperCase() + checklist.recorrencia.slice(1)}
                </span>
              )}
              {(checklist.dias_tolerancia ?? 0) > 0 && (
                <span>🕐 {checklist.dias_tolerancia} dia(s) de tolerância</span>
              )}
            </div>
          </div>

          {/* Resumo de respostas (se houver) */}
          {totalRespondidos > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', border: '1px solid #bbf7d0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{conformes}</p>
                <p style={{ fontSize: '0.8rem', color: '#15803d', margin: '0.25rem 0 0' }}>Conforme</p>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', border: '1px solid #fecaca', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>{naoConformes}</p>
                <p style={{ fontSize: '0.8rem', color: '#b91c1c', margin: '0.25rem 0 0' }}>Não Conforme</p>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>{naAplicavel}</p>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0 0' }}>N/A</p>
              </div>
            </div>
          )}

          {/* Lista de itens */}
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Itens do Checklist ({itens.length})
            </h2>

            {itens.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>Nenhum item cadastrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {itens.map((item, index) => {
                  const r = respostas[item.id]
                  const temResposta = r?.resposta !== undefined && r.resposta !== null

                  const corResposta = r?.resposta === 'sim'
                    ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'Sim' }
                    : r?.resposta === 'nao'
                    ? { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'Não' }
                    : r?.resposta === 'na'
                    ? { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280', label: 'N/A' }
                    : { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af', label: 'Sem resposta' }

                  return (
                    <div
                      key={item.id}
                      style={{ backgroundColor: corResposta.bg, borderRadius: '0.75rem', border: `1px solid ${corResposta.border}`, padding: '1rem', overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', minWidth: '1.5rem', paddingTop: '2px' }}>
                          {index + 1}.
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 0.25rem', fontWeight: '500', color: '#1f2937' }}>{item.titulo}</p>
                          {item.descricao && (
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>{item.descricao}</p>
                          )}
                          {temResposta && r.observacao && (
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>
                              "{r.observacao}"
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {temResposta && r.foto_url && (
                            <button
                              onClick={() => setFotoExpandida(r.foto_url!)}
                              style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'zoom-in' }}
                              title="Ver foto"
                            >
                              <img src={r.foto_url} alt="foto" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.375rem', border: '2px solid #d1d5db' }} />
                            </button>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {r?.resposta === 'sim' && <CheckCircle size={18} color="#16a34a" />}
                            {r?.resposta === 'nao' && <XCircle size={18} color="#dc2626" />}
                            {r?.resposta === 'na' && <MinusCircle size={18} color="#6b7280" />}
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: corResposta.text }}>
                              {corResposta.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {totalRespondidos < itens.length && itens.length > 0 && (
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center' }}>
                {totalRespondidos} de {itens.length} itens respondidos pelo funcionário
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
