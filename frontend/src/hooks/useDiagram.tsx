import React from 'react';
import type { Node, Edge } from 'reactflow';
import { addEdge } from 'reactflow';
import type { Attribute, DiagramData, TableEntity, Relation, ExportOptions, ValidationError } from '../types';
import { ATTRIBUTE_TYPES, MOBILE_BREAKPOINT, RELATION_TYPES, } from '../constants';
import ExportUtil from '../utils/ExportUtil';
import ValidationHelper from '../utils/ValidationHelper';
import { createCollabRoom } from '../services/collab';
import debounce from 'lodash.debounce';

// Hook que encapsula el estado y la lógica del diagrama (nodos, aristas, menús, modal, etc.)
export default function useDiagram(initialNodes: Node[] = [], initialEdges: Edge[] = []) {
  // Estados principales de React Flow
  const [nodes, setNodes] = React.useState<Node[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);

  // Referencia a la instancia de React Flow para proyectar coordenadas
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);

  // Estado del diagrama ER (tablas, relaciones)
  const [diagramData, setDiagramData] = React.useState<DiagramData>({
    id: `diagram-${Date.now()}`,
    name: 'Nuevo Diagrama',
    tables: [],
    relations: [],
    lastModified: new Date()
  });

  // Estados de UI: menús contextuales, modal de atributos, sidebar, etc.
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; nodeId: string | null } | null>(null);
  const [newTableMenu, setNewTableMenu] = React.useState<{ x: number; y: number } | null>(null);
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null);

  
  // Estado para el atributo actual en edición
  const [currentAttribute, setCurrentAttribute] = React.useState<Attribute>({
    name: '',
    type: ATTRIBUTE_TYPES[0],
    isPrimaryKey: false,
    isNullable: true,
    isUnique: false
  });

  // Estado de UI para relación y herencia
  const [showInheritanceForm, setShowInheritanceForm] = React.useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = React.useState(false);
  const [showAttributeModal, setShowAttributeModal] = React.useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
  
  // Estados para otros formularios y relaciones
  const [showRelationForm, setShowRelationForm] = React.useState(false);
  const [showExportForm, setShowExportForm] = React.useState(false);
  const [selectedRelation, setSelectedRelation] = React.useState<Relation | null>(null);
  
  // Visibilidad de la barra lateral
  const [sidebarVisible, setSidebarVisible] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState<boolean>(window.innerWidth < MOBILE_BREAKPOINT);
  
  // Estado para el nombre de nueva tabla (usado en createTableAt)
  const [newTableName, setNewTableName] = React.useState('');
  
  // Estados para validación (utilizados por la función validateDiagram)
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
  const [showValidationPanel, setShowValidationPanel] = React.useState(false);

  React.useEffect(() => {
    // Ajusta el estado isMobile cuando cambia el tamaño de ventana
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile && sidebarVisible) setSidebarVisible(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [sidebarVisible]);
  
  // Inicializar el modelo de datos con los nodos iniciales (un solo useEffect, eliminado duplicado)
  React.useEffect(() => {
    if (!initialNodes || initialNodes.length === 0) return;

    console.log("Inicializando modelo de datos con nodos iniciales (efecto único):", initialNodes);

    try {
      const initialTables = initialNodes.map(node => ({
        id: node.id,
        name: node.data?.label || 'Tabla',
        attributes: [], // Inicialmente sin atributos
        position: { x: node.position?.x || 0, y: node.position?.y || 0 }
      }));

      setDiagramData(prev => ({
        ...prev,
        tables: initialTables
      }));
    } catch (err) {
      console.error('Error inicializando tablas desde initialNodes:', err);
    }
  }, [initialNodes]);

  // Conectar aristas en React Flow
  const onConnect = React.useCallback((params: Edge | any) => {
    console.log("Conexión manual iniciada con params:", params);
    // Asegurarnos de que los handles estén definidos
    if (!params.sourceHandle) {
      params.sourceHandle = "right"; // Valor por defecto si no se especifica
      console.log("sourceHandle indefinido, usando 'right' por defecto");
    }
    
    if (!params.targetHandle) {
      params.targetHandle = "left"; // Valor por defecto si no se especifica
      console.log("targetHandle indefinido, usando 'left' por defecto");
    }
    
    // Crear una nueva arista con el tipo "relationship"
    const newEdgeParams = {
      ...params,
      type: 'relationship',
      data: { 
        type: RELATION_TYPES.ONE_TO_MANY,
        label: 'Relación'
      }
    };
    
    console.log("Creando arista con params:", newEdgeParams);
    try {
      const maybeEdges = addEdge(newEdgeParams, edges);
      // addEdge puede devolver un array completo o una sola arista dependiendo de la versión
      if (Array.isArray(maybeEdges)) {
        setEdges(maybeEdges);
      } else if (maybeEdges) {
        setEdges(prev => Array.isArray(prev) ? [...prev, maybeEdges] : [maybeEdges]);
      } else {
        // Fallback: si addEdge no devuelve nada, intentamos crear la arista manualmente
        const fallbackEdge = { ...newEdgeParams, id: `edge-${Date.now()}` };
        setEdges(prev => [...prev, fallbackEdge]);
      }
    } catch (err) {
      console.error('Error añadiendo arista con addEdge:', err);
      // Crear la arista de manera manual como fallback
      const fallbackEdge = { ...newEdgeParams, id: `edge-${Date.now()}` };
      setEdges(prev => [...prev, fallbackEdge]);
    }
    
    // Abrir formulario de relación
    setShowRelationForm(true);
    
    // Guardar información sobre la relación que se está creando
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    if (sourceNode && targetNode) {
      // Crear una relación provisional
      const newRelation: Partial<Relation> = {
        id: `rel-${Date.now()}`,
        sourceTableId: params.source,
        targetTableId: params.target,
        sourceAttribute: '',
        targetAttribute: '',
        relationType: RELATION_TYPES.ONE_TO_MANY, // Tipo por defecto
        name: `${sourceNode.data.label} - ${targetNode.data.label}`
      };
      
      setSelectedRelation(newRelation as Relation);
    }
  }, [edges, nodes]);

  // Abre menú contextual en nodo (se utiliza CustomEvent desde CustomNode)
  React.useEffect(() => {
    const handler = (e: any) => {
      const { nodeId, data, x, y } = e.detail;
      console.log("Menú contextual para nodo:", nodeId, "con datos:", data);
      
      const canvasContainer = document.querySelector('div[style*="position: relative"]') as HTMLElement;
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        let relX = x - rect.left;
        let relY = y - rect.top;
        // Ajustes para móviles
        if (isMobile) {
          const menuWidth = 180;
          const menuHeight = 120;
          if (relX + menuWidth > rect.width) relX = rect.width - menuWidth - 10;
          if (relY + menuHeight > rect.height) relY = rect.height - menuHeight - 10;
          relX = Math.max(10, relX);
          relY = Math.max(10, relY);
        }
        setContextMenu({ x: relX, y: relY, nodeId });
      } else {
        setContextMenu({ x, y, nodeId });
      }
      setSelectedNode({ id: nodeId, data } as Node);
    };
    window.addEventListener('custom-context-menu', handler);
    return () => window.removeEventListener('custom-context-menu', handler);
  }, [isMobile]);

  // Función para abrir menú de nueva tabla en el canvas
  const openNewTableMenuAt = React.useCallback((relX: number, relY: number) => {
    setNewTableMenu({ x: relX, y: relY });
  }, []);

  // Crear nueva tabla en la posición proyectada
  const createTableAt = React.useCallback((name: string) => {
    if (newTableMenu && name.trim()) {
      let canvasPos = { x: newTableMenu.x, y: newTableMenu.y } as any;
      if (reactFlowInstance && typeof reactFlowInstance.project === 'function') {
        try {
          const projected = reactFlowInstance.project({ x: newTableMenu.x, y: newTableMenu.y });
          if (projected && typeof projected.x === 'number' && typeof projected.y === 'number') {
            canvasPos = projected;
          } else {
            console.warn('reactFlowInstance.project devolvió coords inesperadas, usando coords relativas');
          }
        } catch (err) {
          console.error('Error proyectando coordenadas con reactFlowInstance.project:', err);
          // canvasPos se mantiene en coords relativas del menú
        }
      } else if (!reactFlowInstance) {
        console.warn('reactFlowInstance no disponible, usando coordenadas relativas del evento');
      }
      
      // ID único para la tabla
      const tableId = `table-${Date.now()}`;
      
      // Crear nodo visual
      setNodes((nds) => [
        ...nds,
        { 
          id: tableId, 
          type: 'custom', 
          data: { 
            label: name, 
            attributes: []
          }, 
          position: { x: canvasPos.x, y: canvasPos.y } 
        }
      ]);
      
      // Actualizar modelo de datos
      const newTable: TableEntity = {
        id: tableId,
        name: name,
        attributes: [],
        position: { x: canvasPos.x, y: canvasPos.y }
      };
      
      setDiagramData(prev => ({
        ...prev,
        tables: [...prev.tables, newTable],
        lastModified: new Date()
      }));
      
      setNewTableMenu(null);
      setNewTableName('');
    }
  }, [newTableMenu, reactFlowInstance]);

  // Actualizar un campo del atributo en edición
  const updateAttributeField = React.useCallback((field: keyof Attribute, value: any) => {
    setCurrentAttribute(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Manejar agregado de atributo al nodo seleccionado
  const handleAddAttribute = React.useCallback((nodeId: string, attrName: string, attrType: string, isPrimaryKey: boolean) => {
    console.log("Añadiendo atributo", attrName, "al nodo", nodeId, "PK:", isPrimaryKey);
    if (nodeId && attrName.trim()) {
      // Crear string simple de atributo (formato original)
      const attrString = `${attrName}: ${attrType}${isPrimaryKey ? ' [PK]' : ''}`;
      // Actualizar nodo visual
      setNodes((nds) => nds.map(node => {
        if (node.id === nodeId) {
          const attributes = node.data.attributes || [];
          return { 
            ...node, 
            data: { 
              ...node.data, 
              attributes: [...attributes, attrString]
            } 
          };
        }
        return node;
      }));
      // Actualizar modelo de datos (mantener el modelo completo para exportación)
      setDiagramData(prev => {
        const updatedTables = prev.tables.map(table => {
          if (table.id === nodeId) {
            return {
              ...table,
              attributes: [...(table.attributes || []), {
                name: attrName,
                type: attrType,
                isPrimaryKey,
                isNullable: true,
                isUnique: false
              }]
            };
          }
          return table;
        });
        return {
          ...prev,
          tables: updatedTables,
          lastModified: new Date()
        };
      });
    }

  }, []);

  // Manejar la creación/actualización de una relación
  const handleSaveRelation = React.useCallback((relation: Partial<Relation>) => {
    console.log("Guardando relación:", relation);
    if (!relation.sourceTableId || !relation.targetTableId || !relation.relationType) {
      console.error("Datos de relación incompletos:", relation);
      alert("Error: Datos de relación incompletos");
      return;
    }
    const relationId = relation.id || `rel-${Date.now()}`;
    const newRelation: Relation = {
      ...relation,
      id: relationId
    } as Relation;

    // Normalizar tipo de relación para detectar many-to-many aunque venga en otro formato
    const rawType = (relation.relationType || (relation as any).type || '').toString();
    const normalizedType = rawType.toUpperCase().replace(/\s+/g, '').replace(/-/g, '_');

    // Si es MANY_TO_MANY, crear tabla intermedia visual y en el modelo
    if (normalizedType === 'MANY_TO_MANY' || normalizedType === 'MANYTOMANY' || normalizedType === 'M2M') {
      console.log('handleSaveRelation: detected MANY_TO_MANY (normalized):', normalizedType, relation);
      let sourceTable = diagramData.tables.find(t => t.id === relation.sourceTableId);
      let targetTable = diagramData.tables.find(t => t.id === relation.targetTableId);
      let sourceNode = nodes.find(n => n.id === relation.sourceTableId);
      let targetNode = nodes.find(n => n.id === relation.targetTableId);

      // Si no encontramos tablas/nodos, intentar buscar en nodes actuales o en diagramData por id
      if (!sourceTable && sourceNode) {
        sourceTable = { id: sourceNode.id, name: sourceNode.data?.label || 'Tabla', attributes: sourceNode.data?.__rawAttributes || [], position: sourceNode.position } as any;
      }
      if (!targetTable && targetNode) {
        targetTable = { id: targetNode.id, name: targetNode.data?.label || 'Tabla', attributes: targetNode.data?.__rawAttributes || [], position: targetNode.position } as any;
      }

      // Si aún no hay nodos, colocamos la tabla intermedia en coordenadas por defecto
      const fallbackPos = { x: 200, y: 200 };
      const interX = ((sourceNode?.position?.x ?? sourceTable?.position?.x ?? fallbackPos.x) + (targetNode?.position?.x ?? targetTable?.position?.x ?? fallbackPos.x)) / 2;
      const interY = ((sourceNode?.position?.y ?? sourceTable?.position?.y ?? fallbackPos.y) + (targetNode?.position?.y ?? targetTable?.position?.y ?? fallbackPos.y)) / 2 + 120;

      const interTableName = `${(sourceTable?.name || 'A')}_${(targetTable?.name || 'B')}`;
      const interTableId = `inter-${Date.now()}`;

      const interTable = {
        id: interTableId,
        name: interTableName,
        attributes: [
          { name: 'id', type: 'Long', isPrimaryKey: true, isNullable: false, isUnique: true },
          { name: `${(sourceTable?.name || 'a').toLowerCase()}_id`, type: 'Long', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, referencedTable: sourceTable?.name || '', referencedTableId: sourceTable?.id || '', referencedColumn: 'id' },
          { name: `${(targetTable?.name || 'b').toLowerCase()}_id`, type: 'Long', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, referencedTable: targetTable?.name || '', referencedTableId: targetTable?.id || '', referencedColumn: 'id' }
        ],
        position: { x: interX, y: interY }
      };

      const interNode = {
        id: interTableId,
        type: 'custom',
        data: {
          label: interTableName,
          attributes: [`id: Long [PK]`, `${(sourceTable?.name || 'a').toLowerCase()}_id: Long [FK]`, `${(targetTable?.name || 'b').toLowerCase()}_id: Long [FK]`],
          __rawAttributes: interTable.attributes,
          // isIntermediate flag removed to ensure same styling as other nodes
        },
        position: { x: interX, y: interY }
      };

      // Crear relaciones auxiliares
      const relToInter = {
        id: `rel-${Date.now()}-1`,
        sourceTableId: relation.sourceTableId as string,
        targetTableId: interTableId,
        sourceAttribute: '',
        targetAttribute: `${(sourceTable?.name || 'a').toLowerCase()}_id`,
        relationType: RELATION_TYPES.ONE_TO_MANY,
        name: `${sourceTable?.name || 'A'}_to_${interTableName}`
      } as any;
      const relInterToTarget = {
        id: `rel-${Date.now()}-2`,
        sourceTableId: interTableId,
        targetTableId: relation.targetTableId as string,
        sourceAttribute: `${(targetTable?.name || 'b').toLowerCase()}_id`,
        targetAttribute: '',
        relationType: RELATION_TYPES.ONE_TO_MANY,
        name: `${interTableName}_to_${targetTable?.name || 'B'}`
      } as any;

      // Actualizar modelo y estado de nodos/aristas de forma segura
      setDiagramData(prev => ({
        ...prev,
        tables: [...prev.tables, interTable],
        relations: [...prev.relations, newRelation, relToInter, relInterToTarget],
        lastModified: new Date()
      }));

      setNodes(prev => {
        // evitar duplicados por si ya existe un nodo con ese id
        if (prev.find(n => n.id === interNode.id)) return prev;
        return [...prev, interNode];
      });

      setEdges(prev => {
        const edge1 = {
          id: `edge-${relation.sourceTableId}-${interTableId}`,
          source: relation.sourceTableId as string,
          target: interTableId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'relationship',
          data: { label: '1:N', type: RELATION_TYPES.ONE_TO_MANY }
        } as Edge;
        const edge2 = {
          id: `edge-${interTableId}-${relation.targetTableId}`,
          source: interTableId,
          target: relation.targetTableId as string,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'relationship',
          data: { label: '1:N', type: RELATION_TYPES.ONE_TO_MANY }
        } as Edge;
        // evitar duplicados
        const existing1 = prev.find(e => e.id === edge1.id);
        const existing2 = prev.find(e => e.id === edge2.id);
        let res = prev.slice();
        if (!existing1) res = [...res, edge1];
        if (!existing2) res = [...res, edge2];
        return res;
      });

      // Forzar rerender y ajustar la vista para asegurar que el nuevo nodo es visible
      setTimeout(() => {
        console.log('Forzando rerender y ajustando vista tras crear la tabla intermedia');
        setNodes(prev => prev.slice());
        setEdges(prev => prev.slice());
        if (reactFlowInstance && typeof reactFlowInstance.fitView === 'function') {
          try {
            reactFlowInstance.fitView({ padding: 0.1 });
          } catch (err) {
            console.warn('No se pudo ajustar la vista tras crear tabla intermedia:', err);
          }
        }
      }, 80);

      // Cerrar formulario y limpiar selección
      setShowRelationForm(false);
      setSelectedRelation(null);
      setContextMenu(null);
      console.log('Tabla intermedia creada:', interTableId, interTableName);
      return;
    } else {
      setDiagramData(prev => {
        if (relation.id) {
          const updatedRelations = prev.relations.map(r => r.id === relation.id ? newRelation : r);
          return { ...prev, relations: updatedRelations, lastModified: new Date() };
        } else {
          return { ...prev, relations: [...prev.relations, newRelation], lastModified: new Date() };
        }
      });
    }
    
    // Determinar los handles apropiados basados en las posiciones relativas de los nodos
    const sourceNode = nodes.find(node => node.id === relation.sourceTableId);
    const targetNode = nodes.find(node => node.id === relation.targetTableId);
    
    let sourceHandle = 'right';
    let targetHandle = 'left';
    
    if (sourceNode && targetNode) {
      // Posición X del centro de cada nodo
      const sourceX = sourceNode.position.x;
      const targetX = targetNode.position.x;
      
      // Posición Y del centro de cada nodo
      const sourceY = sourceNode.position.y;
      const targetY = targetNode.position.y;
      
      // Determinar si la conexión debería ser horizontal o vertical
      const dx = Math.abs(sourceX - targetX);
      const dy = Math.abs(sourceY - targetY);
      
      if (dx > dy) {
        // Conexión horizontal
        if (sourceX < targetX) {
          sourceHandle = 'right';
          targetHandle = 'left';
        } else {
          sourceHandle = 'left';
          targetHandle = 'right';
        }
      } else {
        // Conexión vertical
        if (sourceY < targetY) {
          sourceHandle = 'bottom';
          targetHandle = 'top';
        } else {
          sourceHandle = 'top';
          targetHandle = 'bottom';
        }
      }
    }
    
    console.log(`Creando arista: ${relation.sourceTableId} (${sourceHandle}) -> ${relation.targetTableId} (${targetHandle})`);
    
    // Log detallado para depuración
    console.log(`Creando relación con handles: sourceHandle=${sourceHandle}, targetHandle=${targetHandle}`);
    
    // Actualizar arista visual
    setEdges(eds => {
      const edgeIndex = eds.findIndex(e => 
        e.source === relation.sourceTableId && e.target === relation.targetTableId
      );
      
      // Si existe, actualizar los datos y asegurar que los handles estén definidos
      if (edgeIndex >= 0) {
        return eds.map((edge, i) => {
          if (i === edgeIndex) {
            return {
              ...edge,
              type: 'relationship', // Asegurar que el tipo es 'relationship'
              sourceHandle: sourceHandle,
              targetHandle: targetHandle,
              data: {
                label: relation.name || '',
                type: relation.relationType
              }
            };
          }
          return edge;
        });
      } else {
        // Si no existe, crear una nueva arista con handles específicos
        const newEdge = {
          id: `edge-rel-${relationId}`,
          source: relation.sourceTableId as string,
          target: relation.targetTableId as string,
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
          type: 'relationship',
          data: {
            label: relation.name || '',
            type: relation.relationType
          }
        };
        console.log("Nueva arista creada:", newEdge);
        return [...eds, newEdge];
      }
    });
    
    // Cerrar el formulario de relación
    setShowRelationForm(false);
    // Limpiar la relación seleccionada
    setSelectedRelation(null);
  }, [diagramData, nodes, reactFlowInstance]);

  // Eliminar nodo por id
  const removeNodeById = React.useCallback((id: string) => {
    // Eliminar nodo visual
    setNodes(nds => nds.filter(n => n.id !== id));
    
    // Eliminar tabla del modelo de datos
    setDiagramData(prev => ({
      ...prev,
      tables: prev.tables.filter(t => t.id !== id),
      // Eliminar también relaciones que involucren a esta tabla
      relations: prev.relations.filter(r => 
        r.sourceTableId !== id && r.targetTableId !== id
      ),
      lastModified: new Date()
    }));
    
    // Eliminar aristas conectadas a este nodo
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    
    setContextMenu(null);
  }, []);

  // Exportar el diagrama en diferentes formatos
  const exportDiagram = React.useCallback((options: ExportOptions) => {
    if (options.generatePdf) {
      // Implementación del PDF (requiere usar PdfExporter.ts)
    }
    
    // Exportar como SQL si se requiere
    if (options.database) {
      ExportUtil.exportAsSQL(diagramData, options.database);
    }
    
    setShowExportForm(false);
  }, [diagramData]);

  // Validar el diagrama
  const validateDiagram = React.useCallback(() => {
    const errors = ValidationHelper.validateDiagram(diagramData.tables, diagramData.relations);
    setValidationErrors(errors);
    setShowValidationPanel(true);
  }, [diagramData]);

  // Navegar a un elemento con error
  const navigateToError = React.useCallback((error: ValidationError) => {
    if (error.tableId) {
      // Centrar la vista en la tabla con error
      const tableNode = nodes.find(n => n.id === error.tableId);
      if (tableNode && reactFlowInstance) {
        reactFlowInstance.setCenter(tableNode.position.x, tableNode.position.y, { zoom: 1.5, duration: 800 });
      }
    } else if (error.relationId) {
      // Encontrar la relación y centrar la vista entre las tablas
      const relation = diagramData.relations.find(r => r.id === error.relationId);
      if (relation) {
        const sourceNode = nodes.find(n => n.id === relation.sourceTableId);
        const targetNode = nodes.find(n => n.id === relation.targetTableId);
        
        if (sourceNode && targetNode && reactFlowInstance) {
          // Centrar en el punto medio entre las tablas
          const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
          const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
          
          reactFlowInstance.setCenter(centerX, centerY, { zoom: 1.2, duration: 800 });
        }
      }
    }
  }, [nodes, diagramData, reactFlowInstance]);

  // Manejar guardado de configuración de herencia
  const handleSaveInheritance = React.useCallback((updatedTable: Partial<TableEntity>) => {
    if (selectedNode) {
      // Actualizar modelo de datos
      setDiagramData(prev => {
        const updatedTables = prev.tables.map(table => {
          if (table.id === selectedNode.id) {
            return {
              ...table,
              ...updatedTable
            };
          }
          return table;
        });
        
        return {
          ...prev,
          tables: updatedTables,
          lastModified: new Date()
        };
      });
    }
    
    setShowInheritanceForm(false);
  }, [selectedNode]);

  // Cerrar menús y modales
  const closeAllOverlays = React.useCallback(() => {
    setContextMenu(null);
    setNewTableMenu(null);
    setSelectedNode(null);
    setShowAttributeModal(false);
    setShowInheritanceForm(false);
    setShowRelationshipForm(false);
    setSelectedEdgeId(null);
  }, []);

  const openAddAttributeModal = () => {
    setShowAttributeModal(true);
  };

  const openInheritanceForm = () => {
    setShowInheritanceForm(true);
  };

  const addNode = React.useCallback((label: string, position = { x: 100, y: 100 }) => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: 'custom',
      position,
      data: { label, attributes: [] }
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
  }, [nodes.length]);



  const updateEdgeData = (edgeData: any) => {
    setEdges(prevEdges => prevEdges.map(edge => 
      edge.id === selectedEdgeId ? { ...edge, data: edgeData } : edge
    ));
    closeAllOverlays();
  };

  const addAttributeToNode = (attribute: Attribute) => {
    if (!attribute) return;
    const nodeId = (attribute as any).nodeId;
    if (!nodeId) return;

    // Construir string legible para la UI
    const displayAttr = `${attribute.name}: ${attribute.type}${attribute.isPrimaryKey ? ' [PK]' : ''}${(attribute as any).isForeignKey ? ' [FK]' : ''}`;

    // Actualizar nodo visual: atributos de UI como strings, conservar objetos reales en __rawAttributes
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId) {
        const uiAttrs = node.data?.attributes || [];
        const rawAttrs = node.data?.__rawAttributes || [];
        return {
          ...node,
          data: {
            ...node.data,
            attributes: [...uiAttrs, displayAttr],
            __rawAttributes: [...rawAttrs, attribute]
          }
        };
      }
      return node;
    }));

    // Actualizar modelo de datos (diagramData) con el objeto de atributo
    setDiagramData(prev => {
      const updatedTables = prev.tables.map(table => {
        if (table.id === nodeId) {
          return {
            ...table,
            attributes: [...(table.attributes || []), attribute]
          };
        }
        return table;
      });
      return {
        ...prev,
        tables: updatedTables,
        lastModified: new Date()
      };
    });

    closeAllOverlays();
  };

  // Cargar datos del diagrama desde un objeto DiagramData
  const loadDiagramData = React.useCallback((data: DiagramData) => {
    console.log('Cargando datos del diagrama:', data);
    
    // Limpiar estado actual y overlays
    closeAllOverlays();
    // Actualizamos el modelo completo primero
    setDiagramData(data);
    
    // Convertir tablas a nodos, preservando propiedades del modelo y mostrando atributos legibles
    const newNodes = (data.tables || []).map(table => ({
      id: table.id,
      type: 'custom',
      data: {
        // Etiqueta para la UI
        label: table.name,
        // Atributos en la UI: si vienen objetos los transformamos a strings legibles, si ya son strings los usamos tal cual
        attributes: (table.attributes || []).map(attr => {
          if (!attr) return '';
          if (typeof attr === 'string') return attr;
          // atributo como objeto
          const a: any = attr;
          return `${a.name}: ${a.type}${a.isPrimaryKey ? ' [PK]' : ''}${a.isForeignKey ? ' [FK]' : ''}`;
        }),
        // Preservar propiedades avanzadas usadas por la app
        isAbstract: (table as any).isAbstract || false,
        inheritanceType: (table as any).inheritanceType || null,
        discriminatorColumn: (table as any).discriminatorColumn || null,
        discriminatorType: (table as any).discriminatorType || null,
        discriminatorValue: (table as any).discriminatorValue || null,
        parentTable: (table as any).parentTable || null,
        // Mantener también la referencia a los atributos en forma de objetos para el modelo
        __rawAttributes: table.attributes || []
      },
      position: table.position || { x: 0, y: 0 }
    }));
    
    // Helper para decidir handles basados en posiciones, evita que todas las aristas queden iguales
    const computeHandles = (sourceId: string, targetId: string) => {
      const sourceNode = newNodes.find(n => n.id === sourceId);
      const targetNode = newNodes.find(n => n.id === targetId);
      let sourceHandle = 'right';
      let targetHandle = 'left';
      if (sourceNode && targetNode) {
        const dx = Math.abs((sourceNode.position.x || 0) - (targetNode.position.x || 0));
        const dy = Math.abs((sourceNode.position.y || 0) - (targetNode.position.y || 0));
        if (dx > dy) {
          if ((sourceNode.position.x || 0) < (targetNode.position.x || 0)) {
            sourceHandle = 'right'; targetHandle = 'left';
          } else { sourceHandle = 'left'; targetHandle = 'right'; }
        } else {
          if ((sourceNode.position.y || 0) < (targetNode.position.y || 0)) { sourceHandle = 'bottom'; targetHandle = 'top'; }
          else { sourceHandle = 'top'; targetHandle = 'bottom'; }
        }
      }
      return { sourceHandle, targetHandle };
    };
    
    // Convertir relaciones a aristas preservando metadatos
    const newEdges = (data.relations || []).map(relation => {
      const handles = computeHandles(relation.sourceTableId, relation.targetTableId);
      return {
        id: relation.id ? `edge-${relation.id}` : `edge-${Date.now()}-${Math.random()}`,
        source: relation.sourceTableId,
        target: relation.targetTableId,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: 'relationship',
        data: {
          label: relation.name || '',
          type: relation.relationType,
          sourceAttribute: relation.sourceAttribute,
          targetAttribute: relation.targetAttribute,
          relationType: relation.relationType,
          fetchType: relation.fetchType,
          optional: relation.optional,
          name: relation.name
        }
      };
    });
    
    // Aplicar nodos y aristas al estado
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Si tenemos instancia de React Flow, ajustar la vista para que se vea el diagrama
    if (reactFlowInstance && typeof reactFlowInstance.fitView === 'function') {
      // small timeout para esperar a que React Flow procese los nodos
      setTimeout(() => {
        try {
          reactFlowInstance.fitView({ padding: 0.1 });
        } catch (err) {
          console.warn('No se pudo ajustar la vista en React Flow:', err);
        }
      }, 50);
    }
  }, [reactFlowInstance, closeAllOverlays]);

  // --- COLLABORATION EFFECT ---
  React.useEffect(() => {
    if (!diagramData?.id) return;
    // Usar join_code como roomId si está disponible, si no fallback al id
    const roomId = diagramData.join_code || `diagram-${diagramData.id}`;
    console.log('🔗 Conectando a websocket room:', roomId);
    const { ydoc, provider, ymap, awareness } = createCollabRoom(roomId);
    const isApplyingRemoteRef = { current: false };

    // Listener para errores de conexión
    provider.on('status', (event: any) => {
      console.log('WebSocket status:', event.status);
    });

    // Inicializar ymap con estado local si está vacío
    if (!ymap.has('data')) {
      ymap.set('data', JSON.parse(JSON.stringify(diagramData)));
    } else {
      // Si hay datos remotos, cargar en UI
      const remote = ymap.get('data');
      if (isValidDiagramData(remote)) {
        isApplyingRemoteRef.current = true;
        setDiagramData(remote);
        isApplyingRemoteRef.current = false;
      }
    }

    // Escuchar cambios remotos y aplicar al estado React
    const onRemote = () => {
      const remote = ymap.get('data');
      if (!isValidDiagramData(remote)) return;
      if (isApplyingRemoteRef.current) return;
      isApplyingRemoteRef.current = true;
      setDiagramData(remote);
      isApplyingRemoteRef.current = false;
    };
    ymap.observe(onRemote);

    // Publicar cambios locales (debounced)
    const publish = debounce((current: DiagramData) => {
      if (!isValidDiagramData(current)) return;
      if (isApplyingRemoteRef.current) return;
      try {
        ymap.set('data', JSON.parse(JSON.stringify(current)));
      } catch (e) {
        console.error('Error publishing to ymap:', e);
      }
    }, 300);

    // Suscribirse a cambios locales de diagramData
    const stopLocalWatch = (() => {
      let last = diagramData;
      const handler = () => {
        if (diagramData !== last) {
          last = diagramData;
          publish(diagramData);
        }
      };
      const id = setInterval(handler, 300);
      return () => clearInterval(id);
    })();

    // Awareness: compartir presencia
    awareness.setLocalStateField('user', { name: localStorage.getItem('username') || 'anon' });

    return () => {
      console.log('🔌 Desconectando websocket room:', roomId);
      stopLocalWatch();
      ymap.unobserve(onRemote);
      provider.disconnect();
      ydoc.destroy();
      publish.cancel();
    };
    // Solo reconectar si cambia el id o el join_code (no por cada cambio de contenido)
  }, [diagramData?.id, diagramData?.join_code]);

  // Alias para mantener compatibilidad
  const deleteNode = removeNodeById;
  const openAttributeModal = openAddAttributeModal;
  
  // Marcamos como usadas las funciones para evitar errores de linting
  const configureTableInheritance = () => {
    setShowInheritanceForm(true);
  };

  // Exponer la función
  return {
    // Estado principal del diagrama
    nodes,
    setNodes,
    edges,
    setEdges,
    onConnect,
    reactFlowInstance,
    setReactFlowInstance,
    diagramData,
    setDiagramData,
    
    // Estados de UI y menús
    contextMenu,
    setContextMenu,
    newTableMenu,
    setNewTableMenu,
    selectedNode,
    setSelectedNode,
    showAttributeModal,
    showInheritanceForm,
    showRelationshipForm,
    selectedEdgeId,
    currentAttribute,
    setCurrentAttribute,
    
    // Relaciones y validación
    showRelationForm,
    setShowRelationForm, 
    showExportForm,
    setShowExportForm,
    selectedRelation,
    setSelectedRelation,
    validationErrors,
    showValidationPanel,
    setShowValidationPanel,
    setValidationErrors,
    
    // Métodos para manipular tablas/nodos
    closeAllOverlays,
    openAttributeModal,
    openInheritanceForm,
    openNewTableMenuAt,
    createTableAt,
    addNode,
    deleteNode,
    updateEdgeData,
    addAttributeToNode,
    handleAddAttribute,
    updateAttributeField,
    handleSaveRelation,
    exportDiagram,
    validateDiagram,
    navigateToError,
    loadDiagramData,
    configureTableInheritance,
    handleSaveInheritance,
    newTableName,
    setNewTableName,
    
    // UI y responsividad
    isMobile,
    sidebarVisible,
    setSidebarVisible
  };
}

// Función para validar la forma del objeto DiagramData
function isValidDiagramData(obj: any): obj is DiagramData {
  return obj && typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.tables) &&
    Array.isArray(obj.relations);
}
