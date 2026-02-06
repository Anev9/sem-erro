'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    // Por enquanto, vai sempre para dashboard-aluno
    // Depois você pode mudar para verificar se é admin ou aluno
    router.replace('/dashboard-aluno')
  }, [router])

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '3rem', 
          height: '3rem', 
          borderRadius: '0.75rem', 
          overflow: 'hidden', 
          backgroundColor: 'white',
          marginBottom: '1rem'
        }}>
          <img 
            src="/logo-semerro.jpg" 
            alt="Sem Erro" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        
        <div style={{ 
          width: '50px',
          height: '50px',
          border: '5px solid #e5e7eb',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem'
        }} />
        
        <p style={{ 
          color: '#6b7280', 
          fontSize: '1rem',
          fontWeight: '500'
        }}>
          Redirecionando para o dashboard...
        </p>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
