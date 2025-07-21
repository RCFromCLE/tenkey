/**
 * VirtualizedSummaryContent Component
 * Optimized content renderer for large summaries using virtual scrolling
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';

interface VirtualizedSummaryContentProps {
  content: string;
  className?: string;
}

const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_HEIGHT = 100; // Estimated height per chunk in pixels

export function VirtualizedSummaryContent({ 
  content, 
  className = '' 
}: VirtualizedSummaryContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  // Split content into manageable chunks
  const chunks = useMemo(() => {
    if (!content) return [];
    
    const textChunks: string[] = [];
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      textChunks.push(content.slice(i, i + CHUNK_SIZE));
    }
    return textChunks;
  }, [content]);

  // Calculate which chunks are visible
  const visibleChunks = useMemo(() => {
    const startIndex = Math.floor(scrollTop / CHUNK_HEIGHT);
    const endIndex = Math.min(
      chunks.length - 1,
      Math.ceil((scrollTop + containerHeight) / CHUNK_HEIGHT)
    );

    const visible = [];
    for (let i = Math.max(0, startIndex - 1); i <= endIndex + 1; i++) {
      if (chunks[i]) {
        visible.push({
          index: i,
          content: chunks[i],
          top: i * CHUNK_HEIGHT
        });
      }
    }
    return visible;
  }, [chunks, scrollTop, containerHeight]);

  const totalHeight = chunks.length * CHUNK_HEIGHT;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    updateHeight();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeight);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // For small content, render normally without virtualization
  if (content.length < CHUNK_SIZE * 3) {
    return (
      <div 
        className={`text-slate-200 leading-relaxed whitespace-pre-wrap ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleChunks.map(({ index, content: chunkContent, top }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              minHeight: CHUNK_HEIGHT
            }}
            className="text-slate-200 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: chunkContent }}
          />
        ))}
      </div>
    </div>
  );
}
