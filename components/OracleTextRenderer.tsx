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
            <p key={`p-${keyCounter++}`} className="font-garamond text-[#374151] text-base md:text-lg leading-[1.85] mb-5 text-justify tracking-wide">
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
            <ol key={`list-${keyCounter++}`} className="space-y-5 mb-7 ml-0">
              {currentList.map((item, idx) => {
                const title = extractTitle(item);
                const body = extractBody(item);
                return (
                  <li key={idx} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center text-white font-marcellus font-bold text-sm shadow-md">
                      {idx + 1}
                    </div>
                    <div className="flex-1 pt-0.5">
                      {title && (
                        <div className="font-marcellus text-[#D4AF37] text-base md:text-lg font-bold mb-2.5 uppercase tracking-wider">
                          {title}
                        </div>
                      )}
                      <div className="font-garamond text-[#374151] text-base md:text-lg leading-[1.8] tracking-wide">
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
            <ul key={`list-${keyCounter++}`} className="space-y-4 mb-7 ml-0">
              {currentList.map((item, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-[#D4AF37] mt-2.5 shadow-sm" />
                  <div className="flex-1 font-garamond text-[#374151] text-base md:text-lg leading-[1.8] tracking-wide">
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

      // Detectar encabezados markdown (###, ##, #) con o sin emojis
      const headerMatchWithEmoji = trimmed.match(/^###\s*([📌📖💡📚❓📅⚖️✅])\s*(.+)$/);
      const headerMatchSimple = trimmed.match(/^###\s+(.+)$/);
      const headerMatchH2 = trimmed.match(/^##\s+(.+)$/);
      const headerMatchH1 = trimmed.match(/^#\s+(.+)$/);
      
      if (headerMatchWithEmoji) {
        flushParagraph();
        flushList();
        
        const emoji = headerMatchWithEmoji[1];
        const title = headerMatchWithEmoji[2];
        const iconMap: { [key: string]: string } = {
          '📌': 'target',
          '📖': 'book',
          '💡': 'sparkles',
          '📚': 'book',
          '❓': 'chat',
          '📅': 'calendar',
          '⚖️': 'balance',
          '✅': 'check'
        };
        
        elements.push(
          <div key={`header-${keyCounter++}`} className="mb-7 mt-9 first:mt-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[#D4AF37] drop-shadow-sm">
                {getIcon(iconMap[emoji] || 'sparkles', 'w-7 h-7')}
              </div>
              <h3 className="font-marcellus text-[#4A233E] text-xl md:text-2xl font-bold uppercase tracking-wider leading-tight">
                {title}
              </h3>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-[#F8C8DC]/60 to-transparent rounded-full" />
          </div>
        );
        return;
      }
      
      if (headerMatchSimple) {
        flushParagraph();
        flushList();
        const title = headerMatchSimple[1];
        elements.push(
          <div key={`header-${keyCounter++}`} className="mb-7 mt-9 first:mt-0">
            <h3 className="font-marcellus text-[#4A233E] text-xl md:text-2xl font-bold uppercase tracking-wider mb-4 leading-tight">
              {title}
            </h3>
            <div className="h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-[#F8C8DC]/60 to-transparent rounded-full" />
          </div>
        );
        return;
      }
      
      if (headerMatchH2) {
        flushParagraph();
        flushList();
        const title = headerMatchH2[1];
        elements.push(
          <div key={`header-${keyCounter++}`} className="mb-7 mt-9 first:mt-0">
            <h2 className="font-marcellus text-[#4A233E] text-2xl md:text-3xl font-bold uppercase tracking-wider mb-4 leading-tight">
              {title}
            </h2>
            <div className="h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-[#F8C8DC]/60 to-transparent rounded-full" />
          </div>
        );
        return;
      }
      
      if (headerMatchH1) {
        flushParagraph();
        flushList();
        const title = headerMatchH1[1];
        elements.push(
          <div key={`header-${keyCounter++}`} className="mb-7 mt-9 first:mt-0">
            <h1 className="font-marcellus text-[#4A233E] text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4 leading-tight">
              {title}
            </h1>
            <div className="h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-[#F8C8DC]/60 to-transparent rounded-full" />
          </div>
        );
        return;
      }

      // Detectar separadores (---)
      if (trimmed.match(/^---+$/)) {
        flushParagraph();
        flushList();
        elements.push(
          <div key={`spacer-${keyCounter++}`} className="h-8 flex items-center justify-center my-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent rounded-full" />
          </div>
        );
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
      // Agregar la negrita con color especial y mejor estilo
      parts.push(
        <span key={`bold-${keyCounter++}`} className="font-bold text-[#D4AF37] tracking-wide">
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
        <div className="mb-8 p-6 md:p-7 bg-gradient-to-r from-[#FFF9FB] to-[#FDEEF4] rounded-[2rem] border-l-4 border-l-[#D4AF37] shadow-sm">
          <p className="font-garamond text-[#4A233E] text-xl md:text-2xl leading-[1.85] italic text-justify tracking-wide">
            {renderInlineFormatting(firstLine)}
          </p>
        </div>
      )}
      <div className="space-y-1">
        {isGreeting ? parsedContent.slice(1) : parsedContent}
      </div>
    </div>
  );
};

export default OracleTextRenderer;

