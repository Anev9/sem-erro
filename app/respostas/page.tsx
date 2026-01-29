'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Filtros {
  empresa: string;
  dataInicio: string;
  dataFim: string;
  resultado: string;
  tag: string;
}

interface Empresa {
  id: number;
  nome: string;
}

interface TagType {
  id: number;
  nome: string;
  cor: string;
}

interface Resposta {
  id: number;
  empresa: string;
  checklist: string;
  pergunta: string;
  resposta: string;
  resultado: 'conforme' | 'nao_conforme';
  responsavel: string;
  data: string;
  tag: string;
  observacao: string;
}

export default function TodasRespostas() {
  const router = useRouter();
  const [filtros, setFiltros] = useState<Filtros>({
    empresa: '',
    dataInicio: '2026-01-23',
    dataFim: '2026-01-23',
    resultado: 'todos',
    tag: '',
  });
  
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [visualizacao, setVisualizacao] = useState<'lista' | 'resumo'>('lista');
  const [respostaSelecionada, setRespostaSelecionada] = useState<Resposta | null>(null);

  const empresas: Empresa[] = [
    { id: 1, nome: 'Loja Centro' },
    { id: 2, nome: 'Loja Shopping' },
    { id: 3, nome: 'Loja Matriz' },
    { id: 4, nome: 'Depósito Norte' }
  ];

  const tags: TagType[] = [
    { id: 1, nome: 'Segurança', cor: '#ef5350' },
    { id: 2, nome: 'Limpeza', cor: '#2196F3' },
    { id: 3, nome: 'Qualidade', cor: '#4CAF50' },
    { id: 4, nome: 'Manutenção', cor: '#FFC107' },
    { id: 5, nome: 'Operacional', cor: '#9C27B0' }
  ];

  const respostas: Resposta[] = [
    { id: 1, empresa: 'Loja Centro', checklist: 'Inspeção de Segurança', pergunta: 'Extintores estão dentro da validade?', resposta: 'Sim', resultado: 'conforme', responsavel: 'João Silva', data: '23/01/2026 09:15', tag: 'Segurança', observacao: '' },
    { id: 2, empresa: 'Loja Shopping', checklist: 'Limpeza Diária', pergunta: 'Banheiros foram higienizados?', resposta: 'Não', resultado: 'nao_conforme', responsavel: 'Maria Santos', data: '23/01/2026 10:30', tag: 'Limpeza', observacao: 'Falta de produto de limpeza' },
    { id: 3, empresa: 'Loja Matriz', checklist: 'Controle de Qualidade', pergunta: 'Temperatura dos equipamentos está adequada?', resposta: 'Sim', resultado: 'conforme', responsavel: 'Pedro Costa', data: '23/01/2026 11:45', tag: 'Qualidade', observacao: '' },
    { id: 4, empresa: 'Loja Centro', checklist: 'Manutenção Preventiva', pergunta: 'Equipamentos de refrigeração funcionando?', resposta: 'Parcialmente', resultado: 'nao_conforme', responsavel: 'Ana Oliveira', data: '23/01/2026 13:20', tag: 'Manutenção', observacao: 'Geladeira 3 apresentando ruído anormal' },
    { id: 5, empresa: 'Depósito Norte', checklist: 'Checklist Operacional', pergunta: 'Estoque organizado conforme layout?', resposta: 'Sim', resultado: 'conforme', responsavel: 'Carlos Mendes', data: '23/01/2026 14:00', tag: 'Operacional', observacao: '' },
    { id: 6, empresa: 'Loja Shopping', checklist: 'Inspeção de Segurança', pergunta: 'Saídas de emergência desobstruídas?', resposta: 'Não', resultado: 'nao_conforme', responsavel: 'João Silva', data: '23/01/2026 15:30', tag: 'Segurança', observacao: 'Caixas bloqueando porta de emergência' },
    { id: 7, empresa: 'Loja Matriz', checklist: 'Limpeza Diária', pergunta: 'Piso foi limpo e sinalizado?', resposta: 'Sim', resultado: 'conforme', responsavel: 'Maria Santos', data: '23/01/2026 16:15', tag: 'Limpeza', observacao: '' },
    { id: 8, empresa: 'Loja Centro', checklist: 'Controle de Qualidade', pergunta: 'Produtos vencidos foram removidos?', resposta: 'Sim', resultado: 'conforme', responsavel: 'Pedro Costa', data: '23/01/2026 17:00', tag: 'Qualidade', observacao: '' }
  ];

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarResultados(true);
  };

  const respostasFiltradas = respostas.filter(r => {
    if (filtros.empresa && r.empresa !== filtros.empresa) return false;
    if (filtros.resultado !== 'todos' && r.resultado !== filtros.resultado) return false;
    if (filtros.tag && r.tag !== filtros.tag) return false;
    return true;
  });

  const totalRespostas = respostasFiltradas.length;
  const conformes = respostasFiltradas.filter(r => r.resultado === 'conforme').length;
  const naoConformes = respostasFiltradas.filter(r => r.resultado === 'nao_conforme').length;
  const taxaConformidade = totalRespostas > 0 ? Math.round((conformes / totalRespostas) * 100) : 0;

  const getCorTag = (tagNome: string) => {
    const tag = tags.find(t => t.nome === tagNome);
    return tag?.cor || '#999';
  };

  const exportarExcel = () => {
    alert('Função de exportar para Excel será implementada!');
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
              <span style={{ fontSize: '1.5rem' }}>📋</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
              Todas as Respostas do Período
            </h1>
          </div>
          <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
            Visualize e analise todas as respostas de checklists em um único lugar
          </p>
        </div>

        {/* Card de Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleFiltrar}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              {/* Empresa */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>🏢</span> Loja / Empresa
                </label>
                <select
                  value={filtros.empresa}
                  onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  <option value="">Todas as empresas</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.nome}>{emp.nome}</option>
                  ))}
                </select>
              </div>

              {/* Data Início */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>📅</span> A partir de
                </label>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                />
              </div>

              {/* Data Fim */}
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

              {/* Resultado */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>🔍</span> Filtrar por resultado
                </label>
                <select
                  value={filtros.resultado}
                  onChange={(e) => setFiltros({ ...filtros, resultado: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  <option value="todos">Todos os resultados</option>
                  <option value="conforme">✓ Conforme</option>
                  <option value="nao_conforme">✗ Não Conforme</option>
                </select>
              </div>

              {/* TAG */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>🏷️</span> Selecione a TAG
                </label>
                <select
                  value={filtros.tag}
                  onChange={(e) => setFiltros({ ...filtros, tag: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  <option value="">Todas as TAGs</option>
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.nome}>{tag.nome}</option>
                  ))}
                </select>
              </div>

              {/* Botão Filtrar */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
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
                  <span style={{ fontSize: '1rem' }}>🔎</span>
                  Filtrar Respostas
                </button>
              </div>
            </div>

            {/* Dica */}
            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', border: '2px solid #90CAF9', borderRadius: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#1565C0', margin: 0, fontWeight: '500', lineHeight: 1.6 }}>
                💡 <strong>Dica:</strong> Nessa tela é possível ver todas as respostas de uma única vez de todas as empresas, assim você consegue ser mais preciso no que procura, como por exemplo apenas as áreas que estão com algum problema e que as respostas foram negativas.
              </p>
            </div>
          </form>
        </div>

        {mostrarResultados ? (
          <>
            {/* Cards de Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>Total de Respostas</span>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#5E6AD2', margin: '0 0 0.5rem 0' }}>{totalRespostas}</p>
                <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>no período selecionado</p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>Conformes</span>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#4CAF50', margin: '0 0 0.5rem 0' }}>{conformes}</p>
                <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>
                  {totalRespostas > 0 ? Math.round((conformes / totalRespostas) * 100) : 0}% do total
                </p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>Não Conformes</span>
                  <span style={{ fontSize: '1.5rem' }}>❌</span>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ef5350', margin: '0 0 0.5rem 0' }}>{naoConformes}</p>
                <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>
                  {totalRespostas > 0 ? Math.round((naoConformes / totalRespostas) * 100) : 0}% do total
                </p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>Taxa de Conformidade</span>
                  <span style={{ fontSize: '1.5rem' }}>📈</span>
                </div>
                <p style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '900', 
                  color: taxaConformidade >= 80 ? '#4CAF50' : taxaConformidade >= 60 ? '#FFC107' : '#ef5350',
                  margin: '0 0 0.5rem 0' 
                }}>
                  {taxaConformidade}%
                </p>
                <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>índice geral</p>
              </div>
            </div>

            {/* Ações e Visualização */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setVisualizacao('lista')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    border: visualizacao === 'lista' ? 'none' : '2px solid #e0e0e0',
                    background: visualizacao === 'lista' ? 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)' : 'white',
                    color: visualizacao === 'lista' ? 'white' : '#666',
                    transition: 'all 0.2s',
                    boxShadow: visualizacao === 'lista' ? '0 4px 8px rgba(94,106,210,0.3)' : 'none'
                  }}
                >
                  📋 Lista Detalhada
                </button>
                <button
                  onClick={() => setVisualizacao('resumo')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    border: visualizacao === 'resumo' ? 'none' : '2px solid #e0e0e0',
                    background: visualizacao === 'resumo' ? 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)' : 'white',
                    color: visualizacao === 'resumo' ? 'white' : '#666',
                    transition: 'all 0.2s',
                    boxShadow: visualizacao === 'resumo' ? '0 4px 8px rgba(94,106,210,0.3)' : 'none'
                  }}
                >
                  📊 Resumo Executivo
                </button>
              </div>

              <button
                onClick={exportarExcel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  border: '2px solid #4CAF50',
                  borderRadius: '0.75rem',
                  color: '#4CAF50',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4CAF50';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#4CAF50';
                }}
              >
                <span style={{ fontSize: '1rem' }}>📥</span>
                Exportar Excel
              </button>
            </div>

            {/* Lista de Respostas */}
            {visualizacao === 'lista' && (
              <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                      <tr>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#333', borderBottom: '2px solid #dee2e6' }}>Data/Hora</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#333', borderBottom: '2px solid #dee2e6' }}>Empresa</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#333', borderBottom: '2px solid #dee2e6' }}>Checklist</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#333', borderBottom: '2px solid #dee2e6' }}>Pergunta</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#333', borderBottom: '2px solid #dee2e6' }}>TAG</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#333', borderBottom: '2px solid #dee2e6' }}>Responsável</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '700', color: '#333', borderBottom: '2px solid #dee2e6' }}>Resultado</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '700', color: '#333', borderBottom: '2px solid #dee2e6' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {respostasFiltradas.map((resposta, idx) => (
                        <tr key={resposta.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666', whiteSpace: 'nowrap' }}>{resposta.data}</td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>{resposta.empresa}</td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>{resposta.checklist}</td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666', maxWidth: '300px' }}>{resposta.pergunta}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ 
                              padding: '0.375rem 0.75rem', 
                              borderRadius: '1rem', 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              background: getCorTag(resposta.tag) + '20',
                              color: getCorTag(resposta.tag),
                              border: `2px solid ${getCorTag(resposta.tag)}40`,
                              whiteSpace: 'nowrap'
                            }}>
                              {resposta.tag}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>{resposta.responsavel}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {resposta.resultado === 'conforme' ? (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.375rem',
                                padding: '0.5rem 1rem',
                                background: '#E8F5E9',
                                color: '#2E7D32',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                border: '2px solid #4CAF50'
                              }}>
                                ✓ Conforme
                              </span>
                            ) : (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.375rem',
                                padding: '0.5rem 1rem',
                                background: '#FFEBEE',
                                color: '#C62828',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                border: '2px solid #ef5350'
                              }}>
                                ✗ Não Conforme
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <button
                              onClick={() => setRespostaSelecionada(resposta)}
                              style={{
                                padding: '0.5rem',
                                background: '#E3F2FD',
                                border: '2px solid #90CAF9',
                                borderRadius: '0.5rem',
                                color: '#1565C0',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#5E6AD2';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = '#5E6AD2';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#E3F2FD';
                                e.currentTarget.style.color = '#1565C0';
                                e.currentTarget.style.borderColor = '#90CAF9';
                              }}
                            >
                              👁️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {respostasFiltradas.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                    <p style={{ color: '#666', fontSize: '1rem', fontWeight: '600' }}>
                      Nenhuma resposta encontrada com os filtros selecionados.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Resumo Executivo */}
            {visualizacao === 'resumo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {respostasFiltradas
                  .filter(r => r.resultado === 'nao_conforme')
                  .map((resposta) => (
                    <div key={resposta.id} style={{ 
                      background: 'white', 
                      borderRadius: '1rem', 
                      padding: '1.5rem',
                      borderLeft: '6px solid #ef5350',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', margin: 0 }}>{resposta.empresa}</h3>
                            <span style={{ 
                              padding: '0.375rem 0.75rem', 
                              borderRadius: '1rem', 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              background: getCorTag(resposta.tag) + '20',
                              color: getCorTag(resposta.tag),
                              border: `2px solid ${getCorTag(resposta.tag)}40`
                            }}>
                              {resposta.tag}
                            </span>
                          </div>
                          <p style={{ color: '#666', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>{resposta.checklist}</p>
                          <p style={{ color: '#999', margin: 0, fontSize: '0.75rem' }}>{resposta.data} • {resposta.responsavel}</p>
                        </div>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.625rem 1.25rem',
                          background: '#FFEBEE',
                          color: '#C62828',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          border: '2px solid #ef5350'
                        }}>
                          ✗ Não Conforme
                        </span>
                      </div>
                      
                      <div style={{ background: '#f8f9fa', borderRadius: '0.75rem', padding: '1.25rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#333', marginBottom: '0.5rem' }}>Pergunta:</p>
                        <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.875rem' }}>{resposta.pergunta}</p>
                        
                        {resposta.observacao && (
                          <>
                            <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#333', marginBottom: '0.5rem' }}>Observação:</p>
                            <p style={{ color: '#666', margin: 0, fontSize: '0.875rem' }}>{resposta.observacao}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                {respostasFiltradas.filter(r => r.resultado === 'nao_conforme').length === 0 && (
                  <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#333', marginBottom: '0.5rem' }}>
                      Tudo em conformidade!
                    </h3>
                    <p style={{ color: '#666', margin: 0 }}>
                      Não há itens não conformes no período selecionado.
                    </p>
                  </div>
                )}
              </div>
            )}
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
                <span style={{ fontSize: '4rem' }}>🔍</span>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#333', marginBottom: '1rem' }}>
                Configure os Filtros
              </h3>
              <p style={{ color: '#666', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
                Selecione os filtros desejados e clique em "Filtrar Respostas" para visualizar os dados.
              </p>
            </div>
          </div>
        )}

        {/* Modal de Detalhes */}
        {respostaSelecionada && (
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.6)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
            onClick={() => setRespostaSelecionada(null)}
          >
            <div 
              style={{ 
                background: 'white', 
                borderRadius: '1rem', 
                padding: '2rem', 
                maxWidth: '600px', 
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#333', margin: 0 }}>
                  Detalhes da Resposta
                </h3>
                <button
                  onClick={() => setRespostaSelecionada(null)}
                  style={{
                    background: '#f5f5f5',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    color: '#666'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>Empresa</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#333', margin: 0 }}>{respostaSelecionada.empresa}</p>
                </div>
                
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>Checklist</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#333', margin: 0 }}>{respostaSelecionada.checklist}</p>
                </div>

                <div>
                  <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>Pergunta</p>
                  <p style={{ fontSize: '1rem', color: '#333', margin: 0 }}>{respostaSelecionada.pergunta}</p>
                </div>

                <div>
                  <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>Resposta</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#333', margin: 0 }}>{respostaSelecionada.resposta}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>Data/Hora</p>
                    <p style={{ fontSize: '0.875rem', color: '#333', margin: 0 }}>{respostaSelecionada.data}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>Responsável</p>
                    <p style={{ fontSize: '0.875rem', color: '#333', margin: 0 }}>{respostaSelecionada.responsavel}</p>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem' }}>TAG</p>
                  <span style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    background: getCorTag(respostaSelecionada.tag) + '20',
                    color: getCorTag(respostaSelecionada.tag),
                    border: `2px solid ${getCorTag(respostaSelecionada.tag)}40`,
                    display: 'inline-block'
                  }}>
                    {respostaSelecionada.tag}
                  </span>
                </div>

                <div>
                  <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem' }}>Resultado</p>
                  {respostaSelecionada.resultado === 'conforme' ? (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      background: '#E8F5E9',
                      color: '#2E7D32',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      border: '2px solid #4CAF50'
                    }}>
                      ✓ Conforme
                    </span>
                  ) : (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      background: '#FFEBEE',
                      color: '#C62828',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      border: '2px solid #ef5350'
                    }}>
                      ✗ Não Conforme
                    </span>
                  )}
                </div>

                {respostaSelecionada.observacao && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>Observação</p>
                    <div style={{ background: '#f8f9fa', borderRadius: '0.5rem', padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#333', margin: 0 }}>{respostaSelecionada.observacao}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}