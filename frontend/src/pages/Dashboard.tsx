import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../context/CanvasContext';
import DiagramViewer from '../components/DiagramViewer';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { canvases, loadCanvases, loading, loadCanvas, deleteCanvas } = useCanvas();

  useEffect(() => {
    loadCanvases();
  }, [loadCanvases]);

  const handleLoadCanvas = async (id: string) => {
    await loadCanvas(id);
  };

  const handleDeleteCanvas = async (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este diagrama?')) {
      await deleteCanvas(id);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <header className="py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Diseñador de BD</h1>
          {user && <p>Bienvenido, {user.username}</p>}
        </div>
        <button 
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Mis Diagramas</h2>
          
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <>
              {canvases && canvases.length > 0 ? (
                <ul className="space-y-2">
                  {canvases.map((canvas) => (
                    <li key={canvas.id} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleLoadCanvas(canvas.id)}
                          className="text-left text-blue-600 hover:underline"
                        >
                          {canvas.name}
                        </button>
                        <button
                          onClick={() => handleDeleteCanvas(canvas.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Actualizado: {new Date(canvas.updated_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay diagramas guardados</p>
              )}
            </>
          )}
        </div>
        
        <div className="col-span-9">
          <DiagramViewer />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
