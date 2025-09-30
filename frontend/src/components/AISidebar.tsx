import React, { useState } from 'react';

interface AISidebarProps {
  onDiagramGenerated: (diagramJson: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AISidebar: React.FC<AISidebarProps> = ({ onDiagramGenerated, isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<any>(null);

  const handleSendPrompt = async () => {
    setLoading(true);
    setError(null);
    setAiResponse(null);
    try {
      // Llama a tu endpoint de IA (ajusta la URL según tu backend)
      const res = await fetch('/api/canvases/ai/generate-diagram/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error('Error al conectar con la IA');
      const data = await res.json();
      setAiResponse(data);
    } catch (e: any) {
      setError(e.message || 'Error desconocido');
    }
    setLoading(false);
  };

  const handleLoadDiagram = () => {
    if (aiResponse) {
      onDiagramGenerated(aiResponse);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: 380, height: '100vh', background: '#23272a', color: 'white', zIndex: 10010, boxShadow: '-2px 0 12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 18, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Copilot AI Diagram</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>&times;</button>
      </div>
      <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe el diagrama que deseas (ej: 'Un sistema de usuarios y productos relacionados por compras')"
          style={{ width: '100%', minHeight: 90, borderRadius: 6, border: '1px solid #444', background: '#181a1b', color: 'white', padding: 10, fontSize: 15 }}
        />
        <button onClick={handleSendPrompt} disabled={loading || !prompt.trim()} style={{ background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
          {loading ? 'Generando...' : 'Enviar a IA'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {aiResponse && (
          <div style={{ background: '#181a1b', borderRadius: 6, padding: 12, marginTop: 10 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Respuesta de la IA:</div>
            <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(aiResponse, null, 2)}</pre>
            <button onClick={handleLoadDiagram} style={{ marginTop: 10, background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, padding: '8px 0', fontWeight: 600, fontSize: 15, cursor: 'pointer', width: '100%' }}>
              Cargar diagrama
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISidebar;
