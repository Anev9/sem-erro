'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Colaborador {
  id: number;
  nome: string;
  cargo: string;
  departamento: string;
  avatar: string;
  totalRespostas: number;
  acertos: number;
  erros: number;
  performance: number;
  tendencia: 'up' | 'down' | 'stable';
  tempoMedio: string;
  evolucao: string;
  ultimaResposta: string;
  melhorArea: string;
  piorArea: string;
}

export default function PerformanceColaboradores() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('todos');
  const [expandido, setExpandido] = useState<number | null>(null);

  const colaboradores: Colaborador[] = [
    { id: 1, nome: 'Carla Mendes', cargo: 'Supervisor', departamento: 'Hortifruti', avatar: 'CM', totalRespostas: 47, acertos: 45, erros: 2, performance: 96, tendencia: 'up', tempoMedio: '1m 55s', evolucao: '+8%', ultimaResposta: '23/01/2026 16:00', melhorArea: 'Qualidade de Produtos', piorArea: 'Registro de Temperaturas' },
    { id: 2, nome: 'Maria Silva', cargo: 'Supervisor', departamento: 'Operações', avatar: 'MS', totalRespostas: 45, acertos: 42, erros: 3, performance: 93, tendencia: 'up', tempoMedio: '2m 30s', evolucao: '+5%', ultimaResposta: '23/01/2026 14:30', melhorArea: 'Higiene e Limpeza', piorArea: 'Estoque' },
    { id: 3, nome: 'Ana Costa', cargo: 'Assistente', departamento: 'Padaria', avatar: 'AC', totalRespostas: 52, acertos: 48, erros: 4, performance: 92, tendencia: 'stable', tempoMedio: '2m 10s', evolucao: '0%', ultimaResposta: '23/01/2026 15:45', melhorArea: 'Produção', piorArea: 'Limpeza de Equipamentos' },
    { id: 4, nome: 'Pedro Oliveira', cargo: 'Operador', departamento: 'Frios e Laticínios', avatar: 'PO', totalRespostas: 41, acertos: 35, erros: 6, performance: 85, tendencia: 'down', tempoMedio: '4m 05s', evolucao: '-2%', ultimaResposta: '22/01/2026 18:10', melhorArea: 'Atendimento', piorArea: 'Organização' },
    { id: 5, nome: 'João Santos', cargo: 'Operador', departamento: 'Açougue', avatar: 'JS', totalRespostas: 38, acertos: 32, erros: 6, performance: 84, tendencia: 'up', tempoMedio: '3m 15s', evolucao: '+3%', ultimaResposta: '23/01/2026 11:20', melhorArea: 'Manipulação de Carnes', piorArea: 'Documentação' },
    { id: 6, nome: 'Lucas Ferreira', cargo: 'Assistente', departamento: 'Caixa', avatar: 'LF', totalRespostas: 35, acertos: 28, erros: 7, performance: 80, tendencia: 'stable', tempoMedio: '3m 40s', evolucao: '+1%', ultimaResposta: '23/01/2026 13:25', melhorArea: 'Procedimentos de Caixa', piorArea: 'Segurança' }
  ];

  const cargosUnicos = ['todos', ...new Set(colaboradores.map(c => c.cargo))];
  const filtrados = colaboradores.filter(c => 
    (busca === '' || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cargo.toLowerCase().includes(busca.toLowerCase())) &&
    (cargoFiltro === 'todos' || c.cargo === cargoFiltro)
  ).sort((a, b) => b.performance - a.performance);

  const stats = {
    total: colaboradores.length,
    media: Math.round(colaboradores.reduce((acc, c) => acc + c.performance, 0) / colaboradores.length),
    respostas: colaboradores.reduce((acc, c) => acc + c.totalRespostas, 0),
    taxa: Math.round((colaboradores.reduce((acc, c) => acc + c.acertos, 0) / colaboradores.reduce((acc, c) => acc + c.totalRespostas, 0)) * 100),
    melhor: Math.max(...colaboradores.map(c => c.performance)),
    excelentes: colaboradores.filter(c => c.performance >= 90).length,
  };

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
            color: '#2196F3',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.borderColor = '#2196F3';
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
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.5rem' }}>📊 Performance de Colaboradores</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Acompanhe o desempenho da sua equipe em tempo real</p>

        {/* Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou cargo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', marginBottom: '1rem' }}
          />
          <select value={cargoFiltro} onChange={(e) => setCargoFiltro(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem' }}>
            {cargosUnicos.map(cargo => <option key={cargo} value={cargo}>{cargo === 'todos' ? 'Todos os Cargos' : cargo}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #2196F3, #1976D2)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
            <div style={{ fontSize: '2rem' }}>👥</div>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0' }}>Total de Colaboradores</p>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{stats.total}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #4CAF50, #388E3C)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
            <div style={{ fontSize: '2rem' }}>📈</div>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0' }}>Média Geral</p>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{stats.media}%</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
            <div style={{ fontSize: '2rem' }}>📊</div>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0' }}>Total de Respostas</p>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{stats.respostas}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #FF9800, #F57C00)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
            <div style={{ fontSize: '2rem' }}>🎯</div>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0' }}>Taxa de Acerto</p>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{stats.taxa}%</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
            <div style={{ fontSize: '2rem' }}>🏆</div>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0' }}>Melhor Performance</p>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{stats.melhor}%</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #FFC107, #FFA000)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
            <div style={{ fontSize: '2rem' }}>✨</div>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0' }}>Excelentes (≥90%)</p>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{stats.excelentes}</p>
          </div>
        </div>

        {/* Ranking */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>🏆 Ranking de Performance</h2>

        {/* Lista */}
        {filtrados.map((c, i) => {
          const badges = ['linear-gradient(135deg, #FFD700, #FFA500)', 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', 'linear-gradient(135deg, #CD7F32, #B8860B)', 'linear-gradient(135deg, #E0E0E0, #BDBDBD)'];
          const badge = i < 3 ? badges[i] : badges[3];
          const badgeText = i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
          const perfColor = c.performance >= 90 ? '#4CAF50' : c.performance >= 75 ? '#2196F3' : '#FF9800';
          const perfBg = c.performance >= 90 ? '#E8F5E9' : c.performance >= 75 ? '#E3F2FD' : '#FFF3E0';

          return (
            <div key={c.id} style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ width: '60px', height: '60px', background: badge, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white', fontWeight: '700' }}>{badgeText}</div>
                <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #2196F3, #1976D2)', borderRadius: '0.75rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '700' }}>{c.avatar}</div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>{c.nome}</h3>
                  <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>{c.cargo} • {c.departamento}</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}><p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Respostas</p><p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{c.totalRespostas}</p></div>
                  <div style={{ textAlign: 'center' }}><p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Acertos</p><p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4CAF50', margin: 0 }}>✓ {c.acertos}</p></div>
                  <div style={{ textAlign: 'center' }}><p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Erros</p><p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F44336', margin: 0 }}>✗ {c.erros}</p></div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: perfBg, borderRadius: '0.75rem' }}>
                  <p style={{ fontSize: '3rem', fontWeight: '900', color: perfColor, margin: 0, lineHeight: 1 }}>{c.performance}%</p>
                  <p style={{ fontSize: '0.75rem', fontWeight: '600', color: c.evolucao.startsWith('+') ? '#2E7D32' : '#C62828', margin: '0.25rem 0 0 0' }}>{c.evolucao}</p>
                </div>
                <button onClick={() => setExpandido(expandido === c.id ? null : c.id)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>{expandido === c.id ? '⌃' : '⌄'}</button>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}><span>Taxa de Aproveitamento</span><span>{c.performance}%</span></div>
                <div style={{ width: '100%', height: '12px', background: '#E0E0E0', borderRadius: '6px' }}><div style={{ width: `${c.performance}%`, height: '100%', background: perfColor, borderRadius: '6px', transition: 'width 1s' }} /></div>
              </div>
              {expandido === c.id && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '2px solid #f0f0f0' }}>
                  <div style={{ background: '#f5f5f5', borderRadius: '0.75rem', padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>📊 Análise Detalhada</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.75rem', border: '2px solid #4CAF50' }}><p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>✓ Melhor Área</p><p style={{ fontSize: '1rem', fontWeight: '700', color: '#2E7D32', margin: 0 }}>{c.melhorArea}</p></div>
                      <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.75rem', border: '2px solid #FF9800' }}><p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>⚠ Precisa Melhorar</p><p style={{ fontSize: '1rem', fontWeight: '700', color: '#E65100', margin: 0 }}>{c.piorArea}</p></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}