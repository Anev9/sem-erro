'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, UserPlus, Edit, Trash2, Mail, Briefcase, Building2, KeyRound } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Colaborador {
  id: string
  nome: string
  email: string
  cargo: string
  celular?: string
  ativo: boolean
  empresas?: {
    nome_fantasia: string
  }
}

export default function ColaboradoresPage() {
  const router = useRouter()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [alunoId, setAlunoId] = useState<string | null>(null)

  useEffect(() => {
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') {
      router.push('/login')
      return
    }
    setAlunoId(user.id)
    await carregarColaboradores(user.id)
  }

  async function carregarColaboradores(alunoId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/aluno/colaboradores?aluno_id=${alunoId}`)
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) throw new Error('Erro ao carregar')
      setColaboradores(await res.json())
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return
    const res = await fetch('/api/aluno/colaboradores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: false, aluno_id: alunoId })
    })
    if (!res.ok) { toast.error('Erro ao excluir colaborador'); return }
    toast.success('Colaborador excluído com sucesso!')
    if (alunoId) carregarColaboradores(alunoId)
  }

  async function handleResetSenha(id: string, nome: string) {
    if (!confirm(`Resetar a senha de ${nome} para "123mudar"?`)) return
    const res = await fetch('/api/aluno/colaboradores/reset-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colaborador_id: id })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(data?.error || 'Erro ao resetar senha')
      return
    }
    toast.success(`Senha de ${nome} resetada para "123mudar" com sucesso!`)
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 py-8">
        <PageHeader
          title="Colaboradores"
          subtitle={`${colaboradores.length} colaborador${colaboradores.length !== 1 ? 'es' : ''} cadastrado${colaboradores.length !== 1 ? 's' : ''}`}
          backHref="/dashboard-aluno"
          actions={
            <Button variant="primary" onClick={() => router.push('/colaboradores/novo')} icon={<UserPlus size={18} />}>
              Novo Colaborador
            </Button>
          }
        />

        <Card className="p-6 sm:p-8">
          {loading ? (
            <div className="py-16 text-center text-sm text-ink-muted">Carregando colaboradores...</div>
          ) : colaboradores.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-tint">
                <Users size={36} className="text-brand" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink">Nenhum colaborador cadastrado</h3>
              <p className="mt-2 mb-6 text-sm text-ink-muted">Comece adicionando colaboradores às suas empresas</p>
              <Button variant="primary" onClick={() => router.push('/colaboradores/novo')} icon={<UserPlus size={18} />}>
                Cadastrar Primeiro Colaborador
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {colaboradores.map(colab => (
                <div key={colab.id} className="rounded-2xl bg-surface-2 p-5">
                  <div className="mb-4">
                    <h3 className="mb-1.5 text-base font-bold text-ink">{colab.nome}</h3>
                    <div className="mb-1 flex items-center gap-2 text-sm text-ink-muted">
                      <Mail size={14} />
                      {colab.email}
                    </div>
                    <div className="mb-1 flex items-center gap-2 text-sm text-ink-muted">
                      <Briefcase size={14} />
                      {colab.cargo}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-ink-muted">
                      <Building2 size={14} />
                      {colab.empresas?.nome_fantasia || 'Sem empresa'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-white pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center"
                      onClick={() => router.push(`/colaboradores/editar/${colab.id}`)}
                      icon={<Edit size={14} />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center text-amber"
                      onClick={() => handleResetSenha(colab.id, colab.nome)}
                      title="Resetar senha para 123mudar"
                      icon={<KeyRound size={14} />}
                    >
                      Reset Senha
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1 justify-center"
                      onClick={() => handleDelete(colab.id, colab.nome)}
                      icon={<Trash2 size={14} />}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
