'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Empresa } from '@/lib/supabase'
import { 
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Info,
  ArrowLeft,
  CheckCircle,
  X
} from 'lucide-react'

export default function MinhasEmpresas() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
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
    carregarEmpresas()
  }, [])

  async function carregarEmpresas() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      alert('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.nome_fantasia || !formData.cnpj) {
      alert('Preencha os campos obrigatórios: Nome Fantasia e CNPJ')
      return
    }

    try {
      setLoading(true)

      // PEGAR ALUNO DO LOCALSTORAGE
      const alunoData = localStorage.getItem('aluno')
      if (!alunoData) {
        alert('Você precisa estar logado')
        router.push('/login')
        return
      }

      const aluno = JSON.parse(alunoData)

      if (editingId) {
        // ATUALIZAR
        const { error } = await supabase
          .from('empresas')
          .update({
            nome_fantasia: formData.nome_fantasia,
            razao_social: formData.razao_social,
            cnpj: formData.cnpj,
            endereco: formData.endereco,
            cidade: formData.cidade,
            estado: formData.estado,
            telefone: formData.telefone,
            ativo: formData.ativo
          })
          .eq('id', editingId)

        if (error) throw error
        alert('Empresa atualizada com sucesso!')
      } else {
        // CRIAR
        const { error } = await supabase
          .from('empresas')
          .insert([{
            nome_fantasia: formData.nome_fantasia,
            razao_social: formData.razao_social,
            cnpj: formData.cnpj,
            endereco: formData.endereco,
            cidade: formData.cidade,
            estado: formData.estado,
            telefone: formData.telefone,
            ativo: formData.ativo,
            aluno_id: aluno.id
          }])

        if (error) throw error
        alert('Empresa cadastrada com sucesso!')
      }

      setShowAddModal(false)
      resetForm()
      carregarEmpresas()
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error)
      alert('Erro: ' + error.message)
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
      const { error } = await supabase
        .from('empresas')
        .update({ ativo: !ativoAtual })
        .eq('id', id)

      if (error) throw error
      carregarEmpresas()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  async function deletarEmpresa(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${nome}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Empresa excluída com sucesso!')
      carregarEmpresas()
    } catch (error) {
      console.error('Erro ao deletar empresa:', error)
      alert('Erro ao deletar empresa')
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

  const filteredEmpresas = empresas.filter(emp =>
    emp.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cnpj?.includes(searchTerm)
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .table-row { transition: all 0.2s ease; }
        .table-row:hover { background-color: #f8fafc; }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/dashboard-admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <ArrowLeft size={18} />
              Voltar
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={32} style={{ color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0
                }}>
                  Minhas Empresas
                </h1>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: '0.25rem 0 0 0'
                }}>
                  Gerencie as empresas do seu grupo
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.875rem 1.75rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={20} />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Stats */}
        <div className="fade-in" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '2px solid #8b5cf6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#ede9fe',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={24} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Total de Empresas
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {empresas.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            gridColumn: 'span 2'
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Pesquisar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="fade-in" style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '1rem',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: '#3b82f6',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Info size={20} style={{ color: 'white' }} />
          </div>
          <div>
            <h3 style={{
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#1e40af',
              margin: '0 0 0.375rem 0'
            }}>
              Sobre o cadastro de empresas
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
              Cadastre as empresas do seu grupo para atribuir checklists e acompanhar o desempenho.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="fade-in" style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          {loading && empresas.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <p>Carregando...</p>
            </div>
          ) : filteredEmpresas.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f3f4f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Building2 size={40} style={{ color: '#9ca3af' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '0 0 1.5rem 0' }}>
                {searchTerm ? 'Tente pesquisar com outros termos' : 'Comece adicionando a primeira empresa'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    resetForm()
                    setShowAddModal(true)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600'
                  }}
                >
                  <Plus size={18} />
                  Adicionar Primeira Empresa
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Nome Fantasia</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>CNPJ</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Cidade/Estado</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmpresas.map((empresa) => (
                    <tr key={empresa.id} className="table-row" style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{empresa.nome_fantasia}</div>
                        {empresa.razao_social && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {empresa.razao_social}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>{empresa.cnpj || '-'}</td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>
                        {empresa.cidade && empresa.estado ? `${empresa.cidade}/${empresa.estado}` : '-'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.375rem 0.875rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          backgroundColor: empresa.ativo ? '#d1fae5' : '#fee2e2',
                          color: empresa.ativo ? '#065f46' : '#991b1b'
                        }}>
                          {empresa.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => editarEmpresa(empresa)}
                            style={{
                              padding: '0.5rem 0.875rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem'
                            }}
                          >
                            <Edit size={14} />
                            Editar
                          </button>
                          <button
                            onClick={() => toggleAtivo(empresa.id, empresa.ativo)}
                            style={{
                              padding: '0.5rem 0.875rem',
                              backgroundColor: empresa.ativo ? '#f59e0b' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            {empresa.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => deletarEmpresa(empresa.id, empresa.nome_fantasia)}
                            style={{
                              padding: '0.5rem 0.875rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem'
                            }}
                          >
                            <Trash2 size={14} />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '2rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {editingId ? 'Editar Empresa' : 'Nova Empresa'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={20} style={{ color: '#6b7280' }} />
                </button>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                    placeholder="Ex: Supermercado São José"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Razão Social
                  </label>
                  <input
                    type="text"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                    placeholder="Ex: Supermercado São José Ltda"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Rua, número, bairro"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="Ex: Rio de Janeiro"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Selecione...</option>
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    backgroundColor: '#f9fafb',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>
                      Empresa ativa
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle size={18} />
                  {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}