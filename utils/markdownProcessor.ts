/**
 * Procesa texto markdown y lo convierte a HTML con estilos Rose-Academic
 */
export const processMarkdownToHTML = (text: string): string => {
  const lines = text.split('\n');
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Línea vacía
    if (line === '') {
      processedLines.push('<br>');
      continue;
    }

    // Procesar encabezados (###)
    if (line.startsWith('###')) {
      const content = line.replace(/^###\s+/, '').trim();
      processedLines.push(
        `<h3 style="color: #4A233E; font-family: 'EB Garamond', serif; font-size: 16pt; font-weight: 600; margin-top: 12px; margin-bottom: 8px;">${content}</h3>`
      );
      continue;
    }

    // Procesar negritas (**texto**) - debe hacerse antes de envolver en párrafo
    line = line.replace(/\*\*(.+?)\*\*/g, (match, content) => {
      return `<strong style="color: #D4AF37; font-weight: 600;">${content}</strong>`;
    });

    // Procesar montos de dinero ($XXX.XX)
    line = line.replace(/\$[\d,]+(?:\.\d{2})?/g, (match) => {
      return `<span style="color: #D4AF37; font-weight: 600;">${match}</span>`;
    });

    // Envolver en párrafo
    processedLines.push(`<p style="margin-bottom: 8px; margin-top: 0;">${line}</p>`);
  }

  return processedLines.join('');
};

