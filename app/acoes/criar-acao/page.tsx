'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CriarAcao() {
  const router = useRouter();
  const [formulario, setFormulario] = useState({
    urgente: false,
    descricao: '',
    responsavel: '',
    desejadoPara: '',
    orcamento: '',
    valorPago: '',
    loja: '',
    observacoes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dados da ação:', formulario);
    alert('Ação criada com sucesso!');
    router.push('/acoes');
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormulario({ ...formulario, [field]: value });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Card do Formulário */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          
          {/* Título */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#333', margin: '0 0 0.5rem 0' }}>
              Criando
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#666', margin: 0 }}>
              Tarefa(Ação)
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Urgente? */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formulario.urgente}
                  onChange={(e) => handleChange('urgente', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>
                  Urgente?
                </span>
              </label>
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Descrição
              </label>
              <input
                type="text"
                value={formulario.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Responsável */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Responsável
              </label>
              <input
                type="text"
                value={formulario.responsavel}
                onChange={(e) => handleChange('responsavel', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Desejado para */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Desejado para
              </label>
              <input
                type="date"
                value={formulario.desejadoPara}
                onChange={(e) => handleChange('desejadoPara', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Orçamento */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Orçamento
              </label>
              <input
                type="text"
                value={formulario.orcamento}
                onChange={(e) => handleChange('orcamento', e.target.value)}
                placeholder="R$ 0,00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Valor pago */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Valor pago
              </label>
              <input
                type="text"
                value={formulario.valorPago}
                onChange={(e) => handleChange('valorPago', e.target.value)}
                placeholder="R$ 0,00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Loja */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Loja
              </label>
              <input
                type="text"
                value={formulario.loja}
                onChange={(e) => handleChange('loja', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Observações */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Observações?
              </label>
              <textarea
                value={formulario.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => router.push('/acoes')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2196F3',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Voltar à lista
              </button>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem 2.5rem',
                  borderRadius: '0.5rem',
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
                Criar
              </button>
            </div>
          </form>

          {/* Assinatura */}
          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#ef5350', fontWeight: '600' }}>
             
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}