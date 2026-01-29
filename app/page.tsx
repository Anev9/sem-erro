"use client";

import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Smartphone, Shield, Check, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SemErroLanding() {
  const router = useRouter();
  
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 29
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              minutes = 59;
              seconds = 59;
            }
          }
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, '0');

  const scrollToPlans = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .hover-scale {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-scale:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Header */}
        <header style={{
          background: 'linear-gradient(to right, #f97316, #fb923c, #2563eb)',
          color: 'white',
          padding: isMobile ? '1rem' : '1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobile ? '1rem' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: isMobile ? '2.5rem' : '3rem',
                height: isMobile ? '2.5rem' : '3rem',
                backgroundColor: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <img 
                  src="/logo-semerro.jpg" 
                  alt="Logo Sem Erro"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <h1 style={{ 
                fontSize: isMobile ? '1.25rem' : '1.75rem', 
                fontWeight: 'bold', 
                margin: 0,
                letterSpacing: '0.05em'
              }}>SEM ERRO</h1>
            </div>
            <button 
              onClick={() => router.push('/login')}
              style={{
              border: '2px solid white',
              padding: isMobile ? '0.5rem 1.25rem' : '0.625rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              width: isMobile ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#f97316';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'white';
            }}>
              👤 Área do Cliente
            </button>
          </div>
        </header>

        {/* Promo Banner */}
        <div className="animate-pulse" style={{
          backgroundColor: '#f97316',
          color: 'white',
          padding: isMobile ? '0.75rem 1rem' : '1rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '0.813rem' : '1.125rem',
            fontWeight: 'bold',
            margin: 0,
            lineHeight: '1.5'
          }}>
            🔥 PROMOÇÃO RELÂMPAGO: 50% OFF + BÔNUS EXCLUSIVOS nos 3 primeiros meses! {!isMobile && 'TERMINA EM BREVE!'} 🔥
          </p>
        </div>

        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',
          color: 'white',
          padding: isMobile ? '2rem 1rem' : '4rem 1rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10px',
            width: isMobile ? '150px' : '300px',
            height: isMobile ? '150px' : '300px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '10px',
            width: isMobile ? '200px' : '400px',
            height: isMobile ? '200px' : '400px',
            background: 'rgba(249, 115, 22, 0.2)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            pointerEvents: 'none'
          }}></div>

          <div className="animate-fade-in" style={{ 
            maxWidth: '1152px', 
            margin: '0 auto', 
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <h2 style={{
              fontSize: isMobile ? '2rem' : '3.75rem',
              fontWeight: 'bold',
              marginBottom: isMobile ? '1rem' : '1.5rem',
              lineHeight: '1.2',
              margin: `0 0 ${isMobile ? '1rem' : '1.5rem'} 0`
            }}>
              REVOLUCIONE SUA GESTÃO<br />
              <span style={{ color: '#fb923c' }}>AGORA!</span>
            </h2>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.5rem',
              marginBottom: isMobile ? '1.5rem' : '2rem',
              padding: '0 1rem',
              color: '#dbeafe'
            }}>
              Sistema que aumentou em até <span style={{ color: '#fb923c', fontWeight: 'bold' }}>47%</span> a produtividade de <span style={{ color: '#fb923c', fontWeight: 'bold' }}>+500 empresas</span>
            </p>
            
            {/* Countdown Timer */}
            <div className="hover-scale" style={{
              backgroundColor: '#f97316',
              borderRadius: '1rem',
              padding: isMobile ? '1.5rem' : '2rem',
              maxWidth: isMobile ? '100%' : '42rem',
              margin: `0 auto ${isMobile ? '1.5rem' : '2rem'} auto`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <p style={{
                fontSize: isMobile ? '1rem' : '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                ⏰ OFERTA ESPECIAL TERMINA EM:
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isMobile ? '0.5rem' : '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '0.75rem',
                  padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                  minWidth: isMobile ? '70px' : '90px'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '2rem' : '3rem',
                    fontWeight: 'bold',
                    lineHeight: '1'
                  }}>{formatTime(timeLeft.hours)}</div>
                  <div style={{ fontSize: isMobile ? '0.625rem' : '0.75rem', marginTop: '0.25rem' }}>HORAS</div>
                </div>
                <div style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 'bold' }}>:</div>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '0.75rem',
                  padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                  minWidth: isMobile ? '70px' : '90px'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '2rem' : '3rem',
                    fontWeight: 'bold',
                    lineHeight: '1'
                  }}>{formatTime(timeLeft.minutes)}</div>
                  <div style={{ fontSize: isMobile ? '0.625rem' : '0.75rem', marginTop: '0.25rem' }}>MIN</div>
                </div>
                <div style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 'bold' }}>:</div>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '0.75rem',
                  padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                  minWidth: isMobile ? '70px' : '90px'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '2rem' : '3rem',
                    fontWeight: 'bold',
                    lineHeight: '1'
                  }}>{formatTime(timeLeft.seconds)}</div>
                  <div style={{ fontSize: isMobile ? '0.625rem' : '0.75rem', marginTop: '0.25rem' }}>SEG</div>
                </div>
              </div>
            </div>

            <button 
              onClick={scrollToPlans}
              className="hover-scale"
              style={{
                backgroundColor: '#f97316',
                color: 'white',
                padding: isMobile ? '0.875rem 2rem' : '1rem 3rem',
                borderRadius: '9999px',
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center'
              }}
            >
              COMECE AGORA
              <ChevronRight style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>
          </div>
        </section>

        {/* Benefits Section */}
        <section style={{ 
          padding: isMobile ? '2rem 1rem' : '4rem 1rem', 
          backgroundColor: 'white' 
        }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: isMobile ? '1.5rem' : '2rem'
            }}>
              {/* Benefit 1 */}
              <div className="hover-lift" style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                border: '2px solid transparent'
              }}>
                <div style={{
                  backgroundColor: '#fed7aa',
                  width: isMobile ? '3.5rem' : '5rem',
                  height: isMobile ? '3.5rem' : '5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <TrendingUp style={{
                    width: isMobile ? '2rem' : '3rem',
                    height: isMobile ? '2rem' : '3rem',
                    color: '#f97316'
                  }} />
                </div>
                <h3 style={{
                  fontSize: isMobile ? '1.5rem' : '1.875rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: '#1f2937'
                }}>
                  +47% de<br />Produtividade
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.938rem' : '1rem',
                  color: '#4b5563',
                  lineHeight: '1.6'
                }}>
                  Maximize os resultados da sua equipe com checklists inteligentes e automação
                </p>
              </div>

              {/* Benefit 2 - Destacado */}
              <div style={{
                backgroundColor: '#fff7ed',
                borderRadius: '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '3px solid #f97316',
                textAlign: 'center',
                transform: isMobile ? 'scale(1)' : 'scale(1.05)'
              }}>
                <div style={{
                  backgroundColor: '#f97316',
                  width: isMobile ? '3.5rem' : '5rem',
                  height: isMobile ? '3.5rem' : '5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <Smartphone style={{
                    width: isMobile ? '2rem' : '3rem',
                    height: isMobile ? '2rem' : '3rem',
                    color: 'white'
                  }} />
                </div>
                <h3 style={{
                  fontSize: isMobile ? '1.5rem' : '1.875rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: '#1f2937'
                }}>
                  Controle Total
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.938rem' : '1rem',
                  color: '#4b5563',
                  lineHeight: '1.6',
                  fontWeight: '500'
                }}>
                  Monitore todas as operações em tempo real direto do seu celular
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="hover-lift" style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                border: '2px solid transparent'
              }}>
                <div style={{
                  backgroundColor: '#fed7aa',
                  width: isMobile ? '3.5rem' : '5rem',
                  height: isMobile ? '3.5rem' : '5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <Shield style={{
                    width: isMobile ? '2rem' : '3rem',
                    height: isMobile ? '2rem' : '3rem',
                    color: '#f97316'
                  }} />
                </div>
                <h3 style={{
                  fontSize: isMobile ? '1.5rem' : '1.875rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: '#1f2937'
                }}>
                  100% Seguro
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.938rem' : '1rem',
                  color: '#4b5563',
                  lineHeight: '1.6'
                }}>
                  Geolocalização e registro preciso de horários com máxima segurança
                </p>
              </div>
            </div>

            {/* Trust Badge */}
            <div style={{ textAlign: 'center', marginTop: isMobile ? '2rem' : '3rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                backgroundColor: '#fffbeb',
                padding: isMobile ? '1rem' : '1.5rem 2rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <Award style={{
                  width: isMobile ? '3rem' : '4rem',
                  height: isMobile ? '3rem' : '4rem',
                  color: '#eab308',
                  flexShrink: 0
                }} />
                <div>
                  <div style={{
                    fontSize: isMobile ? '1.125rem' : '1.5rem',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    LÍDER EM GESTÃO DE OPERAÇÕES
                  </div>
                  <div style={{
                    color: '#4b5563',
                    marginTop: '0.25rem',
                    fontSize: isMobile ? '0.938rem' : '1.125rem'
                  }}>
                    Mais de 500 empresas já revolucionaram sua gestão!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" style={{ 
          padding: isMobile ? '2rem 1rem' : '4rem 1rem', 
          backgroundColor: '#f3f4f6' 
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.5rem',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: isMobile ? '0.5rem' : '1rem',
              padding: '0 1rem',
              lineHeight: '1.3',
              color: '#1f2937'
            }}>
              ESCOLHA O PLANO IDEAL
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: isMobile ? '2rem' : '3rem',
              fontSize: isMobile ? '1rem' : '1.125rem'
            }}>
              Todos os planos incluem 30 dias de garantia
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: isMobile ? '1.5rem' : '1.5rem',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {/* Plano Starter */}
              <div className="hover-lift" style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Plano Starter</h3>
                <p style={{ color: '#9ca3af', textDecoration: 'line-through', marginBottom: '0.5rem' }}>R$ 500,00</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f97316', marginBottom: '0.5rem' }}>R$ 250,00</div>
                <p style={{ color: '#4b5563', marginBottom: '1rem', fontSize: '0.938rem' }}>por CNPJ/mês</p>
                <div style={{ 
                  backgroundColor: '#fff7ed', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  border: '1px solid #fed7aa'
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#9a3412', margin: 0 }}>✨ Ideal para 1 Loja</p>
                </div>
                <ul style={{ fontSize: '0.875rem', marginBottom: '1.5rem', listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Todos os recursos incluídos</span>
                  </li>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Suporte prioritário</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Treinamento completo</span>
                  </li>
                </ul>
                <button 
                onClick={() => router.push('/login')}
                style={{
                  width: '100%',
                  backgroundColor: '#f97316',
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}>
                  Começar Agora
                </button>
              </div>

              {/* Plano Growth - Popular */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                border: '3px solid #f97316',
                position: 'relative',
                transform: isMobile ? 'scale(1)' : 'scale(1.05)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#f97316',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap'
                }}>
                  🏆 MAIS POPULAR
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', marginTop: '0.5rem', color: '#1f2937' }}>Plano Growth</h3>
                <p style={{ color: '#9ca3af', textDecoration: 'line-through', marginBottom: '0.5rem' }}>R$ 319,98</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f97316', marginBottom: '0.5rem' }}>R$ 159,99</div>
                <p style={{ color: '#4b5563', marginBottom: '1rem', fontSize: '0.938rem' }}>por CNPJ/mês</p>
                <div style={{ 
                  backgroundColor: '#fff7ed', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  border: '1px solid #fed7aa'
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#9a3412', margin: 0 }}>✨ 2 a 5 Lojas</p>
                </div>
                <ul style={{ fontSize: '0.875rem', marginBottom: '1.5rem', listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Todos os recursos incluídos</span>
                  </li>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Suporte prioritário VIP</span>
                  </li>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Treinamento completo</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span style={{ fontWeight: 'bold', color: '#f97316' }}>Economia de 50%</span>
                  </li>
                </ul>
                <button 
                onClick={() => router.push('/login')}
                style={{
                  width: '100%',
                  backgroundColor: '#f97316',
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}>
                  Começar Agora
                </button>
              </div>

              {/* Plano Scale */}
              <div className="hover-lift" style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Plano Scale</h3>
                <p style={{ color: '#9ca3af', textDecoration: 'line-through', marginBottom: '0.5rem' }}>R$ 279,98</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f97316', marginBottom: '0.5rem' }}>R$ 139,99</div>
                <p style={{ color: '#4b5563', marginBottom: '1rem', fontSize: '0.938rem' }}>por CNPJ/mês</p>
                <div style={{ 
                  backgroundColor: '#fff7ed', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  border: '1px solid #fed7aa'
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#9a3412', margin: 0 }}>✨ 6 a 9 Lojas</p>
                </div>
                <ul style={{ fontSize: '0.875rem', marginBottom: '1.5rem', listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Todos os recursos incluídos</span>
                  </li>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Suporte VIP 24/7</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Treinamento personalizado</span>
                  </li>
                </ul>
                <button 
                onClick={() => router.push('/login')}
                style={{
                  width: '100%',
                  backgroundColor: '#f97316',
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}>
                  Começar Agora
                </button>
              </div>

              {/* Plano Enterprise */}
              <div className="hover-lift" style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Plano Enterprise</h3>
                <p style={{ color: '#9ca3af', textDecoration: 'line-through', marginBottom: '0.5rem' }}>R$ 259,98</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f97316', marginBottom: '0.5rem' }}>R$ 129,99</div>
                <p style={{ color: '#4b5563', marginBottom: '1rem', fontSize: '0.938rem' }}>por CNPJ/mês</p>
                <div style={{ 
                  backgroundColor: '#fff7ed', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  border: '1px solid #fed7aa'
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#9a3412', margin: 0 }}>✨ 10+ Lojas</p>
                </div>
                <ul style={{ fontSize: '0.875rem', marginBottom: '1.5rem', listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Todos os recursos incluídos</span>
                  </li>
                  <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span>Suporte VIP 24/7</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                    <span style={{ fontWeight: 'bold' }}>Consultor dedicado</span>
                  </li>
                </ul>
                <button 
                onClick={() => router.push('/login')}
                style={{
                  width: '100%',
                  backgroundColor: '#f97316',
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}>
                  Começar Agora
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Guarantee Section */}
        <section style={{ 
          padding: isMobile ? '2rem 1rem' : '4rem 1rem', 
          backgroundColor: 'white' 
        }}>
          <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              position: 'relative',
              width: isMobile ? '8rem' : '10rem',
              height: isMobile ? '8rem' : '10rem',
              margin: '0 auto 1.5rem auto'
            }}>
              <div className="animate-pulse" style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom right, #facc15, #f97316)',
                borderRadius: '50%'
              }}></div>
              <div style={{
                position: 'absolute',
                inset: '0.5rem',
                backgroundColor: '#000',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <div>
                  <div style={{ fontSize: isMobile ? '2.5rem' : '3rem', fontWeight: 'bold', lineHeight: '1' }}>30</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>DIAS</div>
                </div>
              </div>
              <div style={{
                position: 'absolute',
                inset: '-0.5rem',
                border: '4px solid #facc15',
                borderRadius: '50%'
              }}></div>
            </div>
            
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              padding: '0 1rem',
              color: '#1f2937'
            }}>
              GARANTIA DUPLA DE SATISFAÇÃO
            </h2>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              marginBottom: '1rem',
              padding: '0 1rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              30 DIAS PARA TESTAR + 30 DIAS DE GARANTIA
            </p>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              color: '#4b5563',
              padding: '0 1rem',
              lineHeight: '1.7'
            }}>
              Se não estiver 100% satisfeito com os resultados, devolvemos seu dinheiro integralmente.
              <span style={{ fontWeight: 'bold', color: '#f97316' }}> Sem burocracia, sem perguntas, sem compromisso.</span>
            </p>
          </div>
        </section>

        {/* Testimonial Section */}
        <section style={{ 
          padding: isMobile ? '2rem 1rem' : '4rem 1rem', 
          background: 'linear-gradient(to bottom right, #f9fafb, #fff7ed)' 
        }}>
          <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: isMobile ? '2rem' : '3rem',
              color: '#1f2937'
            }}>
              O QUE NOSSOS CLIENTES DIZEM
            </h2>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: isMobile ? '1.5rem' : '2.5rem'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1.5rem' : '2rem',
                alignItems: 'center'
              }}>
                <div style={{ 
                  flexShrink: 0, 
                  textAlign: 'center',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <div style={{
                    width: isMobile ? '6rem' : '8rem',
                    height: isMobile ? '6rem' : '8rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(to bottom right, #fbb6ce, #86efac, #fde047)',
                    padding: '0.25rem',
                    margin: '0 auto 1rem auto'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '2.5rem' : '3rem'
                    }}>
                      👤
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: isMobile ? '1.25rem' : '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.25rem',
                    color: '#1f2937'
                  }}>
                    Autran Júnior
                  </h3>
                  <p style={{
                    fontSize: isMobile ? '0.938rem' : '1rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>
                    Diretor de Operações
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    color: '#facc15',
                    fontSize: '1.25rem'
                  }}>
                    ⭐⭐⭐⭐⭐
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: isMobile ? '3rem' : '4rem',
                    color: '#f97316',
                    lineHeight: '1',
                    marginBottom: '0.5rem'
                  }}>"</div>
                  <p style={{
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontStyle: 'italic',
                    color: '#374151',
                    lineHeight: '1.7'
                  }}>
                    O Sem Erro revolucionou completamente nossa operação. Nossa produtividade aumentou em <span style={{ fontWeight: 'bold', color: '#f97316' }}>47% já no primeiro mês</span>. O controle que temos agora sobre nossas operações é incomparável. A facilidade de uso e o suporte excepcional fizeram toda diferença. Foi, sem dúvida, o <span style={{ fontWeight: 'bold' }}>melhor investimento que fizemos</span> para nossa empresa!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section style={{ 
          padding: isMobile ? '2rem 1rem' : '4rem 1rem', 
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          color: 'white'
        }}>
          <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              padding: '0 1rem',
              lineHeight: '1.3'
            }}>
              PRONTO PARA TRANSFORMAR SUA EMPRESA?
            </h2>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              color: '#dbeafe',
              marginBottom: isMobile ? '1.5rem' : '2rem',
              padding: '0 1rem'
            }}>
              Junte-se a centenas de empresas de sucesso que já utilizam o Sem Erro
            </p>
            
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              padding: isMobile ? '1.5rem' : '2rem',
              marginBottom: isMobile ? '1.5rem' : '2rem',
              maxWidth: '600px',
              margin: `0 auto ${isMobile ? '1.5rem' : '2rem'} auto`
            }}>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                textAlign: 'left'
              }}>
                <li style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  fontSize: isMobile ? '0.938rem' : '1.125rem'
                }}>
                  <Check style={{ 
                    width: '1.5rem', 
                    height: '1.5rem', 
                    color: '#4ade80', 
                    flexShrink: 0,
                    marginTop: '0.125rem'
                  }} />
                  <span>30 dias de satisfação ou seu dinheiro de volta (Sem perguntas)</span>
                </li>
                <li style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  fontSize: isMobile ? '0.938rem' : '1.125rem'
                }}>
                  <Check style={{ 
                    width: '1.5rem', 
                    height: '1.5rem', 
                    color: '#4ade80', 
                    flexShrink: 0,
                    marginTop: '0.125rem'
                  }} />
                  <span>Implementação em 24 horas</span>
                </li>
                <li style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem',
                  fontSize: isMobile ? '0.938rem' : '1.125rem'
                }}>
                  <Check style={{ 
                    width: '1.5rem', 
                    height: '1.5rem', 
                    color: '#4ade80', 
                    flexShrink: 0,
                    marginTop: '0.125rem'
                  }} />
                  <span>Suporte completo na implementação</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={scrollToPlans}
              className="hover-scale"
              style={{
                backgroundColor: '#f97316',
                color: 'white',
                padding: isMobile ? '1rem 1.5rem' : '1.25rem 2.5rem',
                borderRadius: '9999px',
                fontSize: isMobile ? '1rem' : '1.25rem',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
                maxWidth: isMobile ? '100%' : '600px'
              }}
            >
              <span style={{ fontSize: isMobile ? '0.938rem' : '1.125rem' }}>
                {isMobile ? 'COMEÇAR AGORA' : 'COMEÇAR MINHA TRANSFORMAÇÃO AGORA'}
              </span>
              <ChevronRight style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>
            
            <p style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: '#bfdbfe',
              marginTop: '1rem',
              padding: '0 1rem'
            }}>
              💳 Sem compromisso. Cancele quando quiser.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          backgroundColor: '#111827',
          color: 'white',
          padding: isMobile ? '2rem 1rem' : '3rem 1rem'
        }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '2rem' : '3rem',
              marginBottom: isMobile ? '2rem' : '3rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Sem Erro</h3>
                <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>
                  O sistema que revoluciona a gestão de operações no Brasil
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Links Rápidos</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#9ca3af' }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.3s' }}
                       onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                       onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
                      Funcionalidades
                    </a>
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <a href="#planos" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.3s' }}
                       onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                       onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
                      Planos
                    </a>
                  </li>
                  <li>
                    <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.3s' }}
                       onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                       onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
                      Suporte
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Contato</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#9ca3af', lineHeight: '2' }}>
                  <li>📧 contato@semerro.com.br</li>
                  <li>📱 (11) 9999-9999</li>
                </ul>
              </div>
            </div>
            
            <div style={{
              borderTop: '1px solid #374151',
              paddingTop: isMobile ? '1.5rem' : '2rem',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#9ca3af',
                marginBottom: '1rem',
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}>
                © 2024 Sem Erro - Todos os direitos reservados
              </p>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'center',
                gap: isMobile ? '0.75rem' : '1.5rem',
                fontSize: '0.875rem',
                color: '#9ca3af'
              }}>
                <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                   onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
                  Política de Privacidade
                </a>
                <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                   onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
                  Termos de Uso
                </a>
                <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                   onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
                  Suporte
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}