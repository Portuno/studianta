import React from 'react';

/**
 * Procesa el texto del oráculo y lo convierte en elementos React estilizados
 * con el diseño Rose-Academic de pergamino digital
 */
export const parseOracleText = (text: string): JSX.Element[] => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let keyCounter = 0;
  let currentParagraph: string[] = [];
  let inDictamenSection = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(' ').trim();
      if (paragraphText) {
        elements.push(
          <p 
            key={`p-${keyCounter++}`} 
            className="font-garamond text-[#374151] text-base md:text-lg leading-relaxed mb-4 text-justify"
          >
            {renderInlineFormatting(paragraphText)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const renderInlineFormatting = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let inlineKeyCounter = 0;

    // Procesar negritas (**texto**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    const matches: Array<{ index: number; length: number; content: string }> = [];

    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        content: match[1]
      });
    }

    // Procesar montos de dinero ($XXX.XX o $-XXX.XX)
    const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
    const amountMatches: Array<{ index: number; length: number; content: string }> = [];
    let amountMatch;
    
    while ((amountMatch = amountRegex.exec(text)) !== null) {
      amountMatches.push({
        index: amountMatch.index,
        length: amountMatch[0].length,
        content: amountMatch[0]
      });
    }

    // Combinar y ordenar todos los matches
    const allMatches = [
      ...matches.map(m => ({ ...m, type: 'bold' as const })),
      ...amountMatches.map(m => ({ ...m, type: 'amount' as const }))
    ].sort((a, b) => a.index - b.index);

    // Renderizar texto con formato
    for (const match of allMatches) {
      // Texto antes del match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // El match en sí
      if (match.type === 'bold') {
        // Determinar color: oro para términos positivos, rosa para negativos
        const content = match.content.toLowerCase();
        const isNegative = content.includes('anemia') || 
                          content.includes('desequilibrio') || 
                          content.includes('deuda') ||
                          content.includes('crítico') ||
                          content.includes('peligro');
        const color = isNegative ? 'text-[#E35B8F]' : 'text-[#D4AF37]';
        
        parts.push(
          <strong key={`bold-${inlineKeyCounter++}`} className={`${color} font-bold`}>
            {match.content}
          </strong>
        );
      } else if (match.type === 'amount') {
        const isNegative = match.content.includes('-');
        const color = isNegative ? 'text-[#E35B8F]' : 'text-[#D4AF37]';
        parts.push(
          <span key={`amount-${inlineKeyCounter++}`} className={`${color} font-bold`}>
            {match.content}
          </span>
        );
      }

      lastIndex = match.index + match.length;
    }

    // Texto restante
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Icono de corona/libranza para encabezados
  const CrownIcon = () => (
    <svg className="w-5 h-5 inline-block mr-2 text-[#D4AF37] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
    </svg>
  );

  // Separador ornamental
  const OrnamentalDivider = () => (
    <div className="flex items-center justify-center my-6">
      <span className="text-[#D4AF37] text-xl">✦</span>
      <span className="mx-3 text-[#D4AF37] text-sm">✦</span>
      <span className="text-[#D4AF37] text-xl">✦</span>
    </div>
  );

  // Procesar cada línea
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Línea vacía
    if (line === '') {
      if (inDictamenSection) {
        // Si estamos en la sección dictamen, agregar espacio
        elements.push(<div key={`dictamen-space-${keyCounter++}`} className="mb-2" />);
      } else {
        flushParagraph();
      }
      continue;
    }

    // Detectar inicio de sección "El Dictamen del Oráculo" o similar
    const isDictamenHeader = (line.toLowerCase().includes('dictamen') || 
                              line.toLowerCase().includes('veredicto final') ||
                              line.toLowerCase().includes('conclusión')) &&
                              (line.startsWith('###') || line.match(/^[A-Z]/));
    
    if (isDictamenHeader && !inDictamenSection) {
      flushParagraph();
      inDictamenSection = true;
      
      // Si es un encabezado, procesarlo
      let headerText = line;
      if (line.startsWith('###')) {
        headerText = line.replace(/^###\s+/, '').trim();
      }
      
      elements.push(
        <div key={`dictamen-start-${keyCounter++}`} className="mt-8 mb-4">
          <div className="p-6 bg-gradient-to-br from-[#FFF9FB] to-[#FDEEF4] rounded-xl border-2 border-[#D4AF37]/50 shadow-lg">
            <h3 className="font-cinzel text-[#4A233E] text-xl md:text-2xl font-bold uppercase mb-0 flex items-center">
              <CrownIcon />
              {headerText}
            </h3>
          </div>
        </div>
      );
      continue;
    }

    // Si estamos en la sección dictamen, renderizar con estilo especial
    if (inDictamenSection) {
      // Si encontramos otro encabezado, salir de la sección dictamen
      if (line.startsWith('###')) {
        inDictamenSection = false;
        // Continuar procesando como encabezado normal
      } else {
        // Renderizar contenido dentro del dictamen
        const processedLine = renderInlineFormatting(line);
        elements.push(
          <p 
            key={`dictamen-p-${keyCounter++}`} 
            className="font-garamond text-[#374151] text-base md:text-lg leading-relaxed mb-3 text-justify pl-2 border-l-2 border-[#D4AF37]/30"
          >
            {processedLine}
          </p>
        );
        continue;
      }
    }

    // Procesar encabezados (###)
    if (line.startsWith('###')) {
      flushParagraph();
      const content = line.replace(/^###\s+/, '').trim();
      elements.push(
        <h3 
          key={`h3-${keyCounter++}`} 
          className="font-cinzel text-[#4A233E] text-lg md:text-xl font-bold uppercase mt-8 mb-4 flex items-center"
        >
          <CrownIcon />
          {content}
        </h3>
      );
      continue;
    }

    // Detectar separadores (--- o similar)
    if (line.match(/^[-_]{3,}$/)) {
      flushParagraph();
      elements.push(<OrnamentalDivider key={`divider-${keyCounter++}`} />);
      continue;
    }

    // Detectar listas (líneas que empiezan con * o -)
    if (line.match(/^[\*\-\•]\s+/)) {
      flushParagraph();
      const listItem = line.replace(/^[\*\-\•]\s+/, '').trim();
      elements.push(
        <div key={`list-${keyCounter++}`} className="flex items-start mb-3">
          <span className="text-[#D4AF37] font-bold mr-3 mt-1">◆</span>
          <p className="font-garamond text-[#374151] text-base md:text-lg leading-relaxed flex-1 text-justify">
            {renderInlineFormatting(listItem)}
          </p>
        </div>
      );
      continue;
    }

    // Agregar a párrafo actual
    currentParagraph.push(line);
  }

  // Flush último párrafo
  flushParagraph();

  return elements;
};

