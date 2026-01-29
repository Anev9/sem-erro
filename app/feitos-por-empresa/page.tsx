'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PreenchimentoEmpresa {
  id: number;
  nome: string;
  totalChecklists: number;
  preenchidos: number;
  pendentes: number;
  taxaPreenchimento: number;
  ultimoPreenchimento: string;
  tendencia: 'up' | 'down' | 'stable';
}

export default function RelatorioPreenchimentoEmpresas() {
  const router = useRouter();
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: '2026-01-23',
    dataFim: '2026-01-23',
    copiloto: 'todos',
    questionario: 'todos',
    tipoMentoria: 'todos',
    buscaEmpresa: ''
  });

  const copilotos = ['Todos os copilotos', 'João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira'];
  const questionarios = ['Todos os questionários', 'Inspeção de Segurança', 'Limpeza Diária', 'Controle de Qualidade', 'Manutenção Preventiva'];
  const tiposMentoria = ['Todos os tipos', 'Presencial', 'Remoto', 'Híbrido'];

  const empresas: PreenchimentoEmpresa[] = [
    { id: 1, nome: 'Loja Matriz', totalChecklists: 156, preenchidos: 148, pendentes: 8, taxaPreenchimento: 95, ultimoPreenchimento: '23/01/2026 18:30', tendencia: 'up' },
    { id: 2, nome: 'Loja Centro', totalChecklists: 142, preenchidos: 131, pendentes: 11, taxaPreenchimento: 92, ultimoPreenchimento: '23/01/2026 17:15', tendencia: 'stable' },
    { id: 3, nome: 'Loja Shopping', totalChecklists: 138, preenchidos: 122, pendentes: 16, taxaPreenchimento: 88, ultimoPreenchimento: '23/01/2026 16:45', tendencia: 'up' },
    { id: 4, nome: 'Loja Oeste', totalChecklists: 129, preenchidos: 110, pendentes: 19, taxaPreenchimento: 85, ultimoPreenchimento: '23/01/2026 15:20', tendencia: 'down' },
    { id: 5, nome: 'Depósito Norte', totalChecklists: 98, preenchidos: 79, pendentes: 19, taxaPreenchimento: 81, ultimoPreenchimento: '23/01/2026 14:00', tendencia: 'stable' },
    { id: 6, nome: 'Loja Sul', totalChecklists: 115, preenchidos: 89, pendentes: 26, taxaPreenchimento: 77, ultimoPreenchimento: '23/01/2026 12:30', tendencia: 'down' }
  ];

  const filtrarResultados = () => {
    setMostrarResultados(true);
  };

  const exportarRelatorio = () => {
    alert('Exportando relatório...');
  };

  const totalGeral = empresas.reduce((acc, e) => acc + e.totalChecklists, 0);
  const preenchidosGeral = empresas.reduce((acc, e) => acc + e.preenchidos, 0);
  const pendentesGeral = empresas.reduce((acc, e) => acc + e.pendentes, 0);
  const taxaMedia = Math.round((preenchidosGeral / totalGeral) * 100);

  const empresasFiltradas = empresas.filter(emp => 
    filtros.buscaEmpresa === '' || 
    emp.nome.toLowerCase().includes(filtros.buscaEmpresa.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        
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
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 0.5rem 0' }}>
              Relatório de Preenchimento de Empresas
            </h1>
            <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
              Acompanhe o preenchimento de checklists por cada empresa/loja
            </p>
          </div>

          <button
            onClick={exportarRelatorio}
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
            Exportar Relatório
          </button>
        </div>

        {/* Card de Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            {/* Período */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem' }}>📅</span> Período
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
                <span style={{ color: '#999', fontSize: '0.875rem', fontWeight: '600' }}>até</span>
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Copiloto */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>👤</span> Copiloto
              </label>
              <select
                value={filtros.copiloto}
                onChange={(e) => setFiltros({ ...filtros, copiloto: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {copilotos.map(cop => (
                  <option key={cop} value={cop.toLowerCase()}>{cop}</option>
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
                {questionarios.map(quest => (
                  <option key={quest} value={quest.toLowerCase()}>{quest}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Mentoria */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🎓</span> Tipo de mentoria
              </label>
              <select
                value={filtros.tipoMentoria}
                onChange={(e) => setFiltros({ ...filtros, tipoMentoria: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {tiposMentoria.map(tipo => (
                  <option key={tipo} value={tipo.toLowerCase()}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* Buscar Empresa */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🔍</span> Buscar empresa
              </label>
              <input
                type="text"
                placeholder="Digite para filtrar..."
                value={filtros.buscaEmpresa}
                onChange={(e) => setFiltros({ ...filtros, buscaEmpresa: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
              />
            </div>

            {/* Botão Filtrar */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={filtrarResultados}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.875rem',
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
                <span style={{ fontSize: '1rem' }}>✓</span>
                Filtrar Resultados
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {mostrarResultados ? (
          <>
            {/* Cards de Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(33,150,243,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Total de Checklists</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{totalGeral}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>no período</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(76,175,80,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Preenchidos</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{preenchidosGeral}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>{Math.round((preenchidosGeral/totalGeral)*100)}% completos</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(255,152,0,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Pendentes</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{pendentesGeral}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>{Math.round((pendentesGeral/totalGeral)*100)}% restantes</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(156,39,176,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Taxa Média</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{taxaMedia}%</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>de preenchimento</p>
              </div>
            </div>

            {/* Tabela de Empresas */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏢</span>
                Preenchimento por Empresa
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {empresasFiltradas.map((empresa, index) => {
                  const corBarra = empresa.taxaPreenchimento >= 90 ? '#4CAF50' : 
                                   empresa.taxaPreenchimento >= 80 ? '#2196F3' : 
                                   empresa.taxaPreenchimento >= 70 ? '#FF9800' : '#ef5350';

                  return (
                    <div key={empresa.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {/* Ranking */}
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                                      index === 1 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)' :
                                      index === 2 ? 'linear-gradient(135deg, #CD7F32, #B8860B)' : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                          fontWeight: '900',
                          color: 'white',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                          {index + 1}
                        </div>

                        {/* Informações */}
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: 0 }}>
                              {empresa.nome}
                            </h4>
                            {empresa.tendencia === 'up' && (
                              <span style={{ padding: '0.25rem 0.625rem', background: '#E8F5E9', color: '#2E7D32', fontSize: '0.75rem', fontWeight: '700', borderRadius: '0.375rem' }}>
                                ↑ Crescendo
                              </span>
                            )}
                            {empresa.tendencia === 'down' && (
                              <span style={{ padding: '0.25rem 0.625rem', background: '#FFEBEE', color: '#C62828', fontSize: '0.75rem', fontWeight: '700', borderRadius: '0.375rem' }}>
                                ↓ Atenção
                              </span>
                            )}
                            {empresa.tendencia === 'stable' && (
                              <span style={{ padding: '0.25rem 0.625rem', background: '#f5f5f5', color: '#666', fontSize: '0.75rem', fontWeight: '700', borderRadius: '0.375rem' }}>
                                ↔ Estável
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.25rem 0' }}>
                            {empresa.preenchidos} de {empresa.totalChecklists} checklists • {empresa.pendentes} pendentes
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>
                            Último preenchimento: {empresa.ultimoPreenchimento}
                          </p>
                        </div>

                        {/* Taxa */}
                        <div style={{ 
                          textAlign: 'center',
                          padding: '1rem 1.5rem',
                          background: empresa.taxaPreenchimento >= 90 ? '#E8F5E9' :
                                     empresa.taxaPreenchimento >= 80 ? '#E3F2FD' :
                                     empresa.taxaPreenchimento >= 70 ? '#FFF3E0' : '#FFEBEE',
                          borderRadius: '0.75rem',
                          minWidth: '120px'
                        }}>
                          <p style={{ fontSize: '2.5rem', fontWeight: '900', color: corBarra, margin: 0, lineHeight: 1 }}>
                            {empresa.taxaPreenchimento}%
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                            preenchido
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div style={{ width: '100%', height: '20px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${empresa.taxaPreenchimento}%`,
                          height: '100%',
                          background: corBarra,
                          borderRadius: '10px',
                          transition: 'width 1s ease',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '1rem'
                        }}>
                          <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>
                            {empresa.taxaPreenchimento >= 15 ? `${empresa.preenchidos}/${empresa.totalChecklists}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {empresasFiltradas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <p style={{ color: '#666', fontSize: '1rem', fontWeight: '600' }}>
                    Nenhuma empresa encontrada com os filtros aplicados.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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
                Configure os Filtros
              </h3>
              <p style={{ color: '#666', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
                Selecione o período e filtros desejados para visualizar o relatório de preenchimento das empresas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}