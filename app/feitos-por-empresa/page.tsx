'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Calendar, User, ClipboardList, GraduationCap, Search, Check, Download,
  BarChart3, CheckCircle, Clock, TrendingUp, TrendingDown, Minus, Building2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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

const inputClass = 'w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none cursor-pointer';
const labelClass = 'mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-muted';

function taxaTone(taxa: number) {
  if (taxa >= 90) return { text: 'text-teal', bar: 'bg-teal', bg: 'bg-teal-tint' };
  if (taxa >= 80) return { text: 'text-blue', bar: 'bg-blue', bg: 'bg-blue-tint' };
  if (taxa >= 70) return { text: 'text-amber', bar: 'bg-amber', bg: 'bg-amber-tint' };
  return { text: 'text-coral', bar: 'bg-coral', bg: 'bg-coral-tint' };
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
    toast.info('Exportando relatório...');
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
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <PageHeader
          title="Relatório de Preenchimento de Empresas"
          subtitle="Acompanhe o preenchimento de checklists por cada empresa/loja"
          backHref="/dashboard-aluno"
          actions={
            <Button variant="secondary" onClick={exportarRelatorio} icon={<Download size={16} />}>
              Exportar Relatório
            </Button>
          }
        />

        {/* Card de Filtros */}
        <Card className="mb-6 p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}><Calendar size={15} /> Período</label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} className={inputClass} />
                <span className="text-sm font-semibold text-ink-faint">até</span>
                <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}><User size={15} /> Copiloto</label>
              <select value={filtros.copiloto} onChange={(e) => setFiltros({ ...filtros, copiloto: e.target.value })} className={inputClass}>
                {copilotos.map(cop => (
                  <option key={cop} value={cop.toLowerCase()}>{cop}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}><ClipboardList size={15} /> Questionário</label>
              <select value={filtros.questionario} onChange={(e) => setFiltros({ ...filtros, questionario: e.target.value })} className={inputClass}>
                {questionarios.map(quest => (
                  <option key={quest} value={quest.toLowerCase()}>{quest}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}><GraduationCap size={15} /> Tipo de mentoria</label>
              <select value={filtros.tipoMentoria} onChange={(e) => setFiltros({ ...filtros, tipoMentoria: e.target.value })} className={inputClass}>
                {tiposMentoria.map(tipo => (
                  <option key={tipo} value={tipo.toLowerCase()}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}><Search size={15} /> Buscar empresa</label>
              <input
                type="text"
                placeholder="Digite para filtrar..."
                value={filtros.buscaEmpresa}
                onChange={(e) => setFiltros({ ...filtros, buscaEmpresa: e.target.value })}
                className="w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="flex items-end">
              <Button variant="primary" className="w-full justify-center py-3" onClick={filtrarResultados} icon={<Check size={16} />}>
                Filtrar Resultados
              </Button>
            </div>
          </div>
        </Card>

        {/* Resultados */}
        {mostrarResultados ? (
          <>
            {/* Cards de Resumo */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <BarChart3 size={26} className="mb-2 text-blue" />
                <p className="mb-1.5 text-xs font-semibold text-ink-muted">Total de Checklists</p>
                <p className="font-display text-3xl font-bold text-blue">{totalGeral}</p>
                <p className="mt-1 text-xs text-ink-faint">no período</p>
              </Card>

              <Card className="p-6">
                <CheckCircle size={26} className="mb-2 text-teal" />
                <p className="mb-1.5 text-xs font-semibold text-ink-muted">Preenchidos</p>
                <p className="font-display text-3xl font-bold text-teal">{preenchidosGeral}</p>
                <p className="mt-1 text-xs text-ink-faint">{Math.round((preenchidosGeral/totalGeral)*100)}% completos</p>
              </Card>

              <Card className="p-6">
                <Clock size={26} className="mb-2 text-amber" />
                <p className="mb-1.5 text-xs font-semibold text-ink-muted">Pendentes</p>
                <p className="font-display text-3xl font-bold text-amber">{pendentesGeral}</p>
                <p className="mt-1 text-xs text-ink-faint">{Math.round((pendentesGeral/totalGeral)*100)}% restantes</p>
              </Card>

              <Card className="p-6">
                <TrendingUp size={26} className="mb-2 text-violet" />
                <p className="mb-1.5 text-xs font-semibold text-ink-muted">Taxa Média</p>
                <p className="font-display text-3xl font-bold text-violet">{taxaMedia}%</p>
                <p className="mt-1 text-xs text-ink-faint">de preenchimento</p>
              </Card>
            </div>

            {/* Tabela de Empresas */}
            <Card className="p-6 sm:p-8">
              <h3 className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-ink">
                <Building2 size={20} className="text-brand" /> Preenchimento por Empresa
              </h3>

              <div className="flex flex-col gap-6">
                {empresasFiltradas.map((empresa, index) => {
                  const tone = taxaTone(empresa.taxaPreenchimento);
                  const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;

                  return (
                    <div key={empresa.id}>
                      <div className="mb-3 flex flex-wrap items-center gap-4">
                        <div className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl font-bold text-ink-muted">
                          {medalha}
                        </div>

                        <div className="min-w-[250px] flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                            <h4 className="text-base font-bold text-ink">{empresa.nome}</h4>
                            {empresa.tendencia === 'up' && <Badge tone="success"><TrendingUp size={12} /> Crescendo</Badge>}
                            {empresa.tendencia === 'down' && <Badge tone="danger"><TrendingDown size={12} /> Atenção</Badge>}
                            {empresa.tendencia === 'stable' && <Badge tone="neutral"><Minus size={12} /> Estável</Badge>}
                          </div>
                          <p className="text-sm text-ink-muted">
                            {empresa.preenchidos} de {empresa.totalChecklists} checklists • {empresa.pendentes} pendentes
                          </p>
                          <p className="mt-0.5 text-xs text-ink-faint">Último preenchimento: {empresa.ultimoPreenchimento}</p>
                        </div>

                        <div className={`min-w-[120px] rounded-xl px-6 py-4 text-center ${tone.bg}`}>
                          <p className={`text-3xl font-bold leading-none ${tone.text}`}>{empresa.taxaPreenchimento}%</p>
                          <p className="mt-1 text-xs text-ink-muted">preenchido</p>
                        </div>
                      </div>

                      <div className="h-4 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={`flex h-full items-center rounded-full pl-3 transition-[width] duration-700 ${tone.bar}`}
                          style={{ width: `${empresa.taxaPreenchimento}%` }}
                        >
                          <span className="text-xs font-bold text-white">
                            {empresa.taxaPreenchimento >= 15 ? `${empresa.preenchidos}/${empresa.totalChecklists}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {empresasFiltradas.length === 0 && (
                <div className="py-12 text-center">
                  <Search size={40} className="mx-auto mb-4 text-ink-faint" />
                  <p className="text-sm font-semibold text-ink-muted">Nenhuma empresa encontrada com os filtros aplicados.</p>
                </div>
              )}
            </Card>
          </>
        ) : (
          <Card className="px-6 py-16 text-center">
            <div className="mx-auto max-w-[500px]">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-tint">
                <BarChart3 size={40} className="text-blue" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-ink">Configure os Filtros</h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                Selecione o período e filtros desejados para visualizar o relatório de preenchimento das empresas.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
