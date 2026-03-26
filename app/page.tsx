"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Smartphone, Shield, Check, ChevronRight, BarChart3, MapPin, ClipboardList, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PerformeSeumercadoLanding() {
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 29 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) { seconds--; }
        else { seconds = 59; if (minutes > 0) { minutes--; } else { minutes = 59; hours = hours > 0 ? hours - 1 : 23; } }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fmt = (n: number) => String(n).padStart(2, '0');
  const scrollToPlans = () => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });

  const BENEFITS = [
    { icon: TrendingUp, title: '+47% de Produtividade', desc: 'Maximize os resultados da sua equipe com checklists inteligentes e automação de processos operacionais.', featured: false },
    { icon: Smartphone, title: 'Controle Total', desc: 'Monitore todas as operações em tempo real direto do seu celular, de qualquer lugar do mundo.', featured: true },
    { icon: Shield, title: '100% Seguro', desc: 'Geolocalização e registro preciso de horários com máxima segurança para o seu negócio.', featured: false },
  ];

  const FEATURES = [
    { icon: ClipboardList, title: 'Checklists Inteligentes', desc: 'Crie e gerencie checklists personalizados para cada área da loja.' },
    { icon: BarChart3, title: 'Relatórios Automáticos', desc: 'Dados em tempo real com gráficos e análises detalhadas de performance.' },
    { icon: MapPin, title: 'Geolocalização', desc: 'Controle de presença e localização precisa dos colaboradores.' },
    { icon: Users, title: 'Gestão de Equipes', desc: 'Acompanhe a performance individual e por departamento.' },
  ];

  const PLANS = [
    { key: 'starter', nome: 'Starter', lojas: '1 Loja', precoOld: 'R$ 500,00', preco: 'R$ 250,00', itens: ['Todos os recursos incluídos', 'Suporte prioritário', 'Treinamento completo'], popular: false },
    { key: 'growth', nome: 'Growth', lojas: '2 a 5 Lojas', precoOld: 'R$ 319,98', preco: 'R$ 159,99', itens: ['Todos os recursos incluídos', 'Suporte prioritário VIP', 'Treinamento completo', 'Economia de 50%'], popular: true },
    { key: 'scale', nome: 'Scale', lojas: '6 a 9 Lojas', precoOld: 'R$ 279,98', preco: 'R$ 139,99', itens: ['Todos os recursos incluídos', 'Suporte VIP 24/7', 'Treinamento personalizado'], popular: false },
    { key: 'enterprise', nome: 'Enterprise', lojas: '10+ Lojas', precoOld: 'R$ 259,98', preco: 'R$ 129,99', itens: ['Todos os recursos incluídos', 'Suporte VIP 24/7', 'Consultor dedicado'], popular: false },
  ];

  const TESTIMONIALS = [
    { nome: 'Autran Júnior', cargo: 'Diretor de Operações', emoji: '👔', texto: 'O Performe seu Mercado revolucionou nossa operação. A produtividade aumentou 47% já no primeiro mês. Foi, sem dúvida, o melhor investimento que fizemos para a empresa!' },
    { nome: 'Mariana Costa', cargo: 'Gerente de Loja', emoji: '👩', texto: 'Antes eu passava horas fazendo relatórios manualmente. Hoje o sistema faz tudo automático e tenho mais tempo para focar no que importa: minha equipe.' },
    { nome: 'Ricardo Mendes', cargo: 'Dono de rede (5 lojas)', emoji: '🏪', texto: 'Com 5 lojas é impossível estar em todo lugar. Agora monitoro tudo pelo celular em tempo real. O suporte é excepcional e a implementação foi muito rápida.' },
  ];

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .anim-pulse { animation: pulse 2.5s ease-in-out infinite; }
        .anim-fade { animation: fadeIn 0.7s ease-out; }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; cursor: default; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
        .btn-primary { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(249,115,22,0.45) !important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

        {/* ── HEADER ── */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '0.875rem 1.5rem',
          position: 'sticky', top: 0, zIndex: 1000,
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fed7aa', boxShadow: '0 2px 8px rgba(249,115,22,0.2)', flexShrink: 0 }}>
                <img src="/logo-semerro.jpg" alt="Performe seu Mercado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                Performe <span style={{ color: '#f97316' }}>seu Mercado</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {!isMobile && (
                <button onClick={scrollToPlans} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontWeight: '600', fontSize: '0.925rem' }}>
                  Ver Planos
                </button>
              )}
              <button
                onClick={() => router.push('/login')}
                style={{
                  backgroundColor: '#f97316', color: 'white', border: 'none',
                  padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700',
                  boxShadow: '0 2px 10px rgba(249,115,22,0.35)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ea580c'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f97316'}
              >
                Área do Cliente
              </button>
            </div>
          </div>
        </header>

        {/* ── PROMO BANNER ── */}
        <div className="anim-pulse" style={{ backgroundColor: '#ea580c', color: 'white', padding: '0.75rem 1rem', textAlign: 'center' }}>
          <p style={{ fontSize: isMobile ? '0.8rem' : '1rem', fontWeight: '700' }}>
            🔥 PROMOÇÃO RELÂMPAGO: 50% OFF + BÔNUS EXCLUSIVOS nos 3 primeiros meses! TERMINA EM BREVE! 🔥
          </p>
        </div>

        {/* ── HERO ── */}
        <section style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
          color: 'white',
          padding: isMobile ? '3rem 1.25rem 2.5rem' : '5.5rem 1.5rem 4.5rem',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* decoração de fundo */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '550px', height: '550px', background: 'rgba(249,115,22,0.1)', borderRadius: '50%', filter: 'blur(90px)' }} />
            <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '400px', height: '400px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(70px)' }} />
          </div>

          <div className="anim-fade" style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            {/* badge */}
            <div style={{
              display: 'inline-block', marginBottom: '1.5rem',
              backgroundColor: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.45)',
              borderRadius: '9999px', padding: '0.375rem 1.1rem',
              fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.06em', color: '#fed7aa'
            }}>
              ✅ MAIS DE 500 EMPRESAS JÁ TRANSFORMARAM SUA GESTÃO
            </div>

            <h1 style={{
              fontSize: isMobile ? '2.1rem' : '3.75rem',
              fontWeight: '900', lineHeight: '1.12',
              marginBottom: '1.25rem', letterSpacing: '-0.025em'
            }}>
              REVOLUCIONE A GESTÃO<br />
              DO SEU <span style={{ color: '#fb923c' }}>SUPERMERCADO</span>
            </h1>

            <p style={{
              fontSize: isMobile ? '1.05rem' : '1.3rem',
              color: '#bfdbfe', lineHeight: '1.65',
              maxWidth: '640px', margin: `0 auto ${isMobile ? '2rem' : '2.75rem'}`
            }}>
              Checklists inteligentes, controle em tempo real e relatórios automáticos que aumentaram a produtividade em até{' '}
              <strong style={{ color: '#fb923c' }}>47%</strong>
            </p>

            {/* Countdown */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: '1rem', padding: isMobile ? '1.25rem' : '1.75rem',
              maxWidth: '400px', margin: `0 auto ${isMobile ? '2rem' : '2.75rem'}`
            }}>
              <p style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.08em', color: '#fed7aa', marginBottom: '0.875rem' }}>
                ⏰ OFERTA ESPECIAL TERMINA EM:
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.625rem' }}>
                {[{ val: timeLeft.hours, label: 'HORAS' }, { val: timeLeft.minutes, label: 'MIN' }, { val: timeLeft.seconds, label: 'SEG' }].map((item, i) => (
                  <React.Fragment key={item.label}>
                    {i > 0 && <div style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '900', color: '#fb923c', lineHeight: 1 }}>:</div>}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '0.625rem', padding: isMobile ? '0.625rem 0.875rem' : '0.875rem 1.1rem', minWidth: isMobile ? '64px' : '80px', textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? '1.875rem' : '2.5rem', fontWeight: '900', lineHeight: 1 }}>{fmt(item.val)}</div>
                      <div style={{ fontSize: '0.6rem', marginTop: '0.25rem', color: '#93c5fd', letterSpacing: '0.05em' }}>{item.label}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <button
              onClick={scrollToPlans}
              className="btn-primary"
              style={{
                backgroundColor: '#f97316', color: 'white',
                padding: isMobile ? '1rem 2rem' : '1.1rem 3rem',
                borderRadius: '9999px', fontSize: isMobile ? '1rem' : '1.2rem',
                fontWeight: '800', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(249,115,22,0.45)',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                width: isMobile ? '100%' : 'auto', justifyContent: 'center'
              }}
            >
              QUERO COMEÇAR AGORA <ChevronRight size={22} />
            </button>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <div style={{ backgroundColor: '#111827', color: 'white', padding: '1.5rem 1.5rem' }}>
          <div style={{
            maxWidth: '900px', margin: '0 auto',
            display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
            gap: '1rem', textAlign: 'center'
          }}>
            {[
              { num: '+500', label: 'Empresas Atendidas' },
              { num: '47%', label: 'Mais Produtividade' },
              { num: '30 dias', label: 'Garantia Total' },
              { num: '24h', label: 'Para Implementar' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: isMobile ? '1.625rem' : '2.1rem', fontWeight: '900', color: '#f97316', lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.3rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BENEFÍCIOS ── */}
        <section style={{ padding: isMobile ? '3rem 1.25rem' : '5rem 1.5rem', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '3.5rem' }}>
              <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', color: '#111827', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                Por que escolher a <span style={{ color: '#f97316' }}>Performe seu Mercado?</span>
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: '520px', margin: '0 auto' }}>
                Resultados comprovados por centenas de supermercados e redes varejistas em todo o Brasil
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '1.5rem' }}>
              {BENEFITS.map((b, i) => (
                <div key={i} className={b.featured ? undefined : 'card-hover'} style={{
                  backgroundColor: b.featured ? '#f97316' : 'white',
                  borderRadius: '1.25rem', padding: '2rem', textAlign: 'center',
                  border: b.featured ? 'none' : '1px solid #e5e7eb',
                  boxShadow: b.featured ? '0 20px 40px rgba(249,115,22,0.3)' : '0 2px 12px rgba(0,0,0,0.05)',
                  transform: !isMobile && b.featured ? 'scale(1.04)' : 'none'
                }}>
                  <div style={{
                    width: '4.5rem', height: '4.5rem', borderRadius: '50%', margin: '0 auto 1.5rem',
                    backgroundColor: b.featured ? 'rgba(255,255,255,0.2)' : '#fff7ed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <b.icon size={28} style={{ color: b.featured ? 'white' : '#f97316' }} />
                  </div>
                  <h3 style={{ fontSize: '1.375rem', fontWeight: '800', marginBottom: '0.75rem', color: b.featured ? 'white' : '#111827' }}>{b.title}</h3>
                  <p style={{ color: b.featured ? 'rgba(255,255,255,0.85)' : '#6b7280', lineHeight: '1.65', fontSize: '0.95rem' }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FUNCIONALIDADES ── */}
        <section style={{ padding: isMobile ? '3rem 1.25rem' : '5rem 1.5rem', backgroundColor: '#f8fafc' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '3.5rem' }}>
              <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', color: '#111827', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                Tudo que você precisa <span style={{ color: '#f97316' }}>em um só lugar</span>
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                Ferramentas profissionais para gestão completa do seu varejo
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '1.25rem' }}>
              {FEATURES.map((f, i) => (
                <div key={i} className="card-hover" style={{
                  backgroundColor: 'white', borderRadius: '1rem', padding: isMobile ? '1.25rem' : '1.5rem',
                  border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '0.75rem',
                    backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem', margin: isMobile ? '0 auto 1rem' : '0 0 1rem'
                  }}>
                    <f.icon size={22} style={{ color: '#f97316' }} />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.6' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLANOS ── */}
        <section id="planos" style={{ padding: isMobile ? '3rem 1.25rem' : '5rem 1.5rem', backgroundColor: '#f1f5f9' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
              <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Escolha o <span style={{ color: '#f97316' }}>Plano Ideal</span>
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>Todos os planos incluem 30 dias de garantia total</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)',
              gap: '1.25rem', maxWidth: '1100px', margin: '0 auto'
            }}>
              {PLANS.map(p => (
                <div key={p.key} style={{
                  backgroundColor: 'white', borderRadius: '1.25rem', padding: '1.75rem',
                  border: p.popular ? '2.5px solid #f97316' : '1px solid #e5e7eb',
                  boxShadow: p.popular ? '0 20px 40px rgba(249,115,22,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
                  position: 'relative',
                  transform: !isMobile && p.popular ? 'scale(1.04)' : 'none',
                  display: 'flex', flexDirection: 'column'
                }}>
                  {p.popular && (
                    <div style={{
                      position: 'absolute', top: '-0.875rem', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: '#f97316', color: 'white', padding: '0.375rem 1.25rem',
                      borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '800',
                      whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(249,115,22,0.4)'
                    }}>
                      🏆 MAIS POPULAR
                    </div>
                  )}

                  <div style={{ marginTop: p.popular ? '0.5rem' : 0, flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>Plano {p.nome}</h3>
                    <span style={{
                      display: 'inline-block', backgroundColor: '#fff7ed', color: '#9a3412',
                      fontSize: '0.78rem', fontWeight: '700', padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem', marginBottom: '1.25rem'
                    }}>
                      ✨ {p.lojas}
                    </span>

                    <p style={{ color: '#9ca3af', textDecoration: 'line-through', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{p.precoOld}</p>
                    <div style={{ fontSize: '2.1rem', fontWeight: '900', color: '#f97316', lineHeight: 1.1 }}>{p.preco}</div>
                    <p style={{ color: '#6b7280', fontSize: '0.825rem', marginBottom: '1.5rem', marginTop: '0.25rem' }}>por CNPJ/mês</p>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
                      {p.itens.map(item => (
                        <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                          <Check size={15} style={{ color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => router.push(`/contratar?plano=${p.key}`)}
                    style={{
                      width: '100%', padding: '0.875rem',
                      backgroundColor: p.popular ? '#f97316' : 'white',
                      color: p.popular ? 'white' : '#f97316',
                      border: '2px solid #f97316',
                      borderRadius: '0.625rem', fontSize: '0.95rem', fontWeight: '700',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f97316'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = p.popular ? '#f97316' : 'white'; e.currentTarget.style.color = p.popular ? 'white' : '#f97316'; }}
                  >
                    Começar Agora
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GARANTIA ── */}
        <section style={{ padding: isMobile ? '3rem 1.25rem' : '5rem 1.5rem', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: isMobile ? '8rem' : '10rem', height: isMobile ? '8rem' : '10rem', margin: '0 auto 2rem', position: 'relative' }}>
              <div className="anim-pulse" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #facc15, #f97316)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: '0.5rem', backgroundColor: '#111827', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ fontSize: isMobile ? '2.5rem' : '3rem', fontWeight: '900', lineHeight: 1 }}>30</div>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af', letterSpacing: '0.05em' }}>DIAS</div>
              </div>
              <div style={{ position: 'absolute', inset: '-0.5rem', border: '3px solid #facc15', borderRadius: '50%' }} />
            </div>
            <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '1rem', color: '#111827', letterSpacing: '-0.02em' }}>
              GARANTIA DUPLA DE SATISFAÇÃO
            </h2>
            <p style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: '700', color: '#374151', marginBottom: '0.75rem' }}>
              30 DIAS PARA TESTAR + 30 DIAS DE GARANTIA
            </p>
            <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.75', maxWidth: '520px', margin: '0 auto' }}>
              Se não estiver 100% satisfeito com os resultados, devolvemos seu dinheiro integralmente.{' '}
              <strong style={{ color: '#f97316' }}>Sem burocracia, sem perguntas, sem compromisso.</strong>
            </p>
          </div>
        </section>

        {/* ── DEPOIMENTOS ── */}
        <section style={{ padding: isMobile ? '3rem 1.25rem' : '5rem 1.5rem', background: 'linear-gradient(135deg, #f9fafb, #fff7ed)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem', color: '#111827', letterSpacing: '-0.02em' }}>
              O que nossos <span style={{ color: '#f97316' }}>clientes dizem</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '1.25rem' }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="card-hover" style={{
                  backgroundColor: 'white', borderRadius: '1.25rem', padding: '1.75rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
                  display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                  <div style={{ fontSize: '2.5rem', color: '#f97316', lineHeight: 1 }}>"</div>
                  <p style={{ fontSize: '0.925rem', color: '#374151', lineHeight: '1.7', flex: 1 }}>{t.texto}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{
                      width: '3rem', height: '3rem', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: '#fff7ed', border: '2px solid #fed7aa',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem'
                    }}>{t.emoji}</div>
                    <div>
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.925rem' }}>{t.nome}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{t.cargo}</div>
                      <div style={{ color: '#facc15', fontSize: '0.85rem', marginTop: '0.125rem' }}>⭐⭐⭐⭐⭐</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section style={{
          padding: isMobile ? '3rem 1.25rem' : '5.5rem 1.5rem',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
          color: 'white'
        }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
              PRONTO PARA TRANSFORMAR SUA EMPRESA?
            </h2>
            <p style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: '#bfdbfe', marginBottom: '2.5rem' }}>
              Junte-se a centenas de supermercados que já utilizam o Performe seu Mercado
            </p>

            <div style={{
              backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem',
              padding: isMobile ? '1.5rem' : '2rem', marginBottom: '2rem',
              maxWidth: '460px', margin: '0 auto 2rem', textAlign: 'left'
            }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {['30 dias de garantia total (sem perguntas)', 'Implementação em até 24 horas', 'Suporte completo na implementação'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: isMobile ? '0.925rem' : '1rem' }}>
                    <Check size={20} style={{ color: '#4ade80', flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={scrollToPlans}
              className="btn-primary"
              style={{
                backgroundColor: '#f97316', color: 'white',
                padding: isMobile ? '1rem 2rem' : '1.1rem 3rem',
                borderRadius: '9999px', fontSize: isMobile ? '1rem' : '1.2rem',
                fontWeight: '800', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(249,115,22,0.5)',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                width: isMobile ? '100%' : 'auto', justifyContent: 'center'
              }}
            >
              {isMobile ? 'COMEÇAR AGORA' : 'COMEÇAR MINHA TRANSFORMAÇÃO AGORA'} <ChevronRight size={22} />
            </button>
            <p style={{ fontSize: '0.9rem', color: '#bfdbfe', marginTop: '1rem' }}>
              💳 Sem compromisso. Cancele quando quiser.
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ backgroundColor: '#0f172a', color: 'white', padding: isMobile ? '2.5rem 1.25rem' : '3.5rem 1.5rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
              gap: isMobile ? '2rem' : '3rem',
              marginBottom: '2.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.75rem' }}>
                  Performe <span style={{ color: '#f97316' }}>seu Mercado</span>
                </h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.7', fontSize: '0.9rem' }}>
                  O sistema que revoluciona a gestão de operações no varejo brasileiro.
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.875rem', color: '#e2e8f0' }}>Links Rápidos</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[{ label: 'Funcionalidades', href: '#' }, { label: 'Planos', href: '#planos' }, { label: 'Suporte', href: '#' }].map(l => (
                    <li key={l.label}>
                      <a href={l.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.875rem', color: '#e2e8f0' }}>Contato</h3>
                <ul style={{ listStyle: 'none', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>📧 contato@semerro.com.br</li>
                  <li>📱 (11) 9999-9999</li>
                </ul>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid #1e293b', paddingTop: '1.5rem',
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', alignItems: 'center',
              gap: '1rem', textAlign: 'center'
            }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                © 2025 Performe seu Mercado — Todos os direitos reservados
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                {['Política de Privacidade', 'Termos de Uso'].map(l => (
                  <a key={l} href="#" style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
