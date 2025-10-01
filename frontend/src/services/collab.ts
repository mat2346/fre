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
  });
  
  provider.on('sync', (isSynced: boolean) => {
    console.log(`🔄 Sincronización ${isSynced ? 'completada' : 'en progreso'} para room "${roomId}"`);
  });
  
  return { ydoc, provider, ymap, awareness };
}
