import React from 'react';
import { getIcon } from '../constants';

interface OracleTextRendererProps {
  text: string;
}

const OracleTextRenderer: React.FC<OracleTextRendererProps> = ({ text }) => {
  // Función para parsear el texto y convertirlo en componentes React
  const parseOracleText = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    let currentList: string[] = [];
    let inList = false;
    let listType: 'ordered' | 'unordered' | null = null;
    let keyCounter = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join(' ').trim();
        if (paragraphText) {
          elements.push(
            <p key={`p-${keyCounter++}`} className="font-garamond text-[#374151] text-lg md:text-xl leading-[1.75] mb-6 text-justify">
              {renderInlineFormatting(paragraphText)}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        if (listType === 'ordered') {
          elements.push(
            <ol key={`list-${keyCounter++}`} className="space-y-4 mb-8 ml-4">
              {currentList.map((item, idx) => {
                const title = extractTitle(item);
                const body = extractBody(item);
                return (
                  <li key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-white font-marcellus font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      {title && (
                        <div className="font-marcellus text-[#D4AF37] text-lg font-bold mb-2 uppercase tracking-wide">
                          {title}
                        </div>
                      )}
                      <div className="font-garamond text-[#374151] text-base leading-relaxed">
                        {renderInlineFormatting(body || item)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`list-${keyCounter++}`} className="space-y-3 mb-8 ml-4">
              {currentList.map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#D4AF37] mt-2" />
                  <div className="flex-1 font-garamond text-[#374151] text-base leading-relaxed">
                    {renderInlineFormatting(item.trim())}
                  </div>
                </li>
              ))}
            </ul>
          );
        }
        currentList = [];
        inList = false;
        listType = null;
      }
    };

    const extractTitle = (text: string): string => {
      const boldMatch = text.match(/^\*\*(.+?)\*\*/);
      return boldMatch ? boldMatch[1] : '';
    };

    const extractBody = (text: string): string => {
      return text.replace(/^\*\*(.+?)\*\*\s*/, '').trim();
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Detectar encabezados con emojis (### 📌 RECONOCIMIENTO)
      const headerMatch = trimmed.match(/^###\s*([📌📖💡📚❓])\s*(.+)$/);
      if (headerMatch) {
        flushParagraph();
        flushList();
        
        const emoji = headerMatch[1];
        const title = headerMatch[2];
        const iconMap: { [key: string]: string } = {
          '📌': 'target',
          '📖': 'book',
          '💡': 'sparkles',
          '📚': 'book',
          '❓': 'chat'
        };
        
        elements.push(
          <div key={`header-${keyCounter++}`} className="mb-6 mt-8 first:mt-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[#D4AF37]">
                {getIcon(iconMap[emoji] || 'sparkles', 'w-6 h-6')}
              </div>
              <h3 className="font-marcellus text-[#4A233E] text-xl md:text-2xl font-bold uppercase tracking-wider">
                {title}
              </h3>
            </div>
            <div className="h-px bg-gradient-to-r from-[#D4AF37]/30 via-[#F8C8DC]/50 to-transparent" />
          </div>
        );
        return;
      }

      // Detectar separadores (---)
      if (trimmed.match(/^---+$/)) {
        flushParagraph();
        flushList();
        elements.push(<div key={`spacer-${keyCounter++}`} className="h-6" />);
        return;
      }

      // Detectar listas ordenadas (1. 2. etc)
      const orderedListMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
      if (orderedListMatch) {
        if (!inList || listType !== 'ordered') {
          flushParagraph();
          flushList();
          inList = true;
          listType = 'ordered';
        }
        currentList.push(orderedListMatch[2]);
        return;
      }

      // Detectar listas no ordenadas (- o •)
      const unorderedMatch = trimmed.match(/^[-•]\s*(.+)$/);
      if (unorderedMatch) {
        if (!inList || listType !== 'unordered') {
          flushParagraph();
          flushList();
          inList = true;
          listType = 'unordered';
        }
        currentList.push(unorderedMatch[1]);
        return;
      }

      // Si estamos en una lista y encontramos una línea vacía, terminamos la lista
      if (inList && trimmed === '') {
        flushList();
        return;
      }

      // Párrafos normales
      if (trimmed !== '') {
        if (inList) {
          flushList();
        }
        currentParagraph.push(trimmed);
      } else {
        flushParagraph();
      }
    });

    flushParagraph();
    flushList();

    return elements;
  };

  // Función para renderizar formato inline (negritas, cursivas, etc.)
  const renderInlineFormatting = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Procesar negritas (**texto**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Agregar texto antes de la negrita
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Agregar la negrita con color especial
      parts.push(
        <span key={`bold-${keyCounter++}`} className="font-bold text-[#D4AF37]">
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Agregar texto restante
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Detectar si el primer párrafo es un saludo (para darle tratamiento especial)
  const firstLine = text.split('\n')[0]?.trim() || '';
  const isGreeting = firstLine.toLowerCase().includes('salve') || 
                     firstLine.toLowerCase().includes('bienvenido') ||
                     firstLine.toLowerCase().includes('buscador');

  const parsedContent = parseOracleText(text);

  return (
    <div className="oracle-manuscript">
      {isGreeting && parsedContent.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-[#FFF9FB] to-[#FDEEF4] rounded-[2rem] border-l-4 border-l-[#D4AF37]">
          <p className="font-garamond text-[#4A233E] text-xl md:text-2xl leading-[1.8] italic text-justify">
            {renderInlineFormatting(firstLine)}
          </p>
        </div>
      )}
      <div className="space-y-2">
        {isGreeting ? parsedContent.slice(1) : parsedContent}
      </div>
    </div>
  );
};

export default OracleTextRenderer;

