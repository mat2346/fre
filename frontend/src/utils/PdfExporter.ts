import type { DiagramData, ExportOptions } from '../types';
import { jsPDF } from 'jspdf';
import JavaExporter from './JavaExporter';

/**
 * Clase para exportar diagramas a PDF
 */
export default class PdfExporter {
  // Referencia a la instancia de React Flow para capturar la imagen
  private static reactFlowInstance: any = null;

  /**
   * Establece la instancia de React Flow para poder capturar el diagrama
   * @param instance Instancia de React Flow
   */
  static setReactFlowInstance(instance: any): void {
    this.reactFlowInstance = instance;
  }

  /**
   * Captura el diagrama como imagen para insertar en el PDF
   * @returns Promise con la imagen como data URL
   */
  static async captureDiagramImage(): Promise<string | null> {
    try {
      if (!this.reactFlowInstance) {
        console.warn('No hay instancia de React Flow disponible para capturar');
        return null;
      }
      
      // Obtener el elemento DOM del nodo ReactFlow
      const reactFlowNode = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowNode) {
        console.warn('No se encontró el elemento del diagrama');
        return null;
      }
      
      // Usar html2canvas para capturar el diagrama
      // Nota: Esto requiere importar html2canvas (npm install html2canvas)
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(reactFlowNode, {
        backgroundColor: null,
        scale: 2, // Mayor calidad
        logging: false
      });
      
      // Convertir el canvas a data URL
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error al capturar el diagrama:', error);
      return null;
    }
  }

  /**
   * Genera un PDF con el diagrama ER y código Java
   * @param diagramData Datos del diagrama
   * @param options Opciones de exportación
   * @returns Blob con el PDF
   */
  static async generatePdf(diagramData: DiagramData, options: ExportOptions): Promise<Blob> {
    const { tables, relations, name } = diagramData;

    // Crear un nuevo documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Aplicar tema al PDF
    this.applyTheme(doc, options.pdfTheme ?? 'default');

    // Añadir título
    doc.setFontSize(22);
    doc.text(name, 15, 15);
    doc.setFontSize(14);
    doc.text('Diagrama Entidad-Relación', 15, 25);
    
    // Insertar el diagrama ER capturado como imagen
    try {
      const diagramImage = await this.captureDiagramImage();
      if (diagramImage) {
        // Ajustar el tamaño de la imagen para que quepa bien en el PDF
        const imgWidth = 180;
        const imgHeight = 100;
        doc.addImage(diagramImage, 'PNG', 15, 30, imgWidth, imgHeight);
      } else {
        // Fallback si no se pudo capturar el diagrama
        doc.setLineWidth(0.5);
        doc.rect(15, 30, 180, 100);
        doc.setFontSize(12);
        doc.text('No se pudo capturar el diagrama', 60, 80);
      }
    } catch (error) {
      console.error('Error al capturar el diagrama:', error);
      // Área reservada para el diagrama con mensaje de error
      doc.setLineWidth(0.5);
      doc.rect(15, 30, 180, 100);
      doc.setFontSize(12);
      doc.text('Error al capturar el diagrama', 60, 80);
    }

    // Añadir código Java generado
    let yPosition = 140;
    const generatedCode = JavaExporter.generateAllCode(tables, relations, options);

    // Añadir entidades
    if (options.includeEntities && Object.keys(generatedCode.entities).length > 0) {
      doc.setFontSize(16);
      doc.text('Entidades JPA', 15, yPosition);
      yPosition += 10;
      
      for (const [className, code] of Object.entries(generatedCode.entities)) {
        // Si no cabe en la página actual, crear una nueva
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`${className}.java`, 15, yPosition);
        yPosition += 8;
        
        const codeLines = code.split('\n');
        doc.setFontSize(8);
        
        // Imprimir código con límite de líneas por página
        for (let i = 0; i < codeLines.length; i++) {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Acortar líneas demasiado largas
          const line = codeLines[i].length > 100 
            ? codeLines[i].substring(0, 97) + '...' 
            : codeLines[i];
            
          doc.text(line, 15, yPosition);
          yPosition += 3.5;
        }
        
        yPosition += 10;
      }
    }
    
    // Si hay repositorios, añadirlos en una nueva página
    if (options.includeRepositories && Object.keys(generatedCode.repositories).length > 0) {
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(16);
      doc.text('Repositorios JPA', 15, yPosition);
      yPosition += 10;
      
      for (const [className, code] of Object.entries(generatedCode.repositories)) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`${className}.java`, 15, yPosition);
        yPosition += 8;
        
        const codeLines = code.split('\n');
        doc.setFontSize(8);
        
        for (let i = 0; i < codeLines.length; i++) {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          const line = codeLines[i].length > 100 
            ? codeLines[i].substring(0, 97) + '...' 
            : codeLines[i];
            
          doc.text(line, 15, yPosition);
          yPosition += 3.5;
        }
        
        yPosition += 10;
      }
    }
    
    // Si hay servicios, añadirlos en una nueva página
    if (options.includeServices && Object.keys(generatedCode.services).length > 0) {
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(16);
      doc.text('Servicios CRUD', 15, yPosition);
      yPosition += 10;
      
      // Similar al código anterior para entidades y repositorios
      for (const [className, code] of Object.entries(generatedCode.services)) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`${className}.java`, 15, yPosition);
        yPosition += 8;
        
        const codeLines = code.split('\n');
        doc.setFontSize(8);
        
        for (let i = 0; i < codeLines.length; i++) {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          const line = codeLines[i].length > 100 
            ? codeLines[i].substring(0, 97) + '...' 
            : codeLines[i];
            
          doc.text(line, 15, yPosition);
          yPosition += 3.5;
        }
        
        yPosition += 10;
      }
    }
    
    // Si hay DTOs, añadirlos en una nueva página
    if (options.includeDtos && Object.keys(generatedCode.dtos).length > 0) {
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(16);
      doc.text('DTOs', 15, yPosition);
      yPosition += 10;
      
      // Similar al código anterior
      for (const [className, code] of Object.entries(generatedCode.dtos)) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`${className}.java`, 15, yPosition);
        yPosition += 8;
        
        const codeLines = code.split('\n');
        doc.setFontSize(8);
        
        for (let i = 0; i < codeLines.length; i++) {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          const line = codeLines[i].length > 100 
            ? codeLines[i].substring(0, 97) + '...' 
            : codeLines[i];
            
          doc.text(line, 15, yPosition);
          yPosition += 3.5;
        }
        
        yPosition += 10;
      }
    }

    // Añadir pie de página con fecha
    const today = new Date();
    const dateStr = today.toLocaleDateString();
    
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generado el ${dateStr} - Página ${i} de ${doc.getNumberOfPages()}`, 15, 290);
    }

    // Devolver el PDF como blob
    return doc.output('blob');
  }

  /**
   * Aplica un tema visual al PDF
   * @param doc Documento PDF
   * @param theme Tema a aplicar
   */
  private static applyTheme(doc: jsPDF, theme: string): void {
    // Por defecto, texto negro sobre fondo blanco
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(255, 255, 255);

    switch (theme) {
      case 'dark':
        // PDF no soporta bien fondos oscuros, solo cambiaremos colores de texto y líneas
        doc.setTextColor(0, 0, 120); // Azul oscuro para texto
        doc.setDrawColor(0, 0, 120); // Azul oscuro para líneas
        break;
        
      case 'light':
        doc.setTextColor(80, 80, 80); // Gris para texto
        doc.setDrawColor(200, 200, 200); // Gris claro para líneas
        break;
        
      case 'colorful':
        doc.setTextColor(0, 80, 180); // Azul para títulos
        doc.setDrawColor(0, 150, 0); // Verde para líneas
        break;
        
      default: // default
        // Mantener colores predeterminados
        break;
    }
  }

  /**
   * Guarda todos los archivos Java generados como archivos de texto
   * @param diagramData Datos del diagrama
   * @param options Opciones de exportación
   * @returns Objecto con todos los archivos Java como blobs
   */
  static generateJavaFiles(diagramData: DiagramData, options: ExportOptions): Record<string, Blob> {
    const { tables, relations } = diagramData;
    const generatedCode = JavaExporter.generateAllCode(tables, relations, options);
    
    const files: Record<string, Blob> = {};
    
    // Convertir cada archivo a Blob
    if (options.includeEntities) {
      Object.entries(generatedCode.entities).forEach(([className, code]) => {
        files[`${className}.java`] = new Blob([code], { type: 'text/plain' });
      });
    }
    
    if (options.includeRepositories) {
      Object.entries(generatedCode.repositories).forEach(([className, code]) => {
        files[`${className}.java`] = new Blob([code], { type: 'text/plain' });
      });
    }
    
    if (options.includeServices) {
      Object.entries(generatedCode.services).forEach(([className, code]) => {
        files[`${className}.java`] = new Blob([code], { type: 'text/plain' });
      });
    }
    
    if (options.includeDtos) {
      Object.entries(generatedCode.dtos).forEach(([className, code]) => {
        files[`${className}.java`] = new Blob([code], { type: 'text/plain' });
      });
    }
    
    return files;
  }
}
