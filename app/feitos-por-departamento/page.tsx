'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PerformanceDepartamento {
  departamento: string;
  totalRespostas: number;
  conformes: number;
  naoConformes: number;
  taxa: number;
  tendencia: 'up' | 'down' | 'stable';
  evolucao: string;
}

export default function RelatorioPerformanceDepartamento() {
  const router = useRouter();
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: '2025-12-24',
    dataFim: '2026-01-23',
    empresa: 'todas',
    departamento: 'todos'
  });

  const empresas = ['Todas', 'Loja Centro', 'Loja Shopping', 'Loja Matriz', 'Depósito Norte'];
  const departamentos = ['Todos', 'Hortifruti', 'Padaria', 'Açougue', 'Frios e Laticínios', 'Caixa', 'Limpeza'];

  const dadosDepartamentos: PerformanceDepartamento[] = [
    { departamento: 'Hortifruti', totalRespostas: 245, conformes: 228, naoConformes: 17, taxa: 93, tendencia: 'up', evolucao: '+3.2%' },
    { departamento: 'Padaria', totalRespostas: 198, conformes: 180, naoConformes: 18, taxa: 91, tendencia: 'up', evolucao: '+2.1%' },
    { departamento: 'Açougue', totalRespostas: 167, conformes: 148, naoConformes: 19, taxa: 89, tendencia: 'stable', evolucao: '0%' },
    { departamento: 'Frios e Laticínios', totalRespostas: 152, conformes: 132, naoConformes: 20, taxa: 87, tendencia: 'down', evolucao: '-1.5%' },
    { departamento: 'Caixa', totalRespostas: 289, conformes: 246, naoConformes: 43, taxa: 85, tendencia: 'up', evolucao: '+4.3%' },
    { departamento: 'Limpeza', totalRespostas: 312, conformes: 256, naoConformes: 56, taxa: 82, tendencia: 'down', evolucao: '-2.8%' }
  ];

  const enviarAtualizar = () => {
    setMostrarResultados(true);
  };

  const totalGeral = dadosDepartamentos.reduce((acc, d) => acc + d.totalRespostas, 0);
  const conformesGeral = dadosDepartamentos.reduce((acc, d) => acc + d.conformes, 0);
  const naoConformesGeral = dadosDepartamentos.reduce((acc, d) => acc + d.naoConformes, 0);
  const taxaMedia = Math.round((conformesGeral / totalGeral) * 100);

  const melhorDepartamento = [...dadosDepartamentos].sort((a, b) => b.taxa - a.taxa)[0];
  const piorDepartamento = [...dadosDepartamentos].sort((a, b) => a.taxa - b.taxa)[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '2rem' }}>
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
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 0.5rem 0' }}>
            Relatório de Performance por Departamento
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
            Análise comparativa de desempenho entre departamentos
          </p>
        </div>

        {/* Card de Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            {/* De */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>📅</span> De
              </label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
              />
            </div>

            {/* Até */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>📅</span> Até
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
              />
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
                {empresas.map(emp => (
                  <option key={emp} value={emp.toLowerCase()}>{emp}</option>
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
                {departamentos.map(dep => (
                  <option key={dep} value={dep.toLowerCase()}>{dep}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botão Enviar */}
          <button
            onClick={enviarAtualizar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              maxWidth: '250px',
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
            Enviar / Atualizar
          </button>
        </div>

        {/* Resultados */}
        {mostrarResultados ? (
          <>
            {/* Cards de Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(33,150,243,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Total de Respostas</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{totalGeral}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>no período selecionado</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(76,175,80,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Conformes</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{conformesGeral}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>{Math.round((conformesGeral/totalGeral)*100)}% do total</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(239,83,80,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Não Conformes</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{naoConformesGeral}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>{Math.round((naoConformesGeral/totalGeral)*100)}% do total</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(156,39,176,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Taxa Média</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{taxaMedia}%</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>de conformidade geral</p>
              </div>
            </div>

            {/* Performance por Departamento */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏆</span>
                Ranking de Performance por Departamento
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {dadosDepartamentos.map((dept, index) => {
                  const corBarra = dept.taxa >= 90 ? '#4CAF50' : dept.taxa >= 85 ? '#2196F3' : '#FF9800';
                  const badges = [
                    'linear-gradient(135deg, #FFD700, #FFA500)',
                    'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
                    'linear-gradient(135deg, #CD7F32, #B8860B)',
                    '#e0e0e0'
                  ];
                  const badgeColor = index < 3 ? badges[index] : badges[3];

                  return (
                    <div key={dept.departamento}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {/* Badge Ranking */}
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: badgeColor,
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

                        {/* Nome e Info */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: 0 }}>
                              {dept.departamento}
                            </h4>
                            {dept.tendencia === 'up' && (
                              <span style={{ padding: '0.25rem 0.625rem', background: '#E8F5E9', color: '#2E7D32', fontSize: '0.75rem', fontWeight: '700', borderRadius: '0.375rem', border: '2px solid #4CAF50' }}>
                                ↑ {dept.evolucao}
                              </span>
                            )}
                            {dept.tendencia === 'down' && (
                              <span style={{ padding: '0.25rem 0.625rem', background: '#FFEBEE', color: '#C62828', fontSize: '0.75rem', fontWeight: '700', borderRadius: '0.375rem', border: '2px solid #ef5350' }}>
                                ↓ {dept.evolucao}
                              </span>
                            )}
                            {dept.tendencia === 'stable' && (
                              <span style={{ padding: '0.25rem 0.625rem', background: '#f5f5f5', color: '#666', fontSize: '0.75rem', fontWeight: '700', borderRadius: '0.375rem', border: '2px solid #e0e0e0' }}>
                                ↔ Estável
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                            {dept.totalRespostas} respostas • {dept.conformes} conformes • {dept.naoConformes} não conformes
                          </p>
                        </div>

                        {/* Taxa */}
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: corBarra, minWidth: '100px', textAlign: 'right' }}>
                          {dept.taxa}%
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div style={{ width: '100%', height: '20px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${dept.taxa}%`,
                          height: '100%',
                          background: corBarra,
                          borderRadius: '10px',
                          transition: 'width 1s ease',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '1rem'
                        }}>
                          <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>
                            {dept.taxa >= 20 ? `${dept.taxa}% de conformidade` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Análise Comparativa */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
              {/* Melhor Departamento */}
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '6px solid #4CAF50' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>🥇</span>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: 0 }}>
                    Melhor Performance
                  </h4>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4CAF50', margin: '0 0 0.5rem 0' }}>
                  {melhorDepartamento.departamento}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                  Taxa de conformidade: <strong>{melhorDepartamento.taxa}%</strong>
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                  Total de respostas: <strong>{melhorDepartamento.totalRespostas}</strong>
                </p>
              </div>

              {/* Pior Departamento */}
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '6px solid #FF9800' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>⚠️</span>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: 0 }}>
                    Precisa de Atenção
                  </h4>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FF9800', margin: '0 0 0.5rem 0' }}>
                  {piorDepartamento.departamento}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                  Taxa de conformidade: <strong>{piorDepartamento.taxa}%</strong>
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                  Não conformes: <strong>{piorDepartamento.naoConformes}</strong>
                </p>
              </div>
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
                Selecione o período, empresa e departamento desejados, depois clique em "Enviar / Atualizar" para visualizar o relatório comparativo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}