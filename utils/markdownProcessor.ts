/**
 * Procesa texto markdown y lo convierte a HTML con estilos Rose-Academic
 */
export const processMarkdownToHTML = (text: string): string => {
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let previousWasHeading = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Línea vacía - agregar espacio solo si no viene después de un encabezado
    if (line === '') {
      if (!previousWasHeading) {
        processedLines.push('<br>');
      }
      previousWasHeading = false;
      continue;
    }

    // Procesar encabezados (###)
    if (line.startsWith('###')) {
      const content = line.replace(/^###\s+/, '').trim();
      processedLines.push(
        `<h3 style="
          color: #4A233E; 
          font-family: 'Marcellus', 'Cinzel', 'EB Garamond', serif; 
          font-size: 18pt; 
          font-weight: 700; 
          margin-top: 20px; 
          margin-bottom: 12px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        ">${content}</h3>`
      );
      previousWasHeading = true;
      continue;
    }

    previousWasHeading = false;

    // Procesar negritas (**texto**) - debe hacerse antes de envolver en párrafo
    line = line.replace(/\*\*(.+?)\*\*/g, (match, content) => {
      return `<strong style="color: #D4AF37; font-weight: 700;">${content}</strong>`;
    });

    // Procesar montos de dinero ($XXX.XX o $-XXX.XX)
    line = line.replace(/\$[\d,]+(?:\.\d{2})?/g, (match) => {
      // Si es negativo, usar color rojo, si no, dorado
      const isNegative = match.includes('-');
      const color = isNegative ? '#E35B8F' : '#D4AF37';
      return `<span style="color: ${color}; font-weight: 700;">${match}</span>`;
    });

    // Procesar números negativos sin signo de dólar (si aparecen solos)
    line = line.replace(/\b-\$?[\d,]+(?:\.\d{2})?\b/g, (match) => {
      return `<span style="color: #E35B8F; font-weight: 700;">${match}</span>`;
    });

    // Envolver en párrafo con mejor espaciado
    processedLines.push(`<p style="
      margin-bottom: 14px; 
      margin-top: 0; 
      text-align: justify;
      line-height: 1.8;
    ">${line}</p>`);
  }

  return processedLines.join('');
};

