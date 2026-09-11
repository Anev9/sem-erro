'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Plus, Search, Edit, Trash2, Info, CheckCircle, X, Camera, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Empresa {
  id: string
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  endereco?: string
  cidade?: string
  estado?: string
  telefone?: string
  ativo: boolean
  logo_url?: string | null
}

const inputClass = 'w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none'
const labelClass = 'mb-2 block text-sm font-semibold text-ink-muted'

export default function MinhasEmpresas() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    telefone: '',
    ativo: true
  })

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  useEffect(() => {
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') { router.push('/login'); return }
    const id = String(user.id)
    setClienteId(id)
    await carregarEmpresas(id)
  }

  async function carregarEmpresas(alunoId?: string) {
    try {
      setLoading(true)
      const id = alunoId || clienteId
      if (!id) return
      const res = await fetch(`/api/aluno/empresas?aluno_id=${id}`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      toast.error('Erro ao carregar empresas: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.nome_fantasia || !formData.cnpj) {
      toast.warning('Preencha os campos obrigatórios: Nome Fantasia e CNPJ')
      return
    }

    if (!clienteId) {
      toast.error('Erro: Cliente não identificado. Recarregue a página.')
      return
    }

    try {
      setLoading(true)

      const payload = {
        nome_fantasia: formData.nome_fantasia,
        razao_social: formData.razao_social || null,
        cnpj: formData.cnpj,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        telefone: formData.telefone || null,
        ativo: formData.ativo
      }

      if (editingId) {
        const res = await fetch('/api/aluno/empresas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, aluno_id: clienteId, ...payload })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Erro ao atualizar')
        }
        toast.success('Empresa atualizada com sucesso!')

      } else {
        const res = await fetch('/api/aluno/empresas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aluno_id: clienteId, ...payload })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Erro ao cadastrar')
        }
        toast.success('Empresa cadastrada com sucesso!')
      }

      setShowAddModal(false)
      resetForm()
      await carregarEmpresas()

    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error)
      toast.error('Erro ao salvar empresa: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function editarEmpresa(empresa: Empresa) {
    setFormData({
      nome_fantasia: empresa.nome_fantasia,
      razao_social: empresa.razao_social || '',
      cnpj: empresa.cnpj || '',
      endereco: empresa.endereco || '',
      cidade: empresa.cidade || '',
      estado: empresa.estado || '',
      telefone: empresa.telefone || '',
      ativo: empresa.ativo
    })
    setEditingId(empresa.id)
    setShowAddModal(true)
  }

  async function toggleAtivo(id: string, ativoAtual: boolean) {
    try {
      const res = await fetch('/api/aluno/empresas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aluno_id: clienteId, ativo: !ativoAtual })
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      await carregarEmpresas()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  async function deletarEmpresa(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${nome}"?\n\nOs colaboradores vinculados a ela serão desativados.`)) {
      return
    }

    try {
      const res = await fetch(`/api/aluno/empresas?id=${id}&aluno_id=${clienteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Empresa excluída com sucesso!')
      await carregarEmpresas()
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      toast.error('Erro ao excluir empresa')
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>, empresa: Empresa) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogoId(empresa.id)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('path', `empresas/${empresa.id}/logo`)

      const res = await fetch('/api/upload-foto', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Erro ao enviar logo')
      const { publicUrl } = await res.json()

      const putRes = await fetch('/api/aluno/empresas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: empresa.id, aluno_id: clienteId, logo_url: publicUrl }),
      })
      if (!putRes.ok) throw new Error('Erro ao salvar logo')

      setEmpresas(prev => prev.map(emp => emp.id === empresa.id ? { ...emp, logo_url: publicUrl } : emp))
      toast.success('Logo atualizado com sucesso!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar logo')
    } finally {
      setUploadingLogoId(null)
      e.target.value = ''
    }
  }

  const resetForm = () => {
    setFormData({
      nome_fantasia: '',
      razao_social: '',
      cnpj: '',
      endereco: '',
      cidade: '',
      estado: '',
      telefone: '',
      ativo: true
    })
    setEditingId(null)
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  const filteredEmpresas = empresas.filter(emp =>
    emp.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cnpj?.includes(searchTerm)
  )

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 py-8">
        <PageHeader
          title="Minhas Empresas"
          subtitle="Gerencie as empresas do seu grupo"
          backHref="/dashboard-aluno"
          actions={
            <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true) }} icon={<Plus size={18} />}>
              Nova Empresa
            </Button>
          }
        />

        {/* Stats */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-tint">
                <Building2 size={24} className="text-violet" />
              </div>
              <div>
                <p className="text-sm text-ink-muted">Total de Empresas</p>
                <p className="font-display text-2xl font-bold text-ink">{empresas.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:col-span-2">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl bg-surface-2 py-2.5 pl-10 pr-3.5 text-sm outline-none"
              />
            </div>
          </Card>
        </div>

        {/* Info */}
        <div className="mb-5 flex gap-3 rounded-2xl bg-blue-tint p-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue">
            <Info size={18} className="text-white" />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-blue">Sobre o cadastro de empresas</h3>
            <p className="text-sm text-blue">
              Cadastre as empresas do seu grupo para atribuir checklists e acompanhar o desempenho de seus colaboradores.
            </p>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {loading && empresas.length === 0 ? (
            <div className="py-16 text-center text-sm text-ink-muted">Carregando empresas...</div>
          ) : filteredEmpresas.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-tint">
                <Building2 size={36} className="text-brand" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink">
                {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
              </h3>
              <p className="mt-2 mb-6 text-sm text-ink-muted">
                {searchTerm ? 'Tente pesquisar com outros termos' : 'Comece adicionando a primeira empresa'}
              </p>
              {!searchTerm && (
                <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true) }} icon={<Plus size={18} />}>
                  Adicionar Primeira Empresa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-surface-2 bg-surface-2">
                    <th className="w-20 p-4 text-center text-sm font-semibold text-ink-muted">Logo</th>
                    <th className="p-4 text-left text-sm font-semibold text-ink-muted">Nome Fantasia</th>
                    <th className="p-4 text-left text-sm font-semibold text-ink-muted">CNPJ</th>
                    <th className="p-4 text-left text-sm font-semibold text-ink-muted">Cidade/Estado</th>
                    <th className="p-4 text-center text-sm font-semibold text-ink-muted">Status</th>
                    <th className="p-4 text-center text-sm font-semibold text-ink-muted">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmpresas.map((empresa) => (
                    <tr key={empresa.id} className="border-b border-surface-2 transition-colors last:border-0 hover:bg-surface-2">
                      <td className="p-4 text-center">
                        <div
                          className="relative inline-block cursor-pointer"
                          onClick={() => document.getElementById(`logo-input-${empresa.id}`)?.click()}
                          title="Clique para alterar o logo"
                        >
                          {empresa.logo_url ? (
                            <img
                              src={empresa.logo_url}
                              alt={empresa.nome_fantasia}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-tint">
                              <Building2 size={20} className="text-violet" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-violet">
                            {uploadingLogoId === empresa.id
                              ? <Loader2 size={9} className="animate-spin text-white" />
                              : <Camera size={9} className="text-white" />}
                          </div>
                        </div>
                        <input
                          id={`logo-input-${empresa.id}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => handleLogoUpload(e, empresa)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-ink">{empresa.nome_fantasia}</div>
                        {empresa.razao_social && (
                          <div className="mt-0.5 text-sm text-ink-muted">{empresa.razao_social}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-ink-muted">{empresa.cnpj || '-'}</td>
                      <td className="p-4 text-sm text-ink-muted">
                        {empresa.cidade && empresa.estado ? `${empresa.cidade}/${empresa.estado}` : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <Badge tone={empresa.ativo ? 'success' : 'danger'}>{empresa.ativo ? 'Ativa' : 'Inativa'}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap justify-center gap-2">
                          <Button variant="secondary" size="sm" onClick={() => editarEmpresa(empresa)} icon={<Edit size={14} />}>
                            Editar
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className={empresa.ativo ? 'text-amber' : 'text-teal'}
                            onClick={() => toggleAtivo(empresa.id, empresa.ativo)}
                          >
                            {empresa.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => deletarEmpresa(empresa.id, empresa.nome_fantasia)} icon={<Trash2 size={14} />}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[600px] overflow-auto rounded-3xl bg-white shadow-soft">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-surface-2 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-tint">
                  <Building2 size={20} className="text-violet" />
                </div>
                <h2 className="font-display text-lg font-bold text-ink">
                  {editingId ? 'Editar Empresa' : 'Nova Empresa'}
                </h2>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetForm() }}
                className="rounded-lg p-2 text-ink-muted hover:bg-surface-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid gap-5">
                <div>
                  <label className={labelClass}>Nome Fantasia <span className="text-coral">*</span></label>
                  <input
                    type="text"
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                    placeholder="Digite o nome fantasia"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Razão Social</label>
                  <input
                    type="text"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    placeholder="Digite a razão social"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>CNPJ <span className="text-coral">*</span></label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, complemento"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-[2fr_1fr] gap-4">
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Digite a cidade"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">UF</option>
                      {estados.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="h-5 w-5 cursor-pointer accent-brand"
                    />
                    <span className="text-sm font-semibold text-ink-muted">Empresa ativa</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-surface-2 p-6">
              <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm() }} disabled={loading}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={loading} icon={!loading ? <CheckCircle size={18} /> : undefined}>
                {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
