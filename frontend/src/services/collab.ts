import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';


export function createCollabRoom(roomId: string, opts: { url?: string } = {}) {
  const url = opts.url || 'ws://localhost:1234';
  console.log('🚀 Creando room de colaboración:', { roomId, url });
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(url, roomId, ydoc);
  const ymap = ydoc.getMap('diagram');
  const awareness = provider.awareness;
  
  // Listeners para debugging
  provider.on('status', ({ status }: { status: string }) => {
    console.log(`📡 WebSocket status para room "${roomId}":`, status);
    if (status === 'disconnected') {
      console.warn('⚠️ WebSocket desconectado. Asegúrate de que el servidor esté corriendo con: npm run collab');
    }
  });
  
  provider.on('sync', (isSynced: boolean) => {
    console.log(`🔄 Sincronización ${isSynced ? 'completada' : 'en progreso'} para room "${roomId}"`);
  });
  
  provider.on('connection-close', () => {
    console.warn('🔌 Conexión WebSocket cerrada');
  });
  
  provider.on('connection-error', (error: any) => {
    console.error('❌ Error de conexión WebSocket:', error);
    console.warn('💡 Solución: Ejecuta "npm run collab" en otra terminal para iniciar el servidor');
  });
  
  return { ydoc, provider, ymap, awareness };
}
