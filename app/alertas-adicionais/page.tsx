'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Bell, Plus, AlertTriangle, CheckSquare, Building2, User, Save, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Checklist {
  id: string
  nome: string
  empresa_id: string
}

interface Colaborador {
  id: string
  nome: string
  cargo?: string
  empresa_id: string
}

interface Empresa {
  id: string
  nome_fantasia: string
}

const TIPOS_ALERTA = [
  { key: 'aoCriar', label: 'Ao criar checklist' },
  { key: 'aoFinalizar', label: 'Ao finalizar checklist' },
  { key: 'problemasCriticos', label: 'Problemas críticos detectados' },
  { key: 'prazoProximo', label: 'Quando o horário limite do checklist estiver próximo' },
] as const

type TipoAlertaKey = typeof TIPOS_ALERTA[number]['key']

export default function AlertasAdicionais() {
  const [checklistFuturo, setChecklistFuturo] = useState('')
  const [usuario, setUsuario] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [tipos, setTipos] = useState<Record<TipoAlertaKey, boolean>>({
    aoCriar: false,
    aoFinalizar: false,
    problemasCriticos: false,
    prazoProximo: false,
  })

  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [usuarios, setUsuarios] = useState<Colaborador[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setCarregando(true)

        const [checklistsRes, colaboradoresRes, empresasRes] = await Promise.all([
          fetch('/api/aluno/checklists-futuros'),
          fetch('/api/aluno/colaboradores'),
          fetch('/api/aluno/empresas')
        ])

        const [checklistsData, colaboradoresData, empresasData] = await Promise.all([
          checklistsRes.json(),
          colaboradoresRes.json(),
          empresasRes.json()
        ])

        if (checklistsRes.ok) {
          setChecklists(Array.isArray(checklistsData) ? checklistsData : [])
        } else {
          console.error('Erro ao buscar checklists:', checklistsData.error)
        }

        if (colaboradoresRes.ok) {
          setUsuarios(Array.isArray(colaboradoresData) ? colaboradoresData : [])
        } else {
          console.error('Erro ao buscar colaboradores:', colaboradoresData.error)
        }

        if (empresasRes.ok) {
          setEmpresas(Array.isArray(empresasData) ? empresasData : [])
        } else {
          console.error('Erro ao buscar empresas:', empresasData.error)
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        toast.error('Erro ao carregar dados do formulário')
      } finally {
        setCarregando(false)
      }
    }

    fetchData()
  }, [])

  const usuariosDaEmpresa = empresa ? usuarios.filter((u) => u.empresa_id === empresa) : usuarios

  const handleChecklistChange = (id: string) => {
    setChecklistFuturo(id)
    const checklist = checklists.find((c) => c.id === id)
    if (checklist) {
      setEmpresa(checklist.empresa_id)
      if (!usuarios.some((u) => u.id === usuario && u.empresa_id === checklist.empresa_id)) {
        setUsuario('')
      }
    } else {
      setEmpresa('')
    }
  }

  const handleSubmit = async () => {
    if (!checklistFuturo || !usuario || !empresa) {
      toast.warning('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (!Object.values(tipos).some(Boolean)) {
      toast.warning('Selecione pelo menos um tipo de notificação')
      return
    }

    const alertaData = {
      checklist_futuro_id: checklistFuturo,
      usuario_id: usuario,
      empresa_id: empresa,
      notificar_ao_criar: tipos.aoCriar,
      notificar_ao_finalizar: tipos.aoFinalizar,
      notificar_problemas_criticos: tipos.problemasCriticos,
      notificar_prazo_proximo: tipos.prazoProximo
    }

    try {
      const res = await fetch('/api/aluno/alertas-adicionais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertaData)
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao criar alerta')
        return
      }

      toast.success('Alerta criado com sucesso!')
      handleReset()
    } catch (err) {
      console.error('Erro ao salvar alerta:', err)
      toast.error('Erro ao criar alerta')
    }
  }

  const handleReset = () => {
    setChecklistFuturo('')
    setUsuario('')
    setEmpresa('')
    setTipos({ aoCriar: false, aoFinalizar: false, problemasCriticos: false, prazoProximo: false })
  }

  const podeEnviar = !carregando && checklists.length > 0 && usuarios.length > 0 && empresas.length > 0

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <PageHeader
          title="Criar Alerta Adicional"
          subtitle="Configure notificações personalizadas para checklists"
          backHref="/dashboard-aluno"
        />

        {/* Info Alert */}
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-amber-tint p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Sobre os alertas adicionais</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Configure notificações específicas para serem enviadas ao usuário quando eventos
              importantes acontecerem com os checklists selecionados.
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-surface-2 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand">
              <Plus size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="font-display text-lg font-bold text-ink">Informações do Alerta</h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* Checklist Futuro */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-muted">
                <CheckSquare size={16} className="text-brand" />
                Checklist Programado
              </label>
              <select
                value={checklistFuturo}
                onChange={(e) => handleChecklistChange(e.target.value)}
                disabled={carregando || checklists.length === 0}
                className="w-full cursor-pointer rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {carregando
                    ? 'Carregando...'
                    : checklists.length === 0
                      ? 'Nenhum checklist programado cadastrado ainda'
                      : 'Selecione um checklist'}
                </option>
                {checklists.map((checklist) => (
                  <option key={checklist.id} value={checklist.id}>
                    {checklist.nome}
                  </option>
                ))}
              </select>
              {!carregando && checklists.length === 0 && (
                <p className="mt-2 rounded-lg bg-amber-tint px-3 py-2 text-xs text-ink-muted">
                  Você precisa criar checklists programados antes de configurar alertas.
                </p>
              )}
            </div>

            {/* Usuário */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-muted">
                <User size={16} className="text-brand" />
                Usuário a ser notificado
              </label>
              <select
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={carregando || usuariosDaEmpresa.length === 0}
                className="w-full cursor-pointer rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {carregando
                    ? 'Carregando...'
                    : usuariosDaEmpresa.length === 0
                      ? (checklistFuturo ? 'Nenhum usuário nesta empresa' : 'Selecione um checklist primeiro')
                      : 'Selecione um usuário'}
                </option>
                {usuariosDaEmpresa.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome}{user.cargo ? ` - ${user.cargo}` : ''}
                  </option>
                ))}
              </select>
              {!carregando && usuariosDaEmpresa.length === 0 && (
                <p className="mt-2 rounded-lg bg-amber-tint px-3 py-2 text-xs text-ink-muted">
                  {checklistFuturo
                    ? 'Nenhum colaborador cadastrado na empresa deste checklist.'
                    : 'Selecione um checklist para ver os usuários disponíveis.'}
                </p>
              )}
            </div>

            {/* Empresa */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-muted">
                <Building2 size={16} className="text-brand" />
                Empresa
              </label>
              <select
                value={empresa}
                disabled
                className="w-full cursor-not-allowed rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm opacity-60 outline-none"
              >
                <option value="">
                  {empresas.length === 0 ? 'Nenhuma empresa cadastrada ainda' : 'Definida automaticamente pelo checklist'}
                </option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome_fantasia}
                  </option>
                ))}
              </select>
              {!carregando && empresas.length === 0 && (
                <p className="mt-2 rounded-lg bg-amber-tint px-3 py-2 text-xs text-ink-muted">
                  Você precisa cadastrar empresas no sistema antes de configurar alertas.
                </p>
              )}
            </div>

            {/* Tipos de Alerta */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-muted">
                <AlertTriangle size={16} className="text-brand" />
                Quando notificar?
              </label>
              <div className="flex flex-col gap-2.5">
                {TIPOS_ALERTA.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 transition-colors hover:bg-blue-tint"
                  >
                    <input
                      type="checkbox"
                      checked={tipos[key]}
                      onChange={(e) => setTipos({ ...tipos, [key]: e.target.checked })}
                      className="h-5 w-5 cursor-pointer accent-brand"
                    />
                    <span className={`text-sm ${tipos[key] ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3 border-t border-surface-2 pt-6">
            <Button variant="secondary" onClick={handleReset} icon={<X size={16} />}>
              Limpar
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!podeEnviar} icon={<Save size={16} />}>
              Criar Alerta
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
