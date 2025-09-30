import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import type { DiagramData } from '../types';
import { canvasService } from '../services/api';

interface CanvasContextType {
  canvases: CanvasListItem[];
  currentCanvas: DiagramData | null;
  loading: boolean;
  error: string | null;
  loadCanvases: () => Promise<CanvasListItem[]>;
  loadCanvas: (id: string) => Promise<boolean>;
  createCanvas: (name: string, data: DiagramData) => Promise<string | null>;
  updateCanvas: (id: string, name: string, data: DiagramData) => Promise<boolean>;
  deleteCanvas: (id: string) => Promise<boolean>;
}

interface CanvasListItem {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

interface CanvasProviderProps {
  children: ReactNode;
}

export const CanvasProvider = ({ children }: CanvasProviderProps) => {
  const [canvases, setCanvases] = useState<CanvasListItem[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<DiagramData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadCanvases = useCallback(async () => {
    if (isLoadingRef.current) return [];
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await canvasService.getAll();
      // El endpoint puede devolver [] si no está autenticado en desarrollo
      const data = Array.isArray(response.data) ? response.data : [];
      setCanvases(data);
      return data;
    } catch (err) {
      console.error('Error loading canvases:', err);
      setError('Failed to load canvases');
      return [];
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  const loadCanvas = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await canvasService.getById(id);
      // respuesta esperada: { id, owner, name, data, join_code, ... }
      const payload = response.data;
      // Guardar join_code en localStorage si existe
      if (payload.join_code) {
        localStorage.setItem('join_code', payload.join_code);
      }
      setCurrentCanvas(payload.data || payload);
      return true;
    } catch (err) {
      console.error('Error loading canvas:', err);
      setError('Failed to load canvas');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCanvas = useCallback(async (name: string, data: DiagramData): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await canvasService.create(name, data);
      const payload = response.data;
      setCanvases(prev => [...prev, payload]);
      return payload.id;
    } catch (err) {
      console.error('Error creating canvas:', err);
      setError('Failed to create canvas');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCanvas = useCallback(async (id: string, name: string, data: DiagramData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await canvasService.update(id, name, data);
      if (currentCanvas && (currentCanvas as any).id === id) {
        setCurrentCanvas({ ...data, id, name } as DiagramData);
      }
      setCanvases(prev => prev.map(c => c.id === id ? { ...c, name, updated_at: new Date().toISOString() } : c));
      return true;
    } catch (err) {
      console.error('Error updating canvas:', err);
      setError('Failed to update canvas');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentCanvas]);

  const deleteCanvas = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await canvasService.delete(id);
      if (currentCanvas && (currentCanvas as any).id === id) {
        setCurrentCanvas(null);
      }
      setCanvases(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting canvas:', err);
      setError('Failed to delete canvas');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentCanvas]);

  return (
    <CanvasContext.Provider
      value={{
        canvases,
        currentCanvas,
        loading,
        error,
        loadCanvases,
        loadCanvas,
        createCanvas,
        updateCanvas,
        deleteCanvas,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};
