'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiSearch, FiChevronLeft, FiChevronRight, FiInfo, FiArrowLeft } from 'react-icons/fi';

export default function ChecklistsFuturos() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft size={20} />
              <span className="text-sm font-medium">Voltar</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Checklists Programados</h1>
              <p className="text-gray-500 mt-1">Gerencie seus checklists recorrentes</p>
            </div>
          </div>
          
          <Link 
            href="/checklist-futuro/criar"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md"
          >
            Criar Novo Checklist
          </Link>
        </div>

        {/* Barra de Pesquisa */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-8">
            {/* Botão Anterior */}
            <button 
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
              aria-label="Anterior"
            >
              <FiChevronLeft size={20} />
            </button>

            {/* Campo de Pesquisa */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Pesquisar checklists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botão Próximo */}
            <button 
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
              aria-label="Próximo"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Aviso Informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <FiInfo className="text-white" size={18} />
            </div>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            Os checklists programados nesta tela serão repetidos conforme a configuração de dias definida. 
            Eles aparecerão automaticamente na tela de checklists agendados, sendo criados durante a 
            madrugada do dia anterior à programação.
          </p>
        </div>

        {/* Lista de Checklists - Área para futura implementação */}
        <div className="mt-6">
          {/* Aqui você pode adicionar a lista de checklists quando tiver os dados */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            <p>Nenhum checklist programado ainda.</p>
            <p className="text-sm mt-2">Clique em "Criar Novo Checklist" para começar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}