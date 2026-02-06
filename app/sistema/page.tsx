export default function SistemaPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sistema - SEM ERRO</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Checklists</h2>
            <p className="text-gray-600">Gerencie seus checklists</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Templates</h2>
            <p className="text-gray-600">Acesse templates prontos</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Relatórios</h2>
            <p className="text-gray-600">Visualize relatórios</p>
          </div>
        </div>
      </div>
    </div>
  )
}