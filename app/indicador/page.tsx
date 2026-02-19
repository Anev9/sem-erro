'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DadoDia {
  dia: number;
  realizado: number;
  meta: number;
}

interface Empresa {
  id: number;
  nome: string;
  taxa: number;
  tendencia: 'estavel' | 'subindo';
  variacao: string;
}

export default function DashboardIndicadores() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState('30');
  const [empresa, setEmpresa] = useState('todas');
  const [tipoGrafico, setTipoGrafico] = useState('linha');
  const [mostrarLegendas, setMostrarLegendas] = useState(true);

  // Dados do gráfico (30 dias)
  const dadosGrafico: DadoDia[] = Array.from({ length: 30 }, (_, i) => ({
    dia: i + 1,
    realizado: Math.floor(Math.random() * 15) + 40, // Entre 40 e 55
    meta: 50
  }));

  const totalChecklists = dadosGrafico.reduce((acc, d) => acc + d.realizado, 0);
  const mediaChecklists = Math.round(totalChecklists / dadosGrafico.length);
  const melhorDia = Math.max(...dadosGrafico.map(d => d.realizado));
  const piorDia = Math.min(...dadosGrafico.map(d => d.realizado));

  const empresas: Empresa[] = [
    { id: 1, nome: 'Loja Matriz', taxa: 95.0, tendencia: 'estavel', variacao: '' },
    { id: 2, nome: 'Loja Centro', taxa: 92.0, tendencia: 'subindo', variacao: '+5.2%' },
    { id: 3, nome: 'Loja Oeste', taxa: 91.0, tendencia: 'subindo', variacao: '+6.1%' },
    { id: 4, nome: 'Loja Shopping', taxa: 87.0, tendencia: 'subindo', variacao: '+2.9%' }
  ];

  const mediaEmpresas = (empresas.reduce((acc, e) => acc + e.taxa, 0) / empresas.length).toFixed(1);

  const exportar = () => {
    alert('Exportando relatório...');
  };

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
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(94,106,210,0.3)' }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
              Dashboard de Indicadores
            </h1>
          </div>
          <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
            Acompanhamento de checklists e performance das empresas
          </p>
        </div>

        {/* Filtros e Ações */}
        <div style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          marginBottom: '2rem', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Período */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>⏱️</span>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>Período:</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
              </select>
            </div>

            {/* Empresa */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>🏢</span>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>Empresa:</label>
              <select
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="todas">Todas as empresas</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Gráfico */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>📈</span>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>Tipo:</label>
              <select
                value={tipoGrafico}
                onChange={(e) => setTipoGrafico(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="linha">Gráfico de Linha</option>
                <option value="barra">Gráfico de Barras</option>
                <option value="area">Gráfico de Área</option>
              </select>
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setMostrarLegendas(!mostrarLegendas)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#666',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <span style={{ fontSize: '1rem' }}>👁️</span>
              Legendas
            </button>

            <button
              onClick={exportar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                color: 'white',
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
              <span style={{ fontSize: '1rem' }}>📥</span>
              Exportar
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(33,150,243,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Total</p>
            <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{totalChecklists}</p>
            <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>Checklists em {periodo} dias</p>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(76,175,80,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Média</p>
            <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{mediaChecklists}</p>
            <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>Checklists por dia</p>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(156,39,176,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Melhor</p>
            <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{melhorDia}</p>
            <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>Melhor dia</p>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(255,152,0,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Performance</p>
            <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{mediaEmpresas}%</p>
            <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>Média das empresas</p>
          </div>
        </div>

        {/* Gráfico */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', margin: 0 }}>
                Checklists dos Últimos {periodo} Dias
              </h3>
            </div>
            
            {mostrarLegendas && (
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2196F3' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>Realizado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '2px', background: '#ef5350', borderRadius: '1px' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>Meta</span>
                </div>
              </div>
            )}
          </div>

          {/* Área do Gráfico */}
          <div style={{ position: 'relative', height: '350px', borderLeft: '2px solid #e0e0e0', borderBottom: '2px solid #e0e0e0', paddingLeft: '1rem', paddingBottom: '2rem' }}>
            {/* Linha da Meta */}
            <div style={{ 
              position: 'absolute', 
              top: `${100 - (50 / 60) * 100}%`,
              left: 0, 
              right: 0, 
              height: '2px', 
              background: '#ef5350',
              opacity: 0.5,
              borderTop: '2px dashed #ef5350'
            }} />

            {/* Pontos do gráfico */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
              {/* Linha conectando os pontos */}
              <polyline
                points={dadosGrafico.map((d, i) => {
                  const x = (i / (dadosGrafico.length - 1)) * 95;
                  const y = 100 - ((d.realizado / 60) * 85);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#2196F3"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(33,150,243,0.3))' }}
              />

              {/* Pontos */}
              {dadosGrafico.map((dado, index) => {
                const x = (index / (dadosGrafico.length - 1)) * 95;
                const y = 100 - ((dado.realizado / 60) * 85);
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="2"
                    fill="#2196F3"
                    vectorEffect="non-scaling-stroke"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(33,150,243,0.5))',
                      cursor: 'pointer'
                    }}
                  />
                );
              })}
            </svg>

            {/* Labels do eixo X */}
            <div style={{ position: 'absolute', bottom: '-2rem', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', paddingRight: '5%' }}>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Dia 1</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Dia 6</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Dia 11</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Dia 16</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Dia 21</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Dia 26</span>
            </div>

            {/* Labels do eixo Y */}
            <div style={{ position: 'absolute', left: '-3rem', top: 0, bottom: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>60</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>45</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>34</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>22</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>11</span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>0</span>
            </div>
          </div>

          {/* Estatísticas do Gráfico */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '3rem', 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid #f0f0f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Melhor Dia</p>
              <p style={{ fontSize: '2rem', fontWeight: '900', color: '#4CAF50', margin: 0 }}>{melhorDia}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Média</p>
              <p style={{ fontSize: '2rem', fontWeight: '900', color: '#2196F3', margin: 0 }}>{mediaChecklists}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Pior Dia</p>
              <p style={{ fontSize: '2rem', fontWeight: '900', color: '#FF9800', margin: 0 }}>{piorDia}</p>
            </div>
          </div>
        </div>

        {/* Performance das Empresas */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', margin: 0 }}>
                Performance das Empresas
              </h3>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>Taxa de Sucesso</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {empresas.map((empresa, index) => {
              const corBarra = empresa.taxa >= 90 ? '#4CAF50' : empresa.taxa >= 85 ? '#2196F3' : '#FF9800';
              const corTexto = empresa.taxa >= 90 ? '#2E7D32' : empresa.taxa >= 85 ? '#1565C0' : '#E65100';
              
              return (
                <div key={empresa.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    {/* Ranking */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 
                                  index === 1 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)' :
                                  index === 2 ? 'linear-gradient(135deg, #CD7F32, #B8860B)' :
                                  '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: '900',
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      {index + 1}
                    </div>

                    {/* Nome e Tendência */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#333' }}>
                          {empresa.nome}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: empresa.tendencia === 'estavel' ? '#666' : '#4CAF50', fontWeight: '600' }}>
                          {empresa.tendencia === 'estavel' ? '↔ Estável' : `↑ ${empresa.variacao}`}
                        </span>
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div style={{ width: '100%', height: '18px', background: '#f0f0f0', borderRadius: '9px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          width: `${empresa.taxa}%`,
                          height: '100%',
                          background: corBarra,
                          borderRadius: '9px',
                          transition: 'width 1s ease',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '0.75rem'
                        }}>
                          <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>
                            {empresa.taxa >= 30 ? `${empresa.taxa}%` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Taxa */}
                    <div style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: '900', 
                      color: corTexto,
                      minWidth: '100px',
                      textAlign: 'right'
                    }}>
                      {empresa.taxa}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}