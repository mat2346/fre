import React, { useEffect } from 'react';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import TableSidebar from './TableSidebar';
import CustomNode from './CustomNode';
import ContextMenu from './ContextMenu';
import NewTableMenu from './NewTableMenu';
import AttributeModal from './AttributeModal';
import TopBar from './TopBar';

import EntityInheritanceForm from './EntityInheritanceForm';
import RelationshipForm from './RelationshipForm';
import RelationshipEdge from './RelationshipEdge';
import useDiagram from '../hooks/useDiagram';
import ExportUtil from '../utils/ExportUtil';
import ExportModal from './ExportModal';
import { saveAs } from 'file-saver';
import type { TableEntity } from '../types';
import { RELATION_TYPES } from '../constants';
import { useCanvas } from '../context/CanvasContext';
import { useAuth } from '../context/AuthContext';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { relationship: RelationshipEdge };

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export const DiagramViewer = () => {
  const { currentCanvas, loadCanvases, createCanvas, updateCanvas, canvases, loadCanvas } = useCanvas();
  const { logout } = useAuth();
  // Usar hook que contiene la lógica del diagrama
  const diagram = useDiagram(initialNodes, initialEdges);
 
  // Nuevo estado para el nodo seleccionado
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  const [showExportModal, setShowExportModal] = React.useState(false);
  const [diagramName, setDiagramName] = React.useState('Nuevo Diagrama');
  const [savedDiagramId, setSavedDiagramId] = React.useState<string | null>(null);
  const [showCanvasList, setShowCanvasList] = React.useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [saveProjectName, setSaveProjectName] = React.useState('');
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);

  // Estado para cargar por código
  const [joinCode, setJoinCode] = React.useState('');
  const [joinError, setJoinError] = React.useState('');
  const [joinLoading, setJoinLoading] = React.useState(false);
  const [joinCanvasInfo, setJoinCanvasInfo] = React.useState<{name?: string, owner?: string, join_code?: string} | null>(null);

  // Cargar diagramas al montar el componente
  useEffect(() => {
    loadCanvases();
  }, [loadCanvases]); // Agregar loadCanvases como dependencia para evitar warnings

  // Cargar el canvas actual cuando cambie
  useEffect(() => {
    if (currentCanvas) {
      console.log('Canvas cargado:', currentCanvas);
      console.log('Código colaborativo (join_code):', (currentCanvas as any).join_code);
      diagram.loadDiagramData(currentCanvas);
      setDiagramName(currentCanvas.name);
      setSavedDiagramId(currentCanvas.id);
    }
  }, [currentCanvas]); // removed `diagram` to prevent repeated loads and render loops

  // Handler para crear nuevo proyecto
  const handleNewProject = () => {
    setNewProjectName('');
    setShowNewProjectModal(true);
  };

  // Confirmar creación de nuevo proyecto
  const handleConfirmNewProject = async () => {
    if (newProjectName.trim()) {
      const name = newProjectName.trim();
      setDiagramName(name);
      // Construir diagrama vacío para crear en backend
      const diagramData = {
        id: `diagram-${Date.now()}`,
        name: name,
        lastModified: new Date(),
        tables: [],
        relations: [],
      };

      try {
        // Intentar crear en el backend y obtener el id
        const newId = await createCanvas(name, diagramData);
        if (newId) {
          // Asegurar que el diagrama local tenga el id del backend
          const loadedData = { ...diagramData, id: newId };
          setSavedDiagramId(newId);
          diagram.loadDiagramData(loadedData);
          setShowNewProjectModal(false);
          // Mostrar modal de éxito para confirmación visual
          setShowSaveSuccess(true);
        } else {
          // Si no se devolvió id, cargar localmente pero avisar
          diagram.loadDiagramData(diagramData);
          setShowNewProjectModal(false);
          alert('Proyecto creado localmente, pero no se pudo guardar en el servidor. Revisa tu conexión o inicia sesión.');
        }
      } catch (err) {
        console.error('Error creating new project on backend:', err);
        // Cargar localmente para no bloquear al usuario
        diagram.loadDiagramData(diagramData);
        setShowNewProjectModal(false);
        alert('No se pudo crear el proyecto en el servidor. Se ha creado localmente.');
      }
    }
  };

  // Handler para guardar el diagrama actual
  const handleSaveDiagram = async () => {
    let currentName = diagramName;
    if (!currentName || currentName === 'Nuevo Diagrama') {
      setSaveProjectName('');
      setShowSaveModal(true);
      return;
    }

    // Crear estructura de datos para guardar
    const diagramData = {
      id: savedDiagramId || `diagram-${Date.now()}`,
      name: currentName,
      lastModified: new Date(),
      tables: diagram.nodes.map(node => ({
        id: node.id,
        name: node.data.label,
        attributes: node.data.attributes || [],
        position: node.position,
        isAbstract: node.data.isAbstract || false,
        inheritanceType: node.data.inheritanceType || null,
        discriminatorColumn: node.data.discriminatorColumn || null,
        discriminatorType: node.data.discriminatorType || null,
        discriminatorValue: node.data.discriminatorValue || null,
        parentTable: node.data.parentTable || null,
      })),
      relations: diagram.edges.map(edge => ({
        id: edge.id,
        sourceTableId: edge.source,
        targetTableId: edge.target,
        sourceAttribute: edge.data?.sourceAttribute || '',
        targetAttribute: edge.data?.targetAttribute || '',
        relationType: edge.data?.relationType || RELATION_TYPES.ONE_TO_MANY,
        name: edge.data?.name || '',
        fetchType: edge.data?.fetchType || 'LAZY',
        optional: edge.data?.optional !== false,
      })),
    };
    
    try {
      if (savedDiagramId) {
        // Actualizar diagrama existente
        await updateCanvas(savedDiagramId, currentName, diagramData);
      } else {
        // Crear nuevo diagrama
        const newId = await createCanvas(currentName, diagramData);
        if (newId) {
          setSavedDiagramId(newId);
        }
      }
      setDiagramName(currentName);
      // Mostrar modal de éxito en lugar de alert
      setShowSaveSuccess(true);
    } catch (error) {
      console.error('Error saving diagram:', error);
      alert('Error al guardar el diagrama');
    }
  };

  // Confirmar guardado con nombre
  const handleConfirmSave = async () => {
    if (saveProjectName.trim()) {
      const name = saveProjectName.trim();
      setDiagramName(name);

      // Crear estructura de datos para guardar
      const diagramData = {
        id: savedDiagramId || `diagram-${Date.now()}`,
        name: name,
        lastModified: new Date(),
        tables: diagram.nodes.map(node => ({
          id: node.id,
          name: node.data.label,
          attributes: node.data.attributes || [],
          position: node.position,
          isAbstract: node.data.isAbstract || false,
          inheritanceType: node.data.inheritanceType || null,
          discriminatorColumn: node.data.discriminatorColumn || null,
          discriminatorType: node.data.discriminatorType || null,
          discriminatorValue: node.data.discriminatorValue || null,
          parentTable: node.data.parentTable || null,
        })),
        relations: diagram.edges.map(edge => ({
          id: edge.id,
          sourceTableId: edge.source,
          targetTableId: edge.target,
          sourceAttribute: edge.data?.sourceAttribute || '',
          targetAttribute: edge.data?.targetAttribute || '',
          relationType: edge.data?.relationType || RELATION_TYPES.ONE_TO_MANY,
          name: edge.data?.name || '',
          fetchType: edge.data?.fetchType || 'LAZY',
          optional: edge.data?.optional !== false,
        })),
      };
      
      try {
        if (savedDiagramId) {
          // Actualizar diagrama existente
          await updateCanvas(savedDiagramId, name, diagramData);
        } else {
          // Crear nuevo diagrama
          const newId = await createCanvas(name, diagramData);
          if (newId) {
            setSavedDiagramId(newId);
          }
        }
        setShowSaveSuccess(true);
      } catch (error) {
        console.error('Error saving diagram:', error);
        alert('Error al guardar el diagrama');
      }
      setShowSaveModal(false);
    }
  };

  // Handler para exportar
  const handleExport = () => {
    setShowExportModal(true);
  };

  // Handler para configurar herencia (ahora acepta Partial<TableEntity>)
  const handleConfigureInheritance = (updatedTable: Partial<TableEntity>) => {
    diagram.setNodes(nodes =>
      nodes.map(node =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...updatedTable,
              },
            }
          : node
      )
    );
    diagram.closeAllOverlays();
  };

  // Escuchar click derecho en canvas; abrir menú de nueva tabla en coords relativas
  const handleCanvasContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Si hay un menú de nodo abierto, al hacer click derecho en vacío lo cerramos (comportamiento esperado)
    if (diagram.contextMenu) {
      diagram.closeAllOverlays();
      return;
    }

    const canvasContainer = event.currentTarget as HTMLElement;
    const rect = canvasContainer.getBoundingClientRect();
    let relX = event.clientX - rect.left;
    let relY = event.clientY - rect.top;

    if (diagram.isMobile) {
      const menuWidth = 220;
      const menuHeight = 120;
      if (relX + menuWidth > rect.width) relX = rect.width - menuWidth - 10;
      if (relY + menuHeight > rect.height) relY = rect.height - menuHeight - 10;
    }

    diagram.openNewTableMenuAt(relX, relY);
  };

  // Aplicar cambios mundanos de React Flow sobre nodos/aristas
  const handleNodesChange = (changes: any) => {
    diagram.setNodes((nds: Node[]) => applyNodeChanges(changes, nds));
  };
  const handleEdgesChange = (changes: any) => {
    diagram.setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds));
  };

  // Handler para cargar un diagrama desde la lista
  const handleLoadDiagram = async (canvasId: string) => {
    const success = await loadCanvas(canvasId);
    if (success) {
      // El useEffect se encargará de cargar el diagrama
    }
  };

  // Función para cargar diagrama por código
  const handleJoinByCode = async () => {
    setJoinError('');
    setJoinLoading(true);
    setJoinCanvasInfo(null);
    if (!joinCode.trim()) {
      setJoinError('Debes ingresar un código');
      setJoinLoading(false);
      return;
    }
    try {
      console.log('Enviando petición al backend:', `/api/canvases/join?code=${joinCode.trim()}`);
      const res = await fetch(`/api/canvases/join?code=${joinCode.trim()}`);
      console.log('Respuesta recibida:', res);
      if (res.ok) {
        const canvas = await res.json();
        console.log('Canvas recibido del backend:', canvas);
        diagram.loadDiagramData(canvas.data);
        setDiagramName(canvas.name);
        setSavedDiagramId(canvas.id);
        setJoinCanvasInfo({ name: canvas.name, owner: canvas.owner, join_code: canvas.join_code });
      } else {
        setJoinError('No se encontró el diagrama con ese código');
        console.log('No se encontró el diagrama con ese código');
      }
    } catch (e) {
      setJoinError('Error al conectar');
      console.log('Error al conectar:', e);
    }
    setJoinLoading(false);
  };

  // Handler para cargar diagrama por join_code desde TopBar
  const handleJoinCanvas = (canvas: any) => {
    if (canvas) {
      // Cargar el diagrama recibido (estructura igual que loadCanvas)
      diagram.loadDiagramData(canvas.data || canvas);
      setDiagramName(canvas.name);
      setSavedDiagramId(canvas.id);
    }
  };

  // Escuchar evento global de 401 emitido por api.ts y mostrar aviso modal
  React.useEffect(() => {
    const onAuthUnauthorized = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      const info = detail?.url ? `La petición a ${detail.url} fue rechazada (401).` : 'Acceso no autorizado (401). Inicia sesión.';
      // Mostrar modal ligero
      setShowSaveSuccess(false); // cerrar otros modales si hay
      // reusar showSaveModal para mantener sencillo (usar un modal específico sería mejor)
      setShowSaveModal(true);
      setSaveProjectName(info);
    };
    window.addEventListener('auth:unauthorized', onAuthUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onAuthUnauthorized);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#232323', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
      <TopBar
        isMobile={diagram.isMobile}
        onToggleSidebar={() => diagram.setSidebarVisible(!diagram.sidebarVisible)}
        onExport={handleExport}
        onValidate={diagram.validateDiagram}
        onSaveProject={handleSaveDiagram}
        onLoadProject={() => setShowCanvasList(true)}
        onLogout={logout}
        onNewProject={handleNewProject}
        onJoinCanvas={handleJoinCanvas}
      />

      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {diagram.isMobile && diagram.sidebarVisible && 
          <div 
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 10003 }} 
            onClick={() => diagram.setSidebarVisible(false)} 
          />
        }

        <TableSidebar 
          tables={diagram.nodes.map(n => ({ id: n.id, label: n.data.label, attributes: n.data.attributes || [] }))} 
          onToggle={diagram.setSidebarVisible} 
          isMobile={diagram.isMobile} 
          isVisible={diagram.sidebarVisible} 
        />

        <div style={{ width: diagram.isMobile ? (diagram.sidebarVisible ? 'calc(100vw - 280px)' : '100vw') : `calc(100vw - ${diagram.sidebarVisible ? '260px' : '40px'})`, height: diagram.isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 120px)', position: 'relative', marginLeft: diagram.isMobile ? (diagram.sidebarVisible ? '280px' : '0px') : (diagram.sidebarVisible ? '260px' : '40px'), transition: 'width 0.3s ease, margin-left 0.3s ease' }}>
          <div 
            style={{ width: '100%', height: '100%', position: 'relative' }} 
            onContextMenu={handleCanvasContextMenu} 
            onClick={(e) => { 
              if (e.target === e.currentTarget) {
                diagram.closeAllOverlays();
              }
            }}
          >
            <ReactFlow
              nodes={diagram.nodes}
              edges={diagram.edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={diagram.onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
            >
              <Controls />
              <Background />
              <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
                <defs>
                  <marker
                    id="arrowhead"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerUnits="strokeWidth"
                    markerWidth="8"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
                  </marker>
                </defs>
              </svg>
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Input para cargar diagrama colaborativo por código */}
      <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          placeholder="Código de diagrama para unirse"
          style={{ padding: 8, borderRadius: 4, border: '1px solid #555', minWidth: 220 }}
        />
        <button onClick={handleJoinByCode} disabled={joinLoading} style={{ padding: '8px 16px', background: '#2196f3', color: 'white', border: 'none', borderRadius: 4 }}>
          {joinLoading ? 'Cargando...' : 'Unirse'}
        </button>
        {joinError && <span style={{ color: 'red', marginLeft: 8 }}>{joinError}</span>}
        {joinCanvasInfo && (
          <span style={{ color: '#4caf50', marginLeft: 12 }}>
            Diagrama cargado: <b>{joinCanvasInfo.name}</b> (Propietario: {joinCanvasInfo.owner})<br />
            Código: <b>{joinCanvasInfo.join_code}</b>
          </span>
        )}
      </div>

      {/* Mostrar código colaborativo del diagrama actual para compartir */}
      {currentCanvas && (currentCanvas as any).join_code && (
        <div style={{ margin: '18px 0', padding: '12px', background: '#23272a', color: '#fff', borderRadius: '6px', fontSize: '1.05rem', display: 'inline-block' }}>
          <span>Comparte este código para colaboración:&nbsp;</span>
          <b style={{ color: '#4caf50', fontSize: '1.15rem' }}>{(currentCanvas as any).join_code}</b>
        </div>
      )}

      {/* Show modals */}
      {diagram.contextMenu && (
        <ContextMenu
          x={diagram.contextMenu.x}
          y={diagram.contextMenu.y}
          node={diagram.nodes.find(n => n.id === diagram.contextMenu?.nodeId)}
          onDelete={(nodeId?: string) => {
            const id = nodeId || diagram.contextMenu?.nodeId || '';
            diagram.deleteNode(id);
            diagram.closeAllOverlays();
          }}
          onAddAttribute={(nodeId?: string) => {
            const id = nodeId || diagram.contextMenu?.nodeId || null;
            setSelectedNodeId(id);
            diagram.openAttributeModal();
          }}
          onConfigureInheritance={(nodeId?: string) => {
            const id = nodeId || diagram.contextMenu?.nodeId || null;
            setSelectedNodeId(id);
            diagram.openInheritanceForm();
          }}
          onAddRelation={(nodeId?: string) => {
            const originId = nodeId || diagram.contextMenu?.nodeId || '';
            diagram.setSelectedRelation({ sourceTableId: originId } as any);
            diagram.setShowRelationForm(true);
          }}
          onClose={() => diagram.closeAllOverlays()}
        />
      )}

      {diagram.newTableMenu && (
        <NewTableMenu
          x={diagram.newTableMenu.x}
          y={diagram.newTableMenu.y}
          onTableNameSubmit={(tableName: string) => {
            diagram.addNode(tableName);
            diagram.closeAllOverlays();
          }}
          onCancel={diagram.closeAllOverlays}
        />
      )}

      {diagram.showAttributeModal && selectedNodeId && (
        <AttributeModal
          isMobile={diagram.isMobile}
          visible={diagram.showAttributeModal}
          name={diagram.currentAttribute.name}
          setName={(name: string) => diagram.updateAttributeField('name', name)}
          type={diagram.currentAttribute.type}
          setType={(type: string) => diagram.updateAttributeField('type', type)}
          isPrimaryKey={!!diagram.currentAttribute.isPrimaryKey}
          setIsPrimaryKey={(isPk: boolean) => diagram.updateAttributeField('isPrimaryKey', isPk)}
          onCancel={diagram.closeAllOverlays}
          onConfirm={() => {
            diagram.addAttributeToNode({
              ...diagram.currentAttribute,
              nodeId: selectedNodeId
            });
            diagram.closeAllOverlays();
          }}
        />
      )}

      {diagram.showInheritanceForm && selectedNodeId && (
        <EntityInheritanceForm
          visible={diagram.showInheritanceForm}
          isMobile={diagram.isMobile}
          tables={diagram.nodes.filter(n => n.id !== selectedNodeId).map(n => ({
            id: n.id,
            name: n.data.label,
            attributes: n.data.attributes || []
          }))}
          selectedTable={diagram.nodes.find(n => n.id === selectedNodeId)?.data || { id: '', name: '' }}
          onSave={handleConfigureInheritance}
          onCancel={diagram.closeAllOverlays}
        />
      )}

      {diagram.showRelationForm && (
        <RelationshipForm
          visible={diagram.showRelationForm}
          isMobile={diagram.isMobile}
          tables={diagram.nodes.map(n => ({
            id: n.id,
            name: n.data.label,
            attributes: n.data.__rawAttributes ? n.data.__rawAttributes : (n.data.attributes || []).map((a: any) => {
              // Si el atributo es string, intentar extraer el nombre antes de ':'
              if (typeof a === 'string') {
                const parts = a.split(':');
                return { name: parts[0].trim() };
              }
              return a;
            })
          }))}
          onSave={diagram.handleSaveRelation}
          onCancel={diagram.closeAllOverlays}
          initialRelation={diagram.selectedRelation || diagram.edges.find(e => e.id === diagram.selectedEdgeId)?.data}
        />
      )}

      {showExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <ExportModal
              visible={showExportModal}
              onClose={() => setShowExportModal(false)}
              onExportJSON={() => {
                const json = ExportUtil.toJSON(diagram.diagramData);
                const blob = new Blob([json], { type: 'application/json' });
                saveAs(blob, `${diagram.diagramData.name.replace(/\s+/g, '_')}.json`);
                setShowExportModal(false);
              }}
              onExportSQL={(dbType: string) => {
                // Generar SQL para todas las tablas
                const sqlStatements = diagram.diagramData.tables.map(table => 
                  ExportUtil.generateTableSQL(table, dbType)
                ).join('\n\n');
                
                const blob = new Blob([sqlStatements], { type: 'text/plain' });
                saveAs(blob, `${diagram.diagramData.name.replace(/\s+/g, '_')}_${dbType.toLowerCase()}.sql`);
                setShowExportModal(false);
              }}
              onExportJava={() => {
                try {
                  // Usar SpringBootExporter para generar un proyecto completo
                  const projectData = {
                    tables: diagram.diagramData.tables,
                    relations: diagram.diagramData.relations,
                    name: diagram.diagramData.name || 'SpringBootProject'
                  };
                  
                  // Generar y descargar el proyecto completo
                  import('../utils/SpringBootExporter').then(module => {
                    const SpringBootExporter = module.default;
                    // Mostrar mensaje de proceso
                    alert("Generando proyecto Spring Boot completo. Se descargará automáticamente cuando esté listo.");
                    SpringBootExporter.generateProject(projectData)
                      .then(content => {
                        saveAs(content, `${diagram.diagramData.name.replace(/\s+/g, '_')}_springboot.zip`);
                        setShowExportModal(false);
                        // Mensaje de éxito
                        setTimeout(() => {
                          alert("¡Proyecto Spring Boot generado con éxito! El proyecto incluye:\n- Entidades JPA\n- Repositorios\n- Controladores REST\n- Configuración CORS y Swagger\n- Build system (Gradle)");
                        }, 500);
                      })
                      .catch(err => {
                        console.error('Error generando proyecto Spring Boot:', err);
                        alert('Error al generar el proyecto Spring Boot: ' + (err.message || err));
                      });
                  });
                } catch (error) {
                  console.error('Error al exportar:', error);
                  alert('Error al generar los archivos Java');
                }
              }}
            />
          </div>
        </div>
      )}

      {showCanvasList && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#1f2428',
            color: '#fff',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '520px',
            width: '92%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.1rem' }}>Seleccionar Canvas</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '48vh', overflowY: 'auto' }}>
              {canvases.map(canvas => (
                <li key={canvas.id} style={{ margin: '10px 0' }}>
                  <button 
                    onClick={() => {
                      handleLoadDiagram(canvas.id);
                      setShowCanvasList(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#2b3136',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{canvas.name}</span>
                      <small style={{ color: '#aab4bf' }}>{new Date(canvas.created_at).toLocaleDateString()}</small>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button 
                onClick={() => setShowCanvasList(false)}
                style={{ padding: '10px 20px', background: 'transparent', color: '#c7cbd0', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewProjectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#1f2428',
            color: '#fff',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '420px',
            width: '92%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.05rem' }}>Crear Nuevo Proyecto</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nombre del proyecto"
              style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: '#23272a', color: '#fff' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowNewProjectModal(false)}
                style={{ padding: '10px 20px', background: 'transparent', color: '#c7cbd0', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmNewProject}
                style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#1f2428',
            color: '#fff',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.05rem' }}>Guardar Proyecto</h3>
            <input
              type="text"
              value={saveProjectName}
              onChange={(e) => setSaveProjectName(e.target.value)}
              placeholder="Nombre del proyecto"
              style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: '#23272a', color: '#fff' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowSaveModal(false)}
                style={{ padding: '10px 20px', background: 'transparent', color: '#c7cbd0', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmSave}
                style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: '#101217',
            color: '#e6f0ff',
            padding: '22px',
            borderRadius: '10px',
            maxWidth: '380px',
            width: '90%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.03)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, marginBottom: '8px' }}>Diagrama guardado</h3>
            <p style={{ margin: 0, color: '#bcd0ff' }}>{diagramName} se guardó correctamente.</p>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={() => setShowSaveSuccess(false)} style={{ padding: '8px 18px', background: '#2b3136', color: '#fff', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', cursor: 'pointer' }}>Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagramViewer;
