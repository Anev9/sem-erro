'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Building2,
  Calendar,
  MessageSquare,
  Send,
  Camera,
  X
} from 'lucide-react'

interface Checklist {
  id: string
  nome: string
  descricao?: string
  proxima_execucao?: string
  empresa_id: string
  colaborador_id: string
  empresas?: { nome_fantasia: string }
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
  observacao: string
}

type MapaRespostas = Record<string, Resposta>

export default function ResponderChecklistPage() {
  const router = useRouter()
  const params = useParams()
  const checklistId = params.id as string

  const [colaboradorId, setColaboradorId] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [respostas, setRespostas] = useState<MapaRespostas>({})
  const [itemAtual, setItemAtual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [fotos, setFotos] = useState<Record<string, string>>({})       // itemId → dataURL preview
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({}) // itemId → URL pública
  const [uploadandoFoto, setUploadandoFoto] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [checklistId])

  async function carregarDados() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      // Buscar colaborador
      const { data: colab, error: colabError } = await supabase
        .from('colaboradores')
        .select('id')
        .eq('auth_id', user.id)
        .eq('ativo', true)
        .single()

      if (colabError || !colab) {
        alert('Colaborador não encontrado.')
        router.push('/login')
        return
      }

      setColaboradorId(colab.id)

      // Buscar checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklists_futuros')
        .select(`*, empresas ( nome_fantasia )`)
        .eq('id', checklistId)
        .single()

      if (checklistError || !checklistData) {
        alert('Checklist não encontrado.')
        router.push('/dashboard-funcionario')
        return
      }

      setChecklist(checklistData)

      // Buscar itens
      const { data: itensData, error: itensError } = await supabase
        .from('checklist_futuro_itens')
        .select('*')
        .eq('checklist_futuro_id', checklistId)
        .order('ordem')

      if (itensError) throw itensError

      const listaItens: Item[] = itensData || []
      setItens(listaItens)

      // Buscar respostas já existentes
      const { data: respostasData } = await supabase
        .from('checklist_respostas')
        .select('*')
        .eq('checklist_futuro_id', checklistId)
        .eq('colaborador_id', colab.id)

      // Montar mapa de respostas existentes
      const mapaInicial: MapaRespostas = {}
      const mapaFotoUrls: Record<string, string> = {}

      listaItens.forEach((item) => {
        const respostaExistente = (respostasData || []).find(
          (r: any) => r.item_id === item.id
        )
        mapaInicial[item.id] = {
          item_id: item.id,
          resposta: respostaExistente?.resposta ?? null,
          observacao: respostaExistente?.observacao ?? ''
        }
        if (respostaExistente?.foto_url) {
          mapaFotoUrls[item.id] = respostaExistente.foto_url
        }
      })

      if (Object.keys(mapaFotoUrls).length > 0) {
        setFotoUrls(mapaFotoUrls)
        setFotos(mapaFotoUrls) // usar mesma URL como preview para fotos já salvas
      }

      setRespostas(mapaInicial)

      // Verificar se já está concluído
      const totalRespondidos = Object.values(mapaInicial).filter(r => r.resposta !== null).length
      if (totalRespondidos === listaItens.length && listaItens.length > 0) {
        setConcluido(true)
      }

      // Ir para o primeiro item sem resposta
      const primeiroSemResposta = listaItens.findIndex(
        (item) => !mapaInicial[item.id]?.resposta
      )
      if (primeiroSemResposta !== -1) {
        setItemAtual(primeiroSemResposta)
      }

    } catch (error) {
      console.error('Erro ao carregar checklist:', error)
      alert('Erro ao carregar checklist.')
    } finally {
      setLoading(false)
    }
  }

  async function salvarResposta(itemId: string, resposta: 'sim' | 'nao' | 'na', observacao: string, foto_url?: string) {
    if (!colaboradorId) return
    setSalvando(true)

    try {
      const fotoSalvar = foto_url ?? fotoUrls[itemId] ?? null

      // Verificar se já existe
      const { data: existente } = await supabase
        .from('checklist_respostas')
        .select('id')
        .eq('checklist_futuro_id', checklistId)
        .eq('colaborador_id', colaboradorId)
        .eq('item_id', itemId)
        .single()

      if (existente) {
        await supabase
          .from('checklist_respostas')
          .update({ resposta, observacao, ...(fotoSalvar && { foto_url: fotoSalvar }) })
          .eq('id', existente.id)
      } else {
        await supabase
          .from('checklist_respostas')
          .insert({
            checklist_futuro_id: checklistId,
            colaborador_id: colaboradorId,
            item_id: itemId,
            resposta,
            observacao,
            ...(fotoSalvar && { foto_url: fotoSalvar })
          })
      }
    } catch (error) {
      console.error('Erro ao salvar resposta:', error)
    } finally {
      setSalvando(false)
    }
  }

  async function handleFotoCaptura(e: React.ChangeEvent<HTMLInputElement>) {
    const item = itens[itemAtual]
    if (!item || !e.target.files?.[0]) return

    const file = e.target.files[0]
    setUploadandoFoto(true)

    try {
      // Preview local imediato
      const reader = new FileReader()
      reader.onload = (ev) => {
        setFotos(prev => ({ ...prev, [item.id]: ev.target?.result as string }))
      }
      reader.readAsDataURL(file)

      // Upload via API route (usa service role, sem problemas de permissão)
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `checklists/${checklistId}/${item.id}/${Date.now()}.${ext}`

      const form = new FormData()
      form.append('file', file)
      form.append('path', path)

      const res = await fetch('/api/upload-foto', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro no upload')
      }

      const { publicUrl } = await res.json()
      setFotoUrls(prev => ({ ...prev, [item.id]: publicUrl }))

      // Se já tem resposta, salvar com foto_url
      const respostaAtualItem = respostas[item.id]
      if (respostaAtualItem?.resposta) {
        await salvarResposta(item.id, respostaAtualItem.resposta, respostaAtualItem.observacao, publicUrl)
      }
    } catch (error) {
      console.error('Erro ao enviar foto:', error)
      alert('Erro ao enviar foto. Tente novamente.')
    } finally {
      setUploadandoFoto(false)
      e.target.value = ''
    }
  }

  function removerFoto() {
    const item = itens[itemAtual]
    if (!item) return
    setFotos(prev => { const n = { ...prev }; delete n[item.id]; return n })
    setFotoUrls(prev => { const n = { ...prev }; delete n[item.id]; return n })
  }

  function selecionarResposta(valor: 'sim' | 'nao' | 'na') {
    const item = itens[itemAtual]
    if (!item) return

    const observacaoAtual = respostas[item.id]?.observacao || ''

    setRespostas(prev => ({
      ...prev,
      [item.id]: { item_id: item.id, resposta: valor, observacao: observacaoAtual }
    }))

    salvarResposta(item.id, valor, observacaoAtual)
  }

  function atualizarObservacao(texto: string) {
    const item = itens[itemAtual]
    if (!item) return

    setRespostas(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], observacao: texto }
    }))
  }

  async function salvarObservacao() {
    const item = itens[itemAtual]
    if (!item || !respostas[item.id]?.resposta) return

    const { resposta, observacao } = respostas[item.id]
    await salvarResposta(item.id, resposta!, observacao)
  }

  function avancar() {
    if (itemAtual < itens.length - 1) {
      setItemAtual(itemAtual + 1)
    } else {
      verificarConclusao()
    }
  }

  function voltar() {
    if (itemAtual > 0) {
      setItemAtual(itemAtual - 1)
    }
  }

  function verificarConclusao() {
    const totalRespondidos = Object.values(respostas).filter(r => r.resposta !== null).length
    if (totalRespondidos === itens.length) {
      setConcluido(true)
    } else {
      const primeiroSemResposta = itens.findIndex(item => !respostas[item.id]?.resposta)
      if (primeiroSemResposta !== -1) {
        setItemAtual(primeiroSemResposta)
        alert(`Ainda há ${itens.length - totalRespondidos} pergunta(s) sem resposta.`)
      }
    }
  }

  const totalRespondidos = Object.values(respostas).filter(r => r.resposta !== null).length
  const progresso = itens.length > 0 ? (totalRespondidos / itens.length) * 100 : 0
  const itemAtualDados = itens[itemAtual]
  const respostaAtual = itemAtualDados ? respostas[itemAtualDados.id] : null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>Carregando checklist...</p>
      </div>
    )
  }

  if (!checklist || itens.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '1rem' }}>Checklist não encontrado ou sem itens.</p>
          <button onClick={() => router.push('/dashboard-funcionario')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Tela de conclusão
  if (concluido) {
    const conformes = Object.values(respostas).filter(r => r.resposta === 'sim').length
    const naoConformes = Object.values(respostas).filter(r => r.resposta === 'nao').length
    const naAplicavel = Object.values(respostas).filter(r => r.resposta === 'na').length

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <style>{`
          .fade-in { animation: fadeIn 0.5s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div className="fade-in" style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ width: '5rem', height: '5rem', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={48} style={{ color: '#10b981' }} />
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              Checklist Concluído!
            </h1>
            <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
              {checklist.nome}
            </p>

            {/* Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #bbf7d0' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{conformes}</p>
                <p style={{ fontSize: '0.8rem', color: '#15803d', margin: '0.25rem 0 0' }}>Conforme</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>{naoConformes}</p>
                <p style={{ fontSize: '0.8rem', color: '#b91c1c', margin: '0.25rem 0 0' }}>Não Conforme</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>{naAplicavel}</p>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0 0' }}>N/A</p>
              </div>
            </div>

            {/* Itens respondidos */}
            <div style={{ textAlign: 'left', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto' }}>
              {itens.map((item, index) => {
                const r = respostas[item.id]
                const cor = r?.resposta === 'sim' ? '#16a34a' : r?.resposta === 'nao' ? '#dc2626' : '#6b7280'
                const bg = r?.resposta === 'sim' ? '#f0fdf4' : r?.resposta === 'nao' ? '#fef2f2' : '#f9fafb'
                const label = r?.resposta === 'sim' ? 'Sim' : r?.resposta === 'nao' ? 'Não' : 'N/A'

                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: bg, borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', minWidth: '1.5rem' }}>{index + 1}.</span>
                    <span style={{ flex: 1, fontSize: '0.9rem', color: '#374151' }}>{item.titulo}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: cor, minWidth: '2.5rem', textAlign: 'right' }}>{label}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setConcluido(false); setItemAtual(0) }}
                style={{ padding: '0.875rem 1.5rem', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '500' }}
              >
                Revisar Respostas
              </button>
              <button
                onClick={() => router.push('/dashboard-funcionario')}
                style={{ padding: '0.875rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Voltar ao Dashboard
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .btn-resposta { transition: all 0.15s ease; border: 2px solid; cursor: pointer; border-radius: 0.75rem; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 1rem; }
        .btn-resposta:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', padding: '1.25rem 1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/dashboard-funcionario')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '0.75rem', padding: 0 }}
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: '0 0 0.25rem' }}>
            {checklist.nome}
          </h1>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {checklist.empresas && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                <Building2 size={14} />
                {checklist.empresas.nome_fantasia}
              </span>
            )}
            {checklist.proxima_execucao && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                <Calendar size={14} />
                {new Date(checklist.proxima_execucao).toLocaleDateString('pt-BR')}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
              <ClipboardList size={14} />
              {totalRespondidos}/{itens.length} respondidas
            </span>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '0.75rem 1.5rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
            <span>Progresso</span>
            <span style={{ fontWeight: '600', color: '#3b82f6' }}>{Math.round(progresso)}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${progresso}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>

          {/* Indicadores de itens */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {itens.map((item, index) => {
              const r = respostas[item.id]?.resposta
              const bg = r === 'sim' ? '#10b981' : r === 'nao' ? '#ef4444' : r === 'na' ? '#9ca3af' : index === itemAtual ? '#3b82f6' : '#e5e7eb'
              return (
                <button
                  key={item.id}
                  onClick={() => setItemAtual(index)}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: bg, border: index === itemAtual ? '2px solid #1d4ed8' : 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem' }}>
        {itemAtualDados && (
          <div key={itemAtualDados.id} className="fade-in">

            {/* Card da pergunta */}
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '0.25rem 0.625rem', borderRadius: '9999px' }}>
                  Pergunta {itemAtual + 1} de {itens.length}
                </span>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.75rem', lineHeight: '1.5' }}>
                {itemAtualDados.titulo}
              </h2>

              {itemAtualDados.descricao && (
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                  {itemAtualDados.descricao}
                </p>
              )}
            </div>

            {/* Botões de resposta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                className="btn-resposta"
                onClick={() => selecionarResposta('sim')}
                style={{
                  backgroundColor: respostaAtual?.resposta === 'sim' ? '#10b981' : 'white',
                  borderColor: respostaAtual?.resposta === 'sim' ? '#10b981' : '#e5e7eb',
                  color: respostaAtual?.resposta === 'sim' ? 'white' : '#374151',
                  boxShadow: respostaAtual?.resposta === 'sim' ? '0 4px 12px rgba(16,185,129,0.3)' : '0 2px 6px rgba(0,0,0,0.05)'
                }}
              >
                <CheckCircle size={28} />
                Sim
              </button>

              <button
                className="btn-resposta"
                onClick={() => selecionarResposta('nao')}
                style={{
                  backgroundColor: respostaAtual?.resposta === 'nao' ? '#ef4444' : 'white',
                  borderColor: respostaAtual?.resposta === 'nao' ? '#ef4444' : '#e5e7eb',
                  color: respostaAtual?.resposta === 'nao' ? 'white' : '#374151',
                  boxShadow: respostaAtual?.resposta === 'nao' ? '0 4px 12px rgba(239,68,68,0.3)' : '0 2px 6px rgba(0,0,0,0.05)'
                }}
              >
                <XCircle size={28} />
                Não
              </button>

              <button
                className="btn-resposta"
                onClick={() => selecionarResposta('na')}
                style={{
                  backgroundColor: respostaAtual?.resposta === 'na' ? '#6b7280' : 'white',
                  borderColor: respostaAtual?.resposta === 'na' ? '#6b7280' : '#e5e7eb',
                  color: respostaAtual?.resposta === 'na' ? 'white' : '#374151',
                  boxShadow: respostaAtual?.resposta === 'na' ? '0 4px 12px rgba(107,114,128,0.3)' : '0 2px 6px rgba(0,0,0,0.05)'
                }}
              >
                <MinusCircle size={28} />
                N/A
              </button>
            </div>

            {/* Observação */}
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>
                <MessageSquare size={16} style={{ color: '#6b7280' }} />
                Observação (opcional)
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <textarea
                  value={respostaAtual?.observacao || ''}
                  onChange={(e) => atualizarObservacao(e.target.value)}
                  placeholder="Adicione uma observação sobre este item..."
                  rows={3}
                  style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: '#374151' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; salvarObservacao() }}
                />
                <button
                  onClick={salvarObservacao}
                  title="Salvar observação"
                  style={{ padding: '0.75rem', backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Foto */}
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>
                <Camera size={16} style={{ color: '#6b7280' }} />
                Foto (opcional)
              </label>

              {fotos[itemAtualDados.id] ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={fotos[itemAtualDados.id]}
                    alt="Foto capturada"
                    style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                  />
                  <button
                    onClick={removerFoto}
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '2rem', height: '2rem', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                  <label
                    htmlFor={`foto-input-${itemAtualDados.id}`}
                    style={{ display: 'block', marginTop: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Trocar foto
                  </label>
                </div>
              ) : (
                <label
                  htmlFor={`foto-input-${itemAtualDados.id}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', padding: '1.5rem', border: '2px dashed #d1d5db', borderRadius: '0.75rem',
                    cursor: uploadandoFoto ? 'wait' : 'pointer', backgroundColor: '#f9fafb', color: '#6b7280'
                  }}
                >
                  {uploadandoFoto ? (
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Enviando foto...</p>
                  ) : (
                    <>
                      <Camera size={32} style={{ color: '#9ca3af' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Tirar foto ou escolher da galeria</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Toque para abrir a câmera</span>
                    </>
                  )}
                </label>
              )}

              <input
                id={`foto-input-${itemAtualDados.id}`}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoCaptura}
                disabled={uploadandoFoto}
                style={{ display: 'none' }}
              />
            </div>

            {/* Navegação */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={voltar}
                disabled={itemAtual === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', backgroundColor: 'white', color: itemAtual === 0 ? '#9ca3af' : '#374151', border: '1px solid #e5e7eb', borderRadius: '0.75rem', cursor: itemAtual === 0 ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '0.95rem' }}
              >
                <ChevronLeft size={18} />
                Anterior
              </button>

              {salvando && (
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Salvando...</span>
              )}

              {itemAtual === itens.length - 1 ? (
                <button
                  onClick={verificarConclusao}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', backgroundColor: totalRespondidos === itens.length ? '#10b981' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                >
                  <CheckCircle size={18} />
                  {totalRespondidos === itens.length ? 'Concluir' : 'Finalizar'}
                </button>
              ) : (
                <button
                  onClick={avancar}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                >
                  Próxima
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
