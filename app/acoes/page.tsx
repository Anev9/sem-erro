'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AcaoCorretiva {
  id: string;
  empresa_id: string;
  checklist_id: string | null;
  item_id: string | null;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  prazo: string | null;
  status: 'aguardando' | 'em_andamento' | 'concluida' | 'atrasada';
  prioridade: 'baixa' | 'media' | 'alta';
  categoria: string | null;
  orcamento: number | null;
  valor_pago: number | null;
  observacoes: string | null;
  urgente: boolean;
  created_at: string;
  empresas?: { nome_fantasia: string };
  checklists_futuros?: { titulo: string };
  checklist_futuro_itens?: { titulo: string };
}

export default function ListaAcoes() {
  const router = useRouter();
  const [acoes, setAcoes] = useState<AcaoCorretiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFinalizadas, setMostrarFinalizadas] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    empresa: 'todas',
    status: 'todas'
  });
  const [ordenacao, setOrdenacao] = useState<'loja' | 'data'>('data');
  const [empresas, setEmpresas] = useState<{ id: string; nome_fantasia: string }[]>([]);

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  async function verificarAutenticacao() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'aluno') {
      router.push('/login');
      return;
    }
    await carregarDados(user.id);
  }

  async function carregarDados(alunoId: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/aluno/acoes?aluno_id=${alunoId}`);
      if (!response.ok) throw new Error('Erro ao carregar dados');
      const { empresas: empresasData, acoes: acoesData } = await response.json();
      setEmpresas(empresasData || []);
      setAcoes(acoesData || []);
    } catch (err) {
      console.error('Erro ao carregar ações:', err);
    } finally {
      setLoading(false);
    }
  }

  async function excluirAcao(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;

    const response = await fetch(`/api/aluno/acoes?id=${id}`, { method: 'DELETE' });
    if (!response.ok) {
      alert('Erro ao excluir ação.');
      return;
    }
    setAcoes(prev => prev.filter(a => a.id !== id));
  }

  const acoesFiltradas = acoes
    .filter(acao => {
      if (!mostrarFinalizadas && acao.status === 'concluida') return false;
      if (filtros.empresa !== 'todas' && acao.empresa_id !== filtros.empresa) return false;
      if (filtros.status !== 'todas' && acao.status !== filtros.status) return false;
      if (filtros.dataInicio && acao.created_at < filtros.dataInicio) return false;
      if (filtros.dataFim && acao.created_at > filtros.dataFim + 'T23:59:59') return false;
      return true;
    })
    .sort((a, b) => {
      if (ordenacao === 'loja') {
        return (a.empresas?.nome_fantasia || '').localeCompare(b.empresas?.nome_fantasia || '');
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getStatusColor = (status: string) => {
    const cores = {
      aguardando: { bg: '#FFF3E0', text: '#E65100', border: '#FFB74D' },
      em_andamento: { bg: '#E3F2FD', text: '#1565C0', border: '#64B5F6' },
      concluida: { bg: '#E8F5E9', text: '#2E7D32', border: '#81C784' },
      atrasada: { bg: '#FFEBEE', text: '#C62828', border: '#E57373' }
    };
    return cores[status as keyof typeof cores] || cores.aguardando;
  };

  const getPrioridadeColor = (prioridade: string) => {
    const cores = { baixa: '#4CAF50', media: '#FF9800', alta: '#ef5350' };
    return cores[prioridade as keyof typeof cores] || '#FF9800';
  };

  const getStatusTexto = (status: string) => {
    const textos = {
      aguardando: 'Aguardando',
      em_andamento: 'Em Andamento',
      concluida: 'Concluída',
      atrasada: 'Atrasada'
    };
    return textos[status as keyof typeof textos] || status;
  };

  const formatarData = (data: string | null) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666', fontSize: '1rem' }}>Carregando ações...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{
        background: '#37474f',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '45px', height: '45px', background: 'white', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.5rem' }}>✓</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>SEM ERRO</h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Botão Voltar */}
        <button
          onClick={() => router.push('/dashboard-aluno')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'white', border: '2px solid #e0e0e0', borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: '600',
            color: '#37474f', cursor: 'pointer', marginBottom: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#37474f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
        >
          <span style={{ fontSize: '1.25rem' }}>←</span>
          <span>Voltar</span>
        </button>

        {/* Tab */}
        <div style={{ marginBottom: '2rem' }}>
          <button style={{
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            color: 'white', border: 'none', padding: '0.875rem 2rem',
            borderRadius: '0.75rem 0.75rem 0 0', fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
          }}>
            Ações
          </button>
        </div>

        {/* Card Principal */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

          {/* Título e Botão Criar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#37474f', margin: 0 }}>Lista de ações</h2>
            <button
              onClick={() => router.push('/acoes/criar-acao')}
              style={{
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                color: 'white', border: 'none', padding: '0.875rem 1.75rem',
                borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(33,150,243,0.4)', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(33,150,243,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(33,150,243,0.4)'; }}
            >
              Criar nova ação
            </button>
          </div>

          {/* Filtros */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#666' }}>
                <input
                  type="checkbox"
                  checked={mostrarFinalizadas}
                  onChange={(e) => setMostrarFinalizadas(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Exibir ações finalizadas
              </label>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {(['loja', 'data'] as const).map(ord => (
                  <button
                    key={ord}
                    onClick={() => setOrdenacao(ord)}
                    style={{
                      background: 'transparent', border: 'none',
                      color: ordenacao === ord ? '#2196F3' : '#666',
                      fontSize: '0.875rem', fontWeight: ordenacao === ord ? '700' : '500',
                      cursor: 'pointer', textDecoration: ordenacao === ord ? 'underline' : 'none'
                    }}
                  >
                    {ord === 'loja' ? 'Empresa' : 'Data de criação'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>De</label>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>Até</label>
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>
              <select
                value={filtros.empresa}
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <option value="todas">Todas as empresas</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                ))}
              </select>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <option value="todas">Todos os status</option>
                <option value="aguardando">Aguardando</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </div>
          </div>

          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {acoesFiltradas.map((acao) => {
              const statusStyle = getStatusColor(acao.status);
              const prioridadeCor = getPrioridadeColor(acao.prioridade);

              return (
                <div
                  key={acao.id}
                  style={{
                    border: '2px solid #e0e0e0', borderRadius: '0.75rem',
                    padding: '1.5rem', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2196F3'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(33,150,243,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Lado Esquerdo */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {acao.urgente && (
                          <span style={{
                            background: '#FFEBEE', color: '#C62828', border: '2px solid #E57373',
                            borderRadius: '1rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: '700'
                          }}>
                            🔴 URGENTE
                          </span>
                        )}
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: 0 }}>
                          {acao.titulo}
                        </h3>
                        <div
                          style={{ width: '12px', height: '12px', borderRadius: '50%', background: prioridadeCor, flexShrink: 0 }}
                          title={`Prioridade ${acao.prioridade}`}
                        />
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          background: statusStyle.bg, color: statusStyle.text,
                          border: `2px solid ${statusStyle.border}`,
                          borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700'
                        }}>
                          {getStatusTexto(acao.status)}
                        </span>
                      </div>

                      {acao.descricao && (
                        <p style={{ color: '#666', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>{acao.descricao}</p>
                      )}

                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Empresa</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', margin: 0 }}>
                            {acao.empresas?.nome_fantasia || '—'}
                          </p>
                        </div>
                        {acao.responsavel && (
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Responsável</p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', margin: 0 }}>{acao.responsavel}</p>
                          </div>
                        )}
                        {acao.categoria && (
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Categoria</p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', margin: 0 }}>{acao.categoria}</p>
                          </div>
                        )}
                      </div>

                      {/* Vínculo com checklist */}
                      {(acao.checklists_futuros || acao.checklist_futuro_itens) && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                          marginTop: '0.75rem', background: '#f0f7ff',
                          border: '1px solid #bbdefb', borderRadius: '0.5rem',
                          padding: '0.375rem 0.75rem', fontSize: '0.8rem', color: '#1565C0'
                        }}>
                          <span>📋</span>
                          <span>
                            {acao.checklists_futuros?.titulo}
                            {acao.checklist_futuro_itens && (
                              <span style={{ color: '#1976D2' }}> → {acao.checklist_futuro_itens.titulo}</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Lado Direito */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', minWidth: '150px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Criado em</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', margin: 0 }}>
                          {formatarData(acao.created_at)}
                        </p>
                      </div>
                      {acao.prazo && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Prazo</p>
                          <p style={{
                            fontSize: '0.875rem', fontWeight: '700',
                            color: acao.status === 'atrasada' ? '#ef5350' : '#333', margin: 0
                          }}>
                            {formatarData(acao.prazo)}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => excluirAcao(acao.id)}
                        style={{
                          background: '#FFEBEE', color: '#C62828', border: '2px solid #E57373',
                          borderRadius: '0.5rem', padding: '0.5rem 1rem',
                          fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#ef5350'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFEBEE'; e.currentTarget.style.color = '#C62828'; }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {acoesFiltradas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <p style={{ color: '#666', fontSize: '1rem', fontWeight: '600' }}>
                  {acoes.length === 0
                    ? 'Nenhuma ação cadastrada ainda. Clique em "Criar nova ação" para começar.'
                    : 'Nenhuma ação encontrada com os filtros selecionados.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
