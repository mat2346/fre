import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';


export function createCollabRoom(roomId: string, opts: { url?: string } = {}) {
  const url = opts.url || 'ws://localhost:1234';
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(url, roomId, ydoc);
  const ymap = ydoc.getMap('diagram');
  const awareness = provider.awareness;
  return { ydoc, provider, ymap, awareness };
}
