import React, { useState, useRef, useEffect } from 'react';
import type { SkillTag } from '@/types/database';
import { searchSkillTags } from '@/data/skillTags';
import { getDomainColor } from '@/lib/utils';
import { X } from 'lucide-react';

interface SkillTagInputProps {
  value: SkillTag[];
  onChange: (tags: SkillTag[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export function SkillTagInput({ value, onChange, maxTags = 10, placeholder = 'Type to search skills...' }: SkillTagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SkillTag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [maxReached, setMaxReached] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (input.length >= 1) {
      const results = searchSkillTags(input).filter(
        (s) => !value.some((v) => v.label === s.label && v.domain === s.domain)
      );
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function addTag(tag: SkillTag) {
    if (value.length >= maxTags) {
      setMaxReached(true);
      setTimeout(() => setMaxReached(false), 3000);
      return;
    }
    if (!value.some((v) => v.label === tag.label && v.domain === tag.domain)) {
      onChange([...value, tag]);
    }
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      // Check if it matches a predefined tag
      const match = searchSkillTags(input).find(
        (s) => s.label.toLowerCase() === input.toLowerCase()
      );
      if (match) {
        addTag(match);
      } else {
        addTag({ domain: 'Custom', label: input.trim() });
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  }

  // Group suggestions by domain
  const groupedSuggestions: Record<string, SkillTag[]> = {};
  for (const s of suggestions.slice(0, 20)) {
    if (!groupedSuggestions[s.domain]) {
      groupedSuggestions[s.domain] = [];
    }
    groupedSuggestions[s.domain]!.push(s);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem',
          padding: '0.375rem',
          background: 'var(--surface-1)',
          border: '2px solid var(--surface-1-border)',
          borderRadius: 'var(--radius-sm)',
          minHeight: '42px',
          cursor: 'text',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag.domain}-${tag.label}-${i}`}
            className="skill-chip"
            style={{ borderColor: getDomainColor(tag.domain) }}
          >
            <span className="domain-label">{tag.domain} ·</span> {tag.label}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: 'inherit', display: 'flex' }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (input.length >= 1) setShowSuggestions(true); }}
          placeholder={value.length === 0 ? placeholder : ''}
          style={{
            flex: 1,
            minWidth: '120px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            padding: '0.25rem',
          }}
        />
      </div>

      {maxReached && (
        <p style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem' }}>
          Maximum of {maxTags} skill tags reached.
        </p>
      )}

      {showSuggestions && Object.keys(groupedSuggestions).length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: '260px',
            overflowY: 'auto',
            background: 'var(--surface-2)',
            border: '2px solid var(--surface-2-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--surface-2-shadow)',
            marginTop: '4px',
          }}
        >
          {Object.entries(groupedSuggestions).map(([domain, tags]) => (
            <div key={domain}>
              <div style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                color: getDomainColor(domain),
                borderBottom: '1px solid var(--surface-1-border)',
              }}>
                {domain}
              </div>
              {tags.map((tag) => (
                <button
                  key={`${tag.domain}-${tag.label}`}
                  onClick={() => addTag(tag)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && input.length >= 1 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--surface-2)',
            border: '2px solid var(--surface-2-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            marginTop: '4px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          Press Enter to add "{input}" as a custom tag
        </div>
      )}
    </div>
  );
}

export function SkillTagDisplay({ tags, maxRows = 2 }: { tags: SkillTag[]; maxRows?: number }) {
  const maxVisible = maxRows * 4; // ~4 tags per row
  const visible = tags.slice(0, maxVisible);
  const remaining = tags.length - maxVisible;

  return (
    <div className="tag-overflow-container">
      {visible.map((tag, i) => (
        <span
          key={`${tag.domain}-${tag.label}-${i}`}
          className="skill-chip"
          style={{ borderColor: getDomainColor(tag.domain) }}
        >
          <span className="domain-label">{tag.domain} ·</span> {tag.label}
        </span>
      ))}
      {remaining > 0 && (
        <span className="tag-overflow-indicator">+{remaining} more</span>
      )}
    </div>
  );
}
