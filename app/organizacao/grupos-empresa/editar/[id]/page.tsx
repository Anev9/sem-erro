'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function EditarEmpresaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [empresa, setEmpresa] = useState({
    clientes: '',
    cnpj: '',
    tipo_empresa: '',
    ativo: true,
    auditor_atribui_acao: false,
    endereco: '',
    estado: '',
    cidade: '',
    programa: '',
    'e-mail': '',
    telefone: '',
    senha: '',
    tipo: 'aluno'
  })

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  useEffect(() => {
    buscarEmpresa()
  }, [id])

  async function buscarEmpresa() {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) setEmpresa(data)
    } catch (error) {
      console.error('Erro ao buscar empresa:', error)
      alert('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function salvar() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('alunos')
        .update(empresa)
        .eq('id', id)

      if (error) throw error
      alert('Salvo com sucesso!')
      router.push('/organizacao/grupos-empresa')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function deletar() {
    if (!confirm('Tem certeza que deseja deletar esta empresa?')) return
    
    try {
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Deletado com sucesso!')
      router.push('/organizacao/grupos-empresa')
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        <button
          onClick={() => router.push('/organizacao/grupos-empresa')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginBottom: '2rem',
            color: '#374151',
            fontSize: '0.95rem'
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Criando empresa do grupo {id}
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Preencha os dados da empresa abaixo
          </p>

          <div style={{ display: 'grid', gap: '1.75rem' }}>
            
            {/* Nome da empresa */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Nome da empresa
              </label>
              <input
                type="text"
                value={empresa.clientes}
                onChange={(e) => setEmpresa({ ...empresa, clientes: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* CNPJ */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                CNPJ
              </label>
              <input
                type="text"
                value={empresa.cnpj}
                onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Tipo de empresa */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Tipo de empresa
              </label>
              <input
                type="text"
                value={empresa.tipo_empresa}
                onChange={(e) => setEmpresa({ ...empresa, tipo_empresa: e.target.value })}
                placeholder="Ex: Supermercado, Farmácia, etc"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Ativa? */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={empresa.ativo}
                  onChange={(e) => setEmpresa({ ...empresa, ativo: e.target.checked })}
                  style={{ 
                    width: '1.25rem', 
                    height: '1.25rem', 
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
                <span style={{ fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Ativa?</span>
              </label>
            </div>

            {/* Auditor atribui ação no checklist? */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={empresa.auditor_atribui_acao}
                  onChange={(e) => setEmpresa({ ...empresa, auditor_atribui_acao: e.target.checked })}
                  style={{ 
                    width: '1.25rem', 
                    height: '1.25rem', 
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
                <span style={{ fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                  Auditor atribui ação no checklist?
                </span>
              </label>
            </div>

            {/* Endereço */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Endereço
              </label>
              <input
                type="text"
                value={empresa.endereco}
                onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                placeholder="Rua, número, bairro"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Estado */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Estado
              </label>
              <select
                value={empresa.estado}
                onChange={(e) => setEmpresa({ ...empresa, estado: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              >
                <option value="">-- Selecione um estado --</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Cidade
              </label>
              <input
                type="text"
                value={empresa.cidade}
                onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0.5rem 0' }} />

            {/* Campos adicionais */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Programa
              </label>
              <input
                type="text"
                value={empresa.programa}
                onChange={(e) => setEmpresa({ ...empresa, programa: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Email
              </label>
              <input
                type="email"
                value={empresa['e-mail']}
                onChange={(e) => setEmpresa({ ...empresa, 'e-mail': e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Telefone
              </label>
              <input
                type="text"
                value={empresa.telefone}
                onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>
                Senha de Acesso
              </label>
              <input
                type="text"
                value={empresa.senha}
                onChange={(e) => setEmpresa({ ...empresa, senha: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={salvar}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2rem',
                backgroundColor: saving ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#059669'
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#10b981'
              }}
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>

            <button
              onClick={deletar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              <Trash2 size={18} />
              Deletar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}