'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Aluno {
  id: number
  programa: string
  cliente: string
  email: string
  telefone: string
  created_at: string
}

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarAlunos()
  }, [])

  async function buscarAlunos() {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('cliente', { ascending: true })

      if (error) {
        console.error('Erro ao buscar alunos:', error)
        return
      }

      setAlunos(data || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando alunos...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Alunos - SEM ERRO</h1>
      <p className="mb-4">Total de alunos: {alunos.length}</p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Programa</th>
              <th className="border px-4 py-2">Cliente</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td className="border px-4 py-2">{aluno.id}</td>
                <td className="border px-4 py-2">{aluno.programa}</td>
                <td className="border px-4 py-2">{aluno.cliente}</td>
                <td className="border px-4 py-2">{aluno.email}</td>
                <td className="border px-4 py-2">{aluno.telefone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}