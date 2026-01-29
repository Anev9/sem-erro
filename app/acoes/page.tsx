'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Acao {
  id: number;
  titulo: string;
  descricao: string;
  loja: string;
  dataCriacao: string;
  prazo: string;
  responsavel: string;
  status: 'aguardando' | 'em_andamento' | 'concluida' | 'atrasada';
  prioridade: 'baixa' | 'media' | 'alta';
  categoria: string;
}

export default function ListaAcoes() {
  const router = useRouter();
  const [mostrarFinalizadas, setMostrarFinalizadas] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: '2025-12-20',
    dataFim: '2026-01-19',
    empresa: 'todas',
    status: 'aguardando'
  });
  const [ordenacao, setOrdenacao] = useState<'loja' | 'data'>('data');

  const empresas = ['Todas empresas', 'Loja Centro', 'Loja Shopping', 'Loja Matriz', 'Depósito Norte'];
  const statusOptions = [
    'Aguardando atendimento',
    'Em andamento',
    'Concluída',
    'Atrasada'
  ];

  const acoes: Acao[] = [
    {
      id: 1,
      titulo: 'Verificar extintores vencidos',
      descricao: 'Extintores do 2° andar com validade expirada',
      loja: 'Loja Centro',
      dataCriacao: '15/01/2026',
      prazo: '20/01/2026',
      responsavel: 'João Silva',
      status: 'aguardando',
      prioridade: 'alta',
      categoria: 'Segurança'
    },
    {
      id: 2,
      titulo: 'Limpeza profunda do depósito',
      descricao: 'Realizar limpeza completa e reorganização',
      loja: 'Depósito Norte',
      dataCriacao: '14/01/2026',
      prazo: '25/01/2026',
      responsavel: 'Maria Santos',
      status: 'em_andamento',
      prioridade: 'media',
      categoria: 'Limpeza'
    },
    {
      id: 3,
      titulo: 'Manutenção das câmaras frias',
      descricao: 'Câmara 3 apresentando temperatura irregular',
      loja: 'Loja Matriz',
      dataCriacao: '13/01/2026',
      prazo: '18/01/2026',
      responsavel: 'Pedro Costa',
      status: 'atrasada',
      prioridade: 'alta',
      categoria: 'Manutenção'
    },
    {
      id: 4,
      titulo: 'Treinamento equipe açougue',
      descricao: 'Capacitação sobre boas práticas',
      loja: 'Loja Shopping',
      dataCriacao: '12/01/2026',
      prazo: '30/01/2026',
      responsavel: 'Ana Oliveira',
      status: 'aguardando',
      prioridade: 'media',
      categoria: 'Treinamento'
    },
    {
      id: 5,
      titulo: 'Substituir lâmpadas queimadas',
      descricao: 'Setor de hortifruti com iluminação inadequada',
      loja: 'Loja Centro',
      dataCriacao: '10/01/2026',
      prazo: '15/01/2026',
      responsavel: 'Carlos Mendes',
      status: 'concluida',
      prioridade: 'baixa',
      categoria: 'Manutenção'
    }
  ];

  const acoesFiltradas = acoes
    .filter(acao => {
      if (!mostrarFinalizadas && acao.status === 'concluida') return false;
      if (filtros.empresa !== 'todas' && acao.loja !== filtros.empresa) return false;
      if (filtros.status !== 'todas' && !acao.status.includes(filtros.status.split(' ')[0].toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (ordenacao === 'loja') return a.loja.localeCompare(b.loja);
      return new Date(b.dataCriacao.split('/').reverse().join('-')).getTime() - 
             new Date(a.dataCriacao.split('/').reverse().join('-')).getTime();
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
    const cores = {
      baixa: '#4CAF50',
      media: '#FF9800',
      alta: '#ef5350'
    };
    return cores[prioridade as keyof typeof cores];
  };

  const getStatusTexto = (status: string) => {
    const textos = {
      aguardando: 'Aguardando',
      em_andamento: 'Em Andamento',
      concluida: 'Concluída',
      atrasada: 'Atrasada'
    };
    return textos[status as keyof typeof textos];
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Header do Sistema */}
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
            width: '45px', 
            height: '45px', 
            background: 'white', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.5rem' }}>✓</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
            SEM ERRO
          </h1>
        </div>
        
        <nav style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto' }}>
          {['Ações', 'Checklist', 'Organização', 'Relatórios', 'Sistema'].map(item => (
            <button
              key={item}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '0.5rem 0'
              }}
            >
              {item} <span style={{ fontSize: '0.75rem' }}>▼</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* Botão Voltar */}
        <button
          onClick={() => router.push('/dashboard-admin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'white',
            border: '2px solid #e0e0e0',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#37474f',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.borderColor = '#37474f';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#e0e0e0';
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>←</span>
          <span>Voltar</span>
        </button>

        {/* Tab Ações */}
        <div style={{ marginBottom: '2rem' }}>
          <button style={{
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            color: 'white',
            border: 'none',
            padding: '0.875rem 2rem',
            borderRadius: '0.75rem 0.75rem 0 0',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 -2px 8px rgba(33,150,243,0.2)'
          }}>
            Ações
          </button>
        </div>

        {/* Card Principal */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          
          {/* Título e Botão */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#37474f', margin: 0 }}>
              Lista de ações
            </h2>
            <button 
              onClick={() => router.push('/acoes/criar-acao')}
              style={{
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.875rem 1.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(33,150,243,0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(33,150,243,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(33,150,243,0.4)';
              }}
            >
              Criar nova ação
            </button>
          </div>

          {/* Filtros */}
          <div style={{ marginBottom: '2rem' }}>
            {/* Checkbox e Ordenação */}
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
                <button
                  onClick={() => setOrdenacao('loja')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: ordenacao === 'loja' ? '#2196F3' : '#666',
                    fontSize: '0.875rem',
                    fontWeight: ordenacao === 'loja' ? '700' : '500',
                    cursor: 'pointer',
                    textDecoration: ordenacao === 'loja' ? 'underline' : 'none'
                  }}
                >
                  Loja
                </button>
                <button
                  onClick={() => setOrdenacao('data')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: ordenacao === 'data' ? '#2196F3' : '#666',
                    fontSize: '0.875rem',
                    fontWeight: ordenacao === 'data' ? '700' : '500',
                    cursor: 'pointer',
                    textDecoration: ordenacao === 'data' ? 'underline' : 'none'
                  }}
                >
                  Data de criação
                </button>
              </div>
            </div>

            {/* Campos de Filtro */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr 1.5fr 1.5fr auto', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>De</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />

              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>Até</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />

              <select
                value={filtros.empresa}
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {empresas.map(emp => (
                  <option key={emp} value={emp.toLowerCase().replace(' ', '_')}>{emp}</option>
                ))}
              </select>

              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status.toLowerCase()}>{status}</option>
                ))}
              </select>

              <button style={{
                background: '#607D8B',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#546E7A'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#607D8B'}
              >
                Filtrar
              </button>
            </div>
          </div>

          {/* Lista de Ações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {acoesFiltradas.map((acao) => {
              const statusStyle = getStatusColor(acao.status);
              const prioridadeCor = getPrioridadeColor(acao.prioridade);

              return (
                <div
                  key={acao.id}
                  style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2196F3';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(33,150,243,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Lado Esquerdo */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: 0 }}>
                          {acao.titulo}
                        </h3>
                        
                        {/* Badge de Prioridade */}
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: prioridadeCor,
                          flexShrink: 0
                        }} />
                        
                        {/* Badge de Status */}
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `2px solid ${statusStyle.border}`,
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}>
                          {getStatusTexto(acao.status)}
                        </span>
                      </div>

                      <p style={{ color: '#666', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                        {acao.descricao}
                      </p>

                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Loja</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', margin: 0 }}>{acao.loja}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Responsável</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', margin: 0 }}>{acao.responsavel}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Categoria</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', margin: 0 }}>{acao.categoria}</p>
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito */}
                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Criado em</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', margin: 0 }}>{acao.dataCriacao}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Prazo</p>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '700', 
                          color: acao.status === 'atrasada' ? '#ef5350' : '#333',
                          margin: 0 
                        }}>
                          {acao.prazo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {acoesFiltradas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <p style={{ color: '#666', fontSize: '1rem', fontWeight: '600' }}>
                  Nenhuma ação encontrada com os filtros selecionados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}