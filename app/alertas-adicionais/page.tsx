'use client'

import { useState } from 'react'
import { 
  ArrowLeft,
  Bell,
  Plus,
  AlertTriangle,
  CheckSquare,
  Building2,
  User,
  Save,
  X
} from 'lucide-react'

export default function AlertasAdicionais() {
  const [checklistFuturo, setChecklistFuturo] = useState('')
  const [usuario, setUsuario] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [aoCriar, setAoCriar] = useState(false)
  const [aoFinalizar, setAoFinalizar] = useState(false)
  const [problemasCriticos, setProblemasCriticos] = useState(false)

  // AQUI VOCÊ VAI BUSCAR OS DADOS DO SUPABASE
  // Exemplo:
  // const [checklists, setChecklists] = useState([])
  // const [usuarios, setUsuarios] = useState([])
  // const [empresas, setEmpresas] = useState([])
  // 
  // useEffect(() => {
  //   async function fetchData() {
  //     const { data: checklistsData } = await supabase.from('checklists_futuros').select('*')
  //     const { data: usuariosData } = await supabase.from('usuarios').select('*')
  //     const { data: empresasData } = await supabase.from('empresas').select('*')
  //     setChecklists(checklistsData || [])
  //     setUsuarios(usuariosData || [])
  //     setEmpresas(empresasData || [])
  //   }
  //   fetchData()
  // }, [])

  // Dados temporários vazios (simula que ainda não tem dados no banco)
  const checklists: any[] = []
  const usuarios: any[] = []
  const empresas: any[] = []

  const handleSubmit = async () => {
    if (!checklistFuturo || !usuario || !empresa) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (!aoCriar && !aoFinalizar && !problemasCriticos) {
      alert('Selecione pelo menos um tipo de notificação')
      return
    }

    const alertaData = {
      checklist_futuro_id: checklistFuturo,
      usuario_id: usuario,
      empresa_id: empresa,
      notificar_ao_criar: aoCriar,
      notificar_ao_finalizar: aoFinalizar,
      notificar_problemas_criticos: problemasCriticos
    }

    console.log('Dados do alerta:', alertaData)

    // AQUI VOCÊ VAI SALVAR NO SUPABASE
    // const { data, error } = await supabase
    //   .from('alertas_adicionais')
    //   .insert([alertaData])
    // 
    // if (error) {
    //   alert('Erro ao criar alerta')
    //   return
    // }
    // 
    // alert('Alerta criado com sucesso!')
    // handleReset()
  }

  const handleReset = () => {
    setChecklistFuturo('')
    setUsuario('')
    setEmpresa('')
    setAoCriar(false)
    setAoFinalizar(false)
    setProblemasCriticos(false)
  }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .slide-up { animation: slideUp 0.5s ease-out; }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background-color: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .checkbox-label:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }

        .checkbox-label input:checked + span {
          font-weight: 600;
          color: #667eea;
        }

        .checkbox-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #667eea;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .form-input:disabled {
          background-color: #f1f5f9;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .form-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .empty-state {
          padding: 1rem;
          background-color: #fef3c7;
          border: 1px solid #fde047;
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .empty-state-text {
          font-size: 0.875rem;
          color: #92400e;
          margin: 0;
        }
      `}</style>

      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1.5rem 2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              <button
                onClick={() => window.history.back()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <ArrowLeft size={18} />
                Voltar
              </button>
              <div>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}>
                  Criar Alerta Adicional
                </h1>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: '500'
                }}>
                  Configure notificações personalizadas para checklists
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          {/* Info Alert */}
          <div className="slide-up" style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fde047',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f59e0b',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bell size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#78350f',
                margin: '0 0 0.375rem 0'
              }}>
                Sobre os alertas adicionais
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#92400e',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Configure notificações específicas para serem enviadas ao usuário quando eventos 
                importantes acontecerem com os checklists selecionados.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="slide-up" style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plus size={24} style={{ color: 'white' }} strokeWidth={2.5} />
              </div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0f172a',
                margin: 0
              }}>
                Informações do Alerta
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Checklist Futuro */}
              <div>
                <label className="form-label">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckSquare size={18} style={{ color: '#667eea' }} />
                    Checklist Programado
                  </div>
                </label>
                <select
                  value={checklistFuturo}
                  onChange={(e) => setChecklistFuturo(e.target.value)}
                  className="form-input"
                  disabled={checklists.length === 0}
                  style={{
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23667eea\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '20px',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="">
                    {checklists.length === 0 
                      ? 'Nenhum checklist programado cadastrado ainda' 
                      : 'Selecione um checklist'}
                  </option>
                  {checklists.map((checklist) => (
                    <option key={checklist.id} value={checklist.id}>
                      {checklist.nome}
                    </option>
                  ))}
                </select>
                {checklists.length === 0 && (
                  <div className="empty-state">
                    <p className="empty-state-text">
                      Você precisa criar checklists programados antes de configurar alertas.
                    </p>
                  </div>
                )}
              </div>

              {/* Usuário */}
              <div>
                <label className="form-label">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} style={{ color: '#667eea' }} />
                    Usuário a ser notificado
                  </div>
                </label>
                <select
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="form-input"
                  disabled={usuarios.length === 0}
                  style={{
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23667eea\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '20px',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="">
                    {usuarios.length === 0 
                      ? 'Nenhum usuário cadastrado ainda' 
                      : 'Selecione um usuário'}
                  </option>
                  {usuarios.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome} - {user.cargo}
                    </option>
                  ))}
                </select>
                {usuarios.length === 0 && (
                  <div className="empty-state">
                    <p className="empty-state-text">
                      Você precisa cadastrar usuários no sistema antes de configurar alertas.
                    </p>
                  </div>
                )}
              </div>

              {/* Empresa */}
              <div>
                <label className="form-label">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={18} style={{ color: '#667eea' }} />
                    Empresa
                  </div>
                </label>
                <select
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="form-input"
                  disabled={empresas.length === 0}
                  style={{
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23667eea\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '20px',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="">
                    {empresas.length === 0 
                      ? 'Nenhuma empresa cadastrada ainda' 
                      : 'Selecione uma empresa'}
                  </option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome}
                    </option>
                  ))}
                </select>
                {empresas.length === 0 && (
                  <div className="empty-state">
                    <p className="empty-state-text">
                      Você precisa cadastrar empresas no sistema antes de configurar alertas.
                    </p>
                  </div>
                )}
              </div>

              {/* Tipos de Alerta */}
              <div>
                <label className="form-label" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} style={{ color: '#667eea' }} />
                    Quando notificar?
                  </div>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={aoCriar}
                      onChange={(e) => setAoCriar(e.target.checked)}
                    />
                    <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                      Ao criar checklist
                    </span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={aoFinalizar}
                      onChange={(e) => setAoFinalizar(e.target.checked)}
                    />
                    <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                      Ao finalizar checklist
                    </span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={problemasCriticos}
                      onChange={(e) => setProblemasCriticos(e.target.checked)}
                    />
                    <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                      Problemas críticos detectados
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              marginTop: '2.5rem',
              paddingTop: '2rem',
              borderTop: '2px solid #f1f5f9',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.75rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <X size={18} />
                Limpar
              </button>

              <button
                onClick={handleSubmit}
                disabled={checklists.length === 0 || usuarios.length === 0 || empresas.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.875rem 2rem',
                  background: checklists.length === 0 || usuarios.length === 0 || empresas.length === 0 
                    ? '#cbd5e1' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: checklists.length === 0 || usuarios.length === 0 || empresas.length === 0 
                    ? 'not-allowed' 
                    : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  opacity: checklists.length === 0 || usuarios.length === 0 || empresas.length === 0 
                    ? 0.6 
                    : 1
                }}
                onMouseEnter={(e) => {
                  if (checklists.length > 0 && usuarios.length > 0 && empresas.length > 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (checklists.length > 0 && usuarios.length > 0 && empresas.length > 0) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                <Save size={18} />
                Criar Alerta
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}