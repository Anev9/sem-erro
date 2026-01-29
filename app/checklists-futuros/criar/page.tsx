'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function CriarChecklistFuturo() {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('modelo');
  const [proximaExecucao, setProximaExecucao] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('');
  const [campo1, setCampo1] = useState('');
  const [campo2, setCampo2] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementa a lógica de criação do checklist
    console.log({
      opcaoSelecionada,
      proximaExecucao,
      tipoNegocio,
      campo1,
      campo2
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Botão Voltar */}
        <Link 
          href="/checklist-futuro"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <FiArrowLeft size={20} />
          <span className="text-sm font-medium">Voltar para Checklists Programados</span>
        </Link>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Criando novo checklist que vai acontecer no futuro
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Recorrente</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Opções de Criação */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="opcao"
                  value="modelo"
                  checked={opcaoSelecionada === 'modelo'}
                  onChange={(e) => setOpcaoSelecionada(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Copiar um modelo do pronto pra mim</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="opcao"
                  value="manual"
                  checked={opcaoSelecionada === 'manual'}
                  onChange={(e) => setOpcaoSelecionada(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Fazer do meu jeito</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="opcao"
                  value="chave"
                  checked={opcaoSelecionada === 'chave'}
                  onChange={(e) => setOpcaoSelecionada(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Usar uma chave</span>
              </label>
            </div>

            {/* Próxima Execução */}
            <div>
              <label htmlFor="proximaExecucao" className="block text-gray-700 font-medium mb-2">
                Próxima execução
              </label>
              <input
                type="date"
                id="proximaExecucao"
                value={proximaExecucao}
                onChange={(e) => setProximaExecucao(e.target.value)}
                placeholder="dd/mm/aaaa"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tipo de Negócio */}
            <div>
              <select
                value={tipoNegocio}
                onChange={(e) => setTipoNegocio(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione o tipo de negocio</option>
                <option value="supermercado">Supermercado</option>
                <option value="atacado">Atacado</option>
                <option value="varejo">Varejo</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {/* Campos Adicionais */}
            <div>
              <input
                type="text"
                value={campo1}
                onChange={(e) => setCampo1(e.target.value)}
                placeholder="Nome do checklist"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <textarea
                value={campo2}
                onChange={(e) => setCampo2(e.target.value)}
                placeholder="Descrição ou observações"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Botão Criar */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md"
            >
              Criar
            </button>

            {/* Texto Informativo */}
            <p className="text-gray-600 text-sm italic leading-relaxed pt-4">
              Nessa tela você cria uma programação de checklists que ocorrerão frequentemente. 
              Você pode usar um modelo pronto ou fazer do seu próprio jeito. Para fazer um do seu jeito 
              clique em criar manualmente.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}