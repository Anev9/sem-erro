'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Filtros {
  dataInicio: string;
  dataFim: string;
  empresa: string;
  departamento: string;
  questionario: string;
  tags: string[];
  incluirNaoRespondidas: boolean;
}

export default function AnaliseQualidade() {
  const router = useRouter();
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: '2026-01-03',
    dataFim: '2026-01-03',
    empresa: '',
    departamento: '',
    questionario: '',
    tags: [],
    incluirNaoRespondidas: false
  });

  const empresas = ['Loja Centro', 'Loja Shopping', 'Loja Matriz', 'Depósito Norte'];
  const departamentos = ['Hortifruti', 'Padaria', 'Açougue', 'Frios e Laticínios', 'Caixa'];
  const questionarios = ['Inspeção de Segurança', 'Limpeza Diária', 'Controle de Qualidade', 'Manutenção Preventiva'];
  const tagsDisponiveis = ['Segurança', 'Limpeza', 'Qualidade', 'Manutenção'];

  const toggleTag = (tag: string) => {
    setFiltros(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: '2026-01-03',
      dataFim: '2026-01-03',
      empresa: '',
      departamento: '',
      questionario: '',
      tags: [],
      incluirNaoRespondidas: false
    });
    setMostrarResultados(false);
  };

  const aplicarFiltros = () => {
    setMostrarResultados(true);
  };

  const exportarCSV = () => {
    alert('Exportando dados para CSV...');
  };

  // Dados fictícios para exibição
  const indicadores = {
    taxaConformidade: 87,
    totalRespostas: 156,
    conformes: 136,
    naoConformes: 20,
    mediaTempoResposta: '2m 15s',
    perguntasPendentes: 8
  };

  const dadosPorTag = [
    { tag: 'Segurança', conforme: 45, naoConforme: 5, taxa: 90, cor: '#ef5350' },
    { tag: 'Limpeza', conforme: 38, naoConforme: 7, taxa: 84, cor: '#2196F3' },
    { tag: 'Qualidade', conforme: 42, naoConforme: 3, taxa: 93, cor: '#4CAF50' },
    { tag: 'Manutenção', conforme: 11, naoConforme: 5, taxa: 69, cor: '#FFC107' }
  ];

  const evolucaoSemanal = [
    { dia: 'Seg', taxa: 82 },
    { dia: 'Ter', taxa: 85 },
    { dia: 'Qua', taxa: 88 },
    { dia: 'Qui', taxa: 91 },
    { dia: 'Sex', taxa: 87 },
    { dia: 'Sáb', taxa: 84 },
    { dia: 'Dom', taxa: 86 }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Botão Voltar */}
        <button
          onClick={() => router.back()}
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
            color: '#5E6AD2',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.borderColor = '#5E6AD2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#e0e0e0';
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>←</span>
          <span>Voltar</span>
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(94,106,210,0.3)' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
                Análise de Qualidade
              </h1>
            </div>
            <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
              Acompanhamento e análise de indicadores de desempenho
            </p>
          </div>

          <button
            onClick={exportarCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.875rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(76,175,80,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76,175,80,0.4)';
            }}
          >
            <span style={{ fontSize: '1rem' }}>📥</span>
            Exportar CSV
          </button>
        </div>

        {/* Card de Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Período */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem' }}>📅</span> Período de Análise
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                />
                <span style={{ color: '#999', fontWeight: '600' }}>→</span>
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Empresa */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🏢</span> Empresa
              </label>
              <select
                value={filtros.empresa}
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <option value="">Selecione a empresa</option>
                {empresas.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            {/* Departamento */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🏬</span> Departamento
              </label>
              <select
                value={filtros.departamento}
                onChange={(e) => setFiltros({ ...filtros, departamento: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <option value="">Selecione o departamento</option>
                {departamentos.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            {/* Questionário */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>📋</span> Questionário
              </label>
              <select
                value={filtros.questionario}
                onChange={(e) => setFiltros({ ...filtros, questionario: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <option value="">Selecione o questionário</option>
                {questionarios.map(quest => (
                  <option key={quest} value={quest}>{quest}</option>
                ))}
              </select>
            </div>

            {/* Tags de Classificação */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem' }}>🏷️</span> Tags de Classificação
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {tagsDisponiveis.map(tag => (
                  <label
                    key={tag}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: filtros.tags.includes(tag) ? '#E3F2FD' : '#f8f9fa',
                      border: `2px solid ${filtros.tags.includes(tag) ? '#5E6AD2' : '#e0e0e0'}`,
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filtros.tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            {/* Incluir não respondidas */}
            <div style={{ gridColumn: 'span 2' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: filtros.incluirNaoRespondidas ? '#FFF3E0' : '#f8f9fa',
                  border: `2px solid ${filtros.incluirNaoRespondidas ? '#FF9800' : '#e0e0e0'}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={filtros.incluirNaoRespondidas}
                  onChange={(e) => setFiltros({ ...filtros, incluirNaoRespondidas: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>
                    Incluir perguntas não respondidas
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                    Exibir também itens com prazo expirado
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '2px solid #f0f0f0' }}>
            <button
              onClick={aplicarFiltros}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '1rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(94,106,210,0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(94,106,210,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(94,106,210,0.4)';
              }}
            >
              <span style={{ fontSize: '1rem' }}>✓</span>
              Aplicar Filtros
            </button>

            <button
              onClick={limparFiltros}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'white',
                color: '#666',
                border: '2px solid #e0e0e0',
                borderRadius: '0.75rem',
                padding: '1rem 2rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.borderColor = '#999';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              <span style={{ fontSize: '1rem' }}>🔄</span>
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Resultados */}
        {mostrarResultados ? (
          <>
            {/* Cards de Indicadores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white', boxShadow: '0 4px 12px rgba(94,106,210,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: '0 0 0.5rem 0' }}>Taxa de Conformidade</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: 0 }}>{indicadores.taxaConformidade}%</p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.5rem 0' }}>Total de Respostas</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#333', margin: 0 }}>{indicadores.totalRespostas}</p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
                <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.5rem 0' }}>Conformes</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#4CAF50', margin: 0 }}>{indicadores.conformes}</p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✗</div>
                <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.5rem 0' }}>Não Conformes</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ef5350', margin: 0 }}>{indicadores.naoConformes}</p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
                <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.5rem 0' }}>Tempo Médio</p>
                <p style={{ fontSize: '1.75rem', fontWeight: '900', color: '#333', margin: 0 }}>{indicadores.mediaTempoResposta}</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white', boxShadow: '0 4px 12px rgba(255,152,0,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: '0 0 0.5rem 0' }}>Pendentes</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{indicadores.perguntasPendentes}</p>
              </div>
            </div>

            {/* Análise por TAG */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '1.5rem' }}>
                📊 Análise por Categoria
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {dadosPorTag.map((dado) => {
                  const total = dado.conforme + dado.naoConforme;
                  return (
                    <div key={dado.tag}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: dado.cor }} />
                          <span style={{ fontWeight: '700', fontSize: '1rem', color: '#333' }}>{dado.tag}</span>
                          <span style={{ fontSize: '0.875rem', color: '#666' }}>
                            ({dado.conforme + dado.naoConforme} respostas)
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: '#4CAF50', fontWeight: '600' }}>
                            ✓ {dado.conforme}
                          </span>
                          <span style={{ fontSize: '0.875rem', color: '#ef5350', fontWeight: '600' }}>
                            ✗ {dado.naoConforme}
                          </span>
                          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: dado.cor, minWidth: '80px', textAlign: 'right' }}>
                            {dado.taxa}%
                          </span>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '20px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${dado.taxa}%`, 
                          height: '100%', 
                          background: dado.cor,
                          borderRadius: '10px',
                          transition: 'width 1s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evolução Semanal */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '1.5rem' }}>
                📈 Evolução da Taxa de Conformidade (Última Semana)
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '250px', gap: '0.5rem' }}>
                {evolucaoSemanal.map((dado) => {
                  const altura = (dado.taxa / 100) * 200;
                  const cor = dado.taxa >= 85 ? '#4CAF50' : dado.taxa >= 70 ? '#FF9800' : '#ef5350';
                  return (
                    <div key={dado.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '100%', 
                        height: `${altura}px`,
                        background: `linear-gradient(180deg, ${cor} 0%, ${cor}CC 100%)`,
                        borderRadius: '0.5rem 0.5rem 0 0',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '0.5rem'
                      }}>
                        <span style={{ color: 'white', fontWeight: '700', fontSize: '0.875rem' }}>
                          {dado.taxa}%
                        </span>
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#666' }}>
                        {dado.dia}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 2rem',
                border: '4px solid #90CAF9'
              }}>
                <span style={{ fontSize: '4rem' }}>📊</span>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#333', marginBottom: '1rem' }}>
                Configure os Filtros de Análise
              </h3>
              <p style={{ color: '#666', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
                Selecione o período, empresa, departamento e outros filtros para visualizar os indicadores de qualidade e desempenho.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}