import React from 'react';

// Função aprimorada para processar toda a formatação inline (links, negrito, itálico, destaques) de forma robusta.
const renderInline = (text: string, searchTerm: string): React.ReactNode => {
    // Regex para corresponder a links Markdown, negrito, itálico e URLs simples em uma única passagem.
    // A ordem é importante: o link vem antes da URL simples para evitar a correspondência da parte da URL de um link separadamente.
    const markdownAndUrlRegex = /(\[([^\]]+?)\]\((https?:\/\/[^\s)]+?)\))|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(https?:\/\/[^\s]+)/g;

    let lastIndex = 0;
    const nodes: React.ReactNode[] = [];
    let match;

    // Usa um loop while com .exec() para iterar por todas as correspondências
    while ((match = markdownAndUrlRegex.exec(text)) !== null) {
        // 1. Adiciona a parte de texto simples antes da correspondência atual
        if (match.index > lastIndex) {
            nodes.push(text.substring(lastIndex, match.index));
        }

        // 2. Identifica o tipo de correspondência e cria o elemento React correspondente
        const [
            fullMatch,          // A string inteira correspondente
            linkMatch,          // [texto](url)
            linkText,           // texto
            linkUrl,            // url
            boldMatch,          // **texto**
            boldText,           // texto
            italicMatch,        // *texto*
            italicText,         // texto
            plainUrlMatch       // http://...
        ] = match;

        if (linkMatch) {
            nodes.push(<a key={lastIndex} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{linkText}</a>);
        } else if (boldMatch) {
            nodes.push(<strong key={lastIndex}>{boldText}</strong>);
        } else if (italicMatch) {
            nodes.push(<em key={lastIndex}>{italicText}</em>);
        } else if (plainUrlMatch) {
            // Valida e cria um link para URLs independentes
            try {
                new URL(plainUrlMatch); // Validação simples
                nodes.push(<a key={lastIndex} href={plainUrlMatch} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{plainUrlMatch}</a>);
            } catch (e) {
                // Se não for uma URL válida, trata como texto simples
                nodes.push(plainUrlMatch);
            }
        }

        lastIndex = match.index + fullMatch.length;
    }

    // 3. Adiciona qualquer texto simples restante após a última correspondência
    if (lastIndex < text.length) {
        nodes.push(text.substring(lastIndex));
    }

    // 4. Aplica o destaque do termo de busca apenas aos nós de texto
    const highlight = (childNodes: React.ReactNode[]): React.ReactNode[] => {
        if (!searchTerm.trim()) return childNodes;
        // Escapa caracteres especiais no termo de busca para a regex
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(`(${escapedSearchTerm})`, 'gi');

        return childNodes.flatMap((node, nodeIndex) => {
            // Destaca apenas strings, não elementos React (como nossos links)
            if (typeof node !== 'string') return node;

            // Não destaca se não houver correspondência
            if (!node.match(searchRegex)) return node;

            const parts = node.split(searchRegex);
            return parts.map((part, partIndex) =>
                part.toLowerCase() === searchTerm.toLowerCase() ? (
                    <mark key={`${nodeIndex}-${partIndex}`} className="bg-yellow-400 text-black px-0.5 rounded-sm">
                        {part}
                    </mark>
                ) : (
                    part
                )
            );
        });
    };

    return <>{highlight(nodes)}</>;
};


interface MarkdownRendererProps {
  content: string;
  searchTerm: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, searchTerm, className }) => {
  if (!content) return null;

  const blocks = content.split('\n\n');

  return (
    <div className={className || "prose prose-invert prose-sm max-w-none text-gray-200"}>
      {blocks.map((block, index) => {
        // Remove espaços em branco de cada bloco para lidar com espaços extras
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;

        // Verifica se há blockquotes
        if (trimmedBlock.startsWith('>')) {
          const quoteContent = trimmedBlock.split('\n').map(line => line.replace(/^>\s?/, '')).join('\n');
          return (
            <blockquote key={index} className="my-2">
              {renderInline(quoteContent, searchTerm)}
            </blockquote>
          );
        }

        // Verifica se há itens de lista
        if (trimmedBlock.match(/^(\s*(\*|-)\s.*)/)) {
          const items = trimmedBlock.split('\n').map((item, i) => (
            <li key={i} className="my-1">
              {renderInline(item.replace(/^\s*(\*|-)\s/, ''), searchTerm)}
            </li>
          ));
          return <ul key={index} className="my-2 list-disc list-outside ml-5">{items}</ul>;
        }
        
        // Verifica se há cabeçalhos
        if (trimmedBlock.startsWith('### ')) {
          return <h4 key={index} className="font-bold mt-2 mb-1">{renderInline(trimmedBlock.substring(4), searchTerm)}</h4>;
        }
        if (trimmedBlock.startsWith('## ')) {
          return <h3 key={index} className="font-bold mt-3 mb-1">{renderInline(trimmedBlock.substring(3), searchTerm)}</h3>;
        }
        if (trimmedBlock.startsWith('# ')) {
          return <h2 key={index} className="font-bold mt-4 mb-2">{renderInline(trimmedBlock.substring(2), searchTerm)}</h2>;
        }

        // Padrão para parágrafo
        return (
          <p key={index} className="my-2">
            {renderInline(trimmedBlock, searchTerm)}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownRenderer;
