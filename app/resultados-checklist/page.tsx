'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Building2, ClipboardList, Download, Check, RotateCcw,
  GitCompare, TrendingUp, TrendingDown, Minus, Trophy, PieChart, BarChart3, LineChart, Search
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Empresa {
  id: string;
  nome_fantasia: string;
}

interface ChecklistItem {
  id: string;
  titulo: string;
}

interface Resposta {
  id: string;
  empresa: string;
  empresa_id: string | null;
  checklist: string;
  pergunta: string;
  resposta: string;
  resultado: string;
  responsavel: string;
  data: string;
  observacao: string;
}

interface Filtros {
  dataInicio: string;
  dataFim: string;
  empresa: string;
  questionario: string;
}

const CORES_CHECKLIST = ['#ff7a3d', '#8a6ff2', '#16b88a', '#fb5c66', '#f5a524', '#4c8bff'];
const inputClass = 'w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none cursor-pointer';
const labelClass = 'mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-muted';

export default function AnaliseQualidade() {
  const router = useRouter();
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [mostrarComparativo, setMostrarComparativo] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [respostasComp, setRespostasComp] = useState<Resposta[]>([]);
  const [filtrosComp, setFiltrosComp] = useState<Filtros>(() => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 60);
    const fim = new Date();
    fim.setDate(hoje.getDate() - 31);
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    return { dataInicio: toISO(inicio), dataFim: toISO(fim), empresa: '', questionario: '' };
  });

  const [filtros, setFiltros] = useState<Filtros>(() => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 30);
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    return { dataInicio: toISO(inicio), dataFim: toISO(hoje), empresa: '', questionario: '' };
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/login'); return; }
    const user = JSON.parse(userData);
    if (user.role !== 'aluno') { router.push('/login'); return; }
    const id = user.id || user.aluno_id;
    setAlunoId(id);
    carregarFiltros(id);
  }, [router]);

  async function carregarFiltros(id: string) {
    setLoadingFiltros(true);
    try {
      const [empRes, clRes] = await Promise.all([
        fetch(`/api/aluno/empresas?aluno_id=${id}`),
        fetch(`/api/aluno/checklists-criados?aluno_id=${id}`)
      ]);
      const empData = await empRes.json();
      const clData = await clRes.json();
      setEmpresas(empData || []);
      setChecklists(clData.checklists || []);
    } finally {
      setLoadingFiltros(false);
    }
  }

  async function aplicarFiltros() {
    if (!alunoId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ aluno_id: alunoId });
      if (filtros.empresa) params.set('empresa_id', filtros.empresa);
      if (filtros.dataInicio) params.set('data_inicio', filtros.dataInicio);
      if (filtros.dataFim) params.set('data_fim', filtros.dataFim);

      const res = await fetch(`/api/aluno/respostas?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();

      let lista: Resposta[] = data.respostas || [];

      if (filtros.questionario) {
        const titulo = checklists.find(c => c.id === filtros.questionario)?.titulo;
        if (titulo) lista = lista.filter(r => r.checklist === titulo);
      }

      setRespostas(lista);
      setMostrarResultados(true);
    } finally {
      setLoading(false);
    }
  }

  function limparFiltros() {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 30);
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    setFiltros({ dataInicio: toISO(inicio), dataFim: toISO(hoje), empresa: '', questionario: '' });
    setMostrarResultados(false);
    setRespostas([]);
  }

  async function buscarComparativo() {
    if (!alunoId) return;
    setLoadingComp(true);
    try {
      const params = new URLSearchParams({ aluno_id: alunoId });
      if (filtrosComp.empresa) params.set('empresa_id', filtrosComp.empresa);
      if (filtrosComp.dataInicio) params.set('data_inicio', filtrosComp.dataInicio);
      if (filtrosComp.dataFim) params.set('data_fim', filtrosComp.dataFim);
      const res = await fetch(`/api/aluno/respostas?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setRespostasComp(data.respostas || []);
    } finally {
      setLoadingComp(false);
    }
  }

  function exportarCSV() {
    if (respostas.length === 0) return;
    const headers = ['Empresa', 'Checklist', 'Pergunta', 'Resposta', 'Resultado', 'Responsável', 'Data', 'Observação'];
    const rows = respostas.map(r => [r.empresa, r.checklist, r.pergunta, r.resposta, r.resultado, r.responsavel, r.data, r.observacao]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analise-qualidade.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Métricas calculadas
  const total = respostas.length;
  const conformes = respostas.filter(r => r.resultado === 'conforme').length;
  const naoConformes = respostas.filter(r => r.resultado === 'nao_conforme').length;
  const validas = conformes + naoConformes;
  const taxaConformidade = validas > 0 ? Math.round((conformes / validas) * 100) : 0;

  // Ranking por empresa
  const porEmpresa: Record<string, { nome: string; conforme: number; naoConforme: number }> = {};
  for (const r of respostas) {
    const key = r.empresa_id || r.empresa;
    if (!porEmpresa[key]) porEmpresa[key] = { nome: r.empresa, conforme: 0, naoConforme: 0 };
    if (r.resultado === 'conforme') porEmpresa[key].conforme++;
    else if (r.resultado === 'nao_conforme') porEmpresa[key].naoConforme++;
  }
  const rankingEmpresas = Object.values(porEmpresa)
    .map(e => {
      const tot = e.conforme + e.naoConforme;
      const taxa = tot > 0 ? Math.round((e.conforme / tot) * 100) : 0;
      return { ...e, taxa, total: tot };
    })
    .filter(e => e.total > 0)
    .sort((a, b) => b.taxa - a.taxa);

  // Análise por checklist
  const porChecklist: Record<string, { conforme: number; naoConforme: number }> = {};
  for (const r of respostas) {
    if (!porChecklist[r.checklist]) porChecklist[r.checklist] = { conforme: 0, naoConforme: 0 };
    if (r.resultado === 'conforme') porChecklist[r.checklist].conforme++;
    else if (r.resultado === 'nao_conforme') porChecklist[r.checklist].naoConforme++;
  }
  const checklistAnalise = Object.entries(porChecklist).map(([titulo, counts], i) => {
    const tot = counts.conforme + counts.naoConforme;
    const taxa = tot > 0 ? Math.round((counts.conforme / tot) * 100) : 0;
    return { titulo, ...counts, taxa, cor: CORES_CHECKLIST[i % CORES_CHECKLIST.length] };
  }).sort((a, b) => b.taxa - a.taxa);

  // Evolução por data
  const porData: Record<string, { conforme: number; total: number }> = {};
  for (const r of respostas) {
    const dataPart = r.data.split(' ')[0]; // "dd/MM/yyyy"
    if (!porData[dataPart]) porData[dataPart] = { conforme: 0, total: 0 };
    if (r.resultado === 'conforme' || r.resultado === 'nao_conforme') {
      porData[dataPart].total++;
      if (r.resultado === 'conforme') porData[dataPart].conforme++;
    }
  }
  const evolucao = Object.entries(porData)
    .sort(([a], [b]) => {
      const [da, ma, ya] = a.split('/').map(Number);
      const [db, mb, yb] = b.split('/').map(Number);
      return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    })
    .map(([data, counts]) => ({
      dia: data.substring(0, 5),
      taxa: counts.total > 0 ? Math.round((counts.conforme / counts.total) * 100) : 0
    }))
    .slice(-14);

  // Métricas do período comparativo
  const totalComp = respostasComp.length;
  const conformesComp = respostasComp.filter(r => r.resultado === 'conforme').length;
  const naoConformesComp = respostasComp.filter(r => r.resultado === 'nao_conforme').length;
  const validasComp = conformesComp + naoConformesComp;
  const taxaComp = validasComp > 0 ? Math.round((conformesComp / validasComp) * 100) : 0;
  const delta = taxaConformidade - taxaComp;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 py-8">
        <PageHeader
          title="Análise de Qualidade"
          subtitle="Acompanhamento e análise de indicadores de desempenho"
          backHref="/dashboard-aluno"
          actions={
            <Button variant="secondary" onClick={exportarCSV} disabled={respostas.length === 0} icon={<Download size={16} />}>
              Exportar CSV
            </Button>
          }
        />

        {/* Card de Filtros */}
        <Card className="mb-6 p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className={labelClass}><Calendar size={15} /> Período de Análise</label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} className={inputClass} />
                <span className="font-semibold text-ink-faint">→</span>
                <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}><Building2 size={15} /> Empresa</label>
              <select value={filtros.empresa} onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })} disabled={loadingFiltros} className={inputClass}>
                <option value="">{loadingFiltros ? 'Carregando...' : 'Todas as empresas'}</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}><ClipboardList size={15} /> Questionário</label>
              <select value={filtros.questionario} onChange={(e) => setFiltros({ ...filtros, questionario: e.target.value })} disabled={loadingFiltros} className={inputClass}>
                <option value="">{loadingFiltros ? 'Carregando...' : 'Todos os questionários'}</option>
                {checklists.map(cl => (
                  <option key={cl.id} value={cl.id}>{cl.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 border-t border-surface-2 pt-5">
            <Button
              variant="primary"
              className="flex-1 justify-center py-3"
              onClick={aplicarFiltros}
              disabled={loading || loadingFiltros}
              icon={<Check size={16} />}
            >
              {loading ? 'Buscando...' : 'Aplicar Filtros'}
            </Button>
            <Button variant="secondary" className="px-8" onClick={limparFiltros} icon={<RotateCcw size={16} />}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Comparativo entre períodos */}
        {mostrarResultados && validas > 0 && (
          <Card className="mb-6 p-6 sm:px-8">
            <button
              onClick={() => setMostrarComparativo(!mostrarComparativo)}
              className="flex w-full items-center justify-between text-left"
            >
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-violet">
                <GitCompare size={18} /> Comparativo entre Períodos
              </h3>
              <span className="text-sm font-semibold text-violet">{mostrarComparativo ? '▲ Fechar' : '▼ Abrir'}</span>
            </button>

            {mostrarComparativo && (
              <div className="mt-6">
                <p className="mb-4 text-sm text-ink-muted">Compare o período atual com outro período de referência.</p>
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Início do período de referência</label>
                    <input type="date" value={filtrosComp.dataInicio} onChange={(e) => setFiltrosComp({ ...filtrosComp, dataInicio: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Fim do período de referência</label>
                    <input type="date" value={filtrosComp.dataFim} onChange={(e) => setFiltrosComp({ ...filtrosComp, dataFim: e.target.value })} className={inputClass} />
                  </div>
                  <div className="flex items-end">
                    <Button variant="primary" className="w-full justify-center py-2.5" onClick={buscarComparativo} disabled={loadingComp}>
                      {loadingComp ? 'Buscando...' : 'Comparar'}
                    </Button>
                  </div>
                </div>

                {validasComp > 0 && (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-surface-2 p-5 text-center">
                      <p className="mb-1.5 text-xs text-ink-muted">Período Atual</p>
                      <p className="font-display text-3xl font-bold text-violet">{taxaConformidade}%</p>
                      <p className="mt-1 text-xs text-ink-faint">{filtros.dataInicio} → {filtros.dataFim}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-2 p-5 text-center">
                      <p className="mb-1.5 text-xs text-ink-muted">Período de Referência</p>
                      <p className="font-display text-3xl font-bold text-ink-muted">{taxaComp}%</p>
                      <p className="mt-1 text-xs text-ink-faint">{filtrosComp.dataInicio} → {filtrosComp.dataFim}</p>
                    </div>
                    <div className={`rounded-2xl p-5 text-center ${delta > 0 ? 'bg-teal-tint' : delta < 0 ? 'bg-coral-tint' : 'bg-surface-2'}`}>
                      <p className="mb-1.5 text-xs text-ink-muted">Variação</p>
                      <p className={`font-display text-3xl font-bold ${delta > 0 ? 'text-teal' : delta < 0 ? 'text-coral' : 'text-ink-muted'}`}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </p>
                      <p className={`mt-1 flex items-center justify-center gap-1 text-xs font-semibold ${delta > 0 ? 'text-teal' : delta < 0 ? 'text-coral' : 'text-ink-muted'}`}>
                        {delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                        {delta > 0 ? 'Melhora' : delta < 0 ? 'Queda' : 'Estável'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Resultados */}
        {mostrarResultados ? (
          total === 0 ? (
            <Card className="px-6 py-16 text-center">
              <Search size={48} className="mx-auto mb-4 text-ink-faint" />
              <h3 className="mb-2 font-display text-xl font-bold text-ink">Nenhuma resposta encontrada</h3>
              <p className="text-sm text-ink-muted">Tente ajustar o período ou os filtros selecionados.</p>
            </Card>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-brand p-6 shadow-[0_8px_16px_-8px_rgba(255,122,61,0.6)]">
                  <Check size={26} className="mb-2 text-white" />
                  <p className="mb-1.5 text-xs text-white/85">Taxa de Conformidade</p>
                  <p className="font-display text-4xl font-bold text-white">{taxaConformidade}%</p>
                </Card>

                <Card className="p-6">
                  <BarChart3 size={26} className="mb-2 text-ink-faint" />
                  <p className="mb-1.5 text-xs text-ink-muted">Total de Respostas</p>
                  <p className="font-display text-3xl font-bold text-ink">{total}</p>
                </Card>

                <Card className="p-6">
                  <Check size={26} className="mb-2 text-teal" />
                  <p className="mb-1.5 text-xs text-ink-muted">Conformes</p>
                  <p className="font-display text-3xl font-bold text-teal">{conformes}</p>
                </Card>

                <Card className="p-6">
                  <TrendingDown size={26} className="mb-2 text-coral" />
                  <p className="mb-1.5 text-xs text-ink-muted">Não Conformes</p>
                  <p className="font-display text-3xl font-bold text-coral">{naoConformes}</p>
                </Card>
              </div>

              {/* Ranking de Lojas/Empresas */}
              {rankingEmpresas.length > 1 && (
                <Card className="mb-6 p-6 sm:p-8">
                  <h3 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-ink">
                    <Trophy size={20} className="text-amber" /> Ranking de Lojas
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {rankingEmpresas.map((emp, idx) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`
                      const tone = emp.taxa >= 85 ? 'text-teal' : emp.taxa >= 70 ? 'text-amber' : 'text-coral'
                      const barTone = emp.taxa >= 85 ? 'bg-teal' : emp.taxa >= 70 ? 'bg-amber' : 'bg-coral'
                      const isLast = idx === rankingEmpresas.length - 1 && rankingEmpresas.length > 3
                      return (
                        <div key={emp.nome} className={`flex items-center gap-4 rounded-xl p-3.5 ${idx === 0 ? 'bg-amber-tint' : 'bg-surface-2'}`}>
                          <span className={`min-w-[2rem] text-center font-bold text-ink-muted ${idx < 3 ? 'text-xl' : 'text-sm'}`}>{medal}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-ink">{emp.nome}</p>
                            <p className="mt-0.5 text-xs text-ink-muted">{emp.conforme} conformes / {emp.naoConforme} não conformes ({emp.total} respostas)</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-white">
                              <div className={`h-full rounded-full ${barTone}`} style={{ width: `${emp.taxa}%` }} />
                            </div>
                            <span className={`min-w-[3rem] text-right text-lg font-bold ${tone}`}>{emp.taxa}%</span>
                            {isLast && <span className="text-xs font-semibold text-coral">↓ Atenção</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Gráfico de Pizza — Conformidade */}
              {validas > 0 && (() => {
                const r = 70, cx = 90, cy = 90
                const conf = (conformes / validas) * 2 * Math.PI
                const nConf = (naoConformes / validas) * 2 * Math.PI
                function arc(startAngle: number, endAngle: number, color: string) {
                  const x1 = cx + r * Math.cos(startAngle - Math.PI / 2)
                  const y1 = cy + r * Math.sin(startAngle - Math.PI / 2)
                  const x2 = cx + r * Math.cos(endAngle - Math.PI / 2)
                  const y2 = cy + r * Math.sin(endAngle - Math.PI / 2)
                  const large = endAngle - startAngle > Math.PI ? 1 : 0
                  return <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={color} />
                }
                return (
                  <Card className="mb-6 flex flex-wrap items-center gap-8 p-6 sm:p-8">
                    <h3 className="flex w-full items-center gap-2 font-display text-lg font-bold text-ink">
                      <PieChart size={20} className="text-violet" /> Distribuição de Respostas
                    </h3>
                    <svg viewBox="0 0 180 180" className="h-[180px] w-[180px] flex-shrink-0">
                      {arc(0, conf, '#16b88a')}
                      {arc(conf, conf + nConf, '#fb5c66')}
                      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
                      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="900" fill="#ff7a3d">{taxaConformidade}%</text>
                      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9aa9be">conformidade</text>
                    </svg>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3.5 w-3.5 rounded-sm bg-teal" />
                        <span className="text-sm text-ink"><strong>{conformes}</strong> conformes ({validas > 0 ? Math.round(conformes/validas*100) : 0}%)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-3.5 w-3.5 rounded-sm bg-coral" />
                        <span className="text-sm text-ink"><strong>{naoConformes}</strong> não conformes ({validas > 0 ? Math.round(naoConformes/validas*100) : 0}%)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-3.5 w-3.5 rounded-sm bg-surface-2" />
                        <span className="text-sm text-ink"><strong>{total - validas}</strong> N/A ou sem resposta</span>
                      </div>
                    </div>
                  </Card>
                )
              })()}

              {/* Análise por Checklist */}
              {checklistAnalise.length > 0 && (
                <Card className="mb-6 p-6 sm:p-8">
                  <h3 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-ink">
                    <ClipboardList size={20} className="text-brand" /> Análise por Checklist
                  </h3>
                  <div className="flex flex-col gap-5">
                    {checklistAnalise.map((item) => (
                      <div key={item.titulo}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: item.cor }} />
                            <span className="truncate text-sm font-bold text-ink">{item.titulo}</span>
                            <span className="flex-shrink-0 text-xs text-ink-muted">({item.conforme + item.naoConforme} resp.)</span>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-4">
                            <span className="text-sm font-semibold text-teal">✓ {item.conforme}</span>
                            <span className="text-sm font-semibold text-coral">✗ {item.naoConforme}</span>
                            <span className="min-w-[60px] text-right text-xl font-bold" style={{ color: item.cor }}>{item.taxa}%</span>
                          </div>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${item.taxa}%`, background: item.cor }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Evolução por Data — linha SVG */}
              {evolucao.length > 1 && (() => {
                const W = 800, H = 220, padL = 40, padR = 20, padT = 20, padB = 40
                const innerW = W - padL - padR, innerH = H - padT - padB
                const maxTaxa = 100
                const pts = evolucao.map((d, i) => ({
                  x: padL + (i / (evolucao.length - 1)) * innerW,
                  y: padT + innerH - (d.taxa / maxTaxa) * innerH,
                  taxa: d.taxa,
                  dia: d.dia,
                }))
                const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
                const area = `${padL},${padT + innerH} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${padL + innerW},${padT + innerH}`
                const tendencia = evolucao.length >= 2 ? evolucao[evolucao.length - 1].taxa - evolucao[0].taxa : 0
                return (
                  <Card className="p-6 sm:p-8">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <LineChart size={20} className="text-violet" /> Evolução da Taxa de Conformidade
                      </h3>
                      <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${tendencia > 0 ? 'bg-teal-tint text-teal' : tendencia < 0 ? 'bg-coral-tint text-coral' : 'bg-surface-2 text-ink-muted'}`}>
                        {tendencia > 0 ? '↑' : tendencia < 0 ? '↓' : '→'} {tendencia > 0 ? '+' : ''}{tendencia}% no período
                      </span>
                    </div>
                    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8a6ff2" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#8a6ff2" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {/* Grade horizontal */}
                      {[0, 25, 50, 75, 100].map(v => {
                        const y = padT + innerH - (v / 100) * innerH
                        return (
                          <g key={v}>
                            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9aa9be">{v}%</text>
                          </g>
                        )
                      })}
                      {/* Área preenchida */}
                      <polygon points={area} fill="url(#areaGrad)" />
                      {/* Linha */}
                      <polyline points={polyline} fill="none" stroke="#8a6ff2" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                      {/* Pontos */}
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#8a6ff2" strokeWidth="2.5" />
                          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#8a6ff2">{p.taxa}%</text>
                          <text x={p.x} y={padT + innerH + 16} textAnchor="middle" fontSize="10" fill="#64758c">{p.dia}</text>
                        </g>
                      ))}
                    </svg>
                  </Card>
                )
              })()}
            </>
          )
        ) : (
          <Card className="px-6 py-16 text-center">
            <div className="mx-auto max-w-[500px]">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-violet-tint">
                <BarChart3 size={40} className="text-violet" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-ink">Configure os Filtros de Análise</h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                Selecione o período e empresa para visualizar os indicadores de qualidade e desempenho.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
