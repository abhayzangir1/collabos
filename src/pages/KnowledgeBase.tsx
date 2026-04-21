import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { KB_SECTIONS, searchArticles } from '@/data/knowledgeBase';
import type { KBArticle, KBSection } from '@/data/knowledgeBase';

export default function KnowledgeBase() {
  const { t } = useI18n();
  const params = useParams();
  const sectionSlug = params.section ?? 'getting-started';
  const articleSlug = params.article ?? KB_SECTIONS[0]?.articles[0]?.slug ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(KB_SECTIONS.map((s) => s.id)));
  const [selectedArticle, setSelectedArticle] = useState<{ section: KBSection; article: KBArticle } | null>(() => {
    const section = KB_SECTIONS.find((s) => s.slug === sectionSlug);
    const article = section?.articles.find((a) => a.slug === articleSlug) ?? section?.articles[0];
    return section && article ? { section, article } : KB_SECTIONS[0] ? { section: KB_SECTIONS[0], article: KB_SECTIONS[0].articles[0]! } : null;
  });

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return searchArticles(searchQuery, t);
  }, [searchQuery, t]);

  function toggleSection(sectionId: string) {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    setExpandedSections(next);
  }

  function selectArticle(section: KBSection, article: KBArticle) {
    setSelectedArticle({ section, article });
    setSearchQuery('');
  }

  const articleContent = selectedArticle ? t(selectedArticle.article.contentKey) : '';
  const paragraphs = articleContent.split('\n\n');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside className="kb-sidebar" style={{ padding: '1rem 0' }}>
        <div style={{ padding: '0 1rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>{t('kb.title')}</span>
        </div>

        {/* Search */}
        <div style={{ padding: '0 1rem 1rem', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '1.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="neu-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('kb.search')}
            style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div style={{ padding: '0 0.5rem' }}>
            {searchResults.length === 0 ? (
              <p style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('kb.search.noResults')}</p>
            ) : (
              searchResults.map((r) => (
                <button
                  key={r.article.id}
                  className="kb-article-link"
                  onClick={() => selectArticle(r.section, r.article)}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{t(r.article.titleKey)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }} className="clamp-2">{r.excerpt}</div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Section Navigation */}
        {!searchQuery && KB_SECTIONS.map((section) => (
          <div key={section.id}>
            <button
              className="kb-section-title"
              onClick={() => toggleSection(section.id)}
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              {t(section.titleKey)}
              <ChevronRight size={14} style={{ transform: expandedSections.has(section.id) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {expandedSections.has(section.id) && section.articles.map((article) => (
              <button
                key={article.id}
                className={`kb-article-link ${selectedArticle?.article.id === article.id ? 'active' : ''}`}
                onClick={() => selectArticle(section, article)}
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: selectedArticle?.article.id === article.id ? 'var(--accent-muted)' : 'none', border: 'none', font: 'inherit' }}
              >
                {t(article.titleKey)}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Reading Pane */}
      <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px', overflowY: 'auto' }}>
        {selectedArticle && (
          <>
            {/* Breadcrumb */}
            <div className="kb-breadcrumb">
              <a href="#" onClick={(e) => { e.preventDefault(); }}>{t('kb.title')}</a>
              <ChevronRight size={12} />
              <a href="#" onClick={(e) => { e.preventDefault(); }}>{t(selectedArticle.section.titleKey)}</a>
              <ChevronRight size={12} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t(selectedArticle.article.titleKey)}</span>
            </div>

            {/* Article Content */}
            <article className="kb-article-content" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{t(selectedArticle.article.titleKey)}</h1>
              {paragraphs.map((p, i) => {
                if (p.startsWith('•')) {
                  const items = p.split('\n').filter(Boolean);
                  return (
                    <ul key={i}>
                      {items.map((item, j) => (
                        <li key={j}>{item.replace(/^[•]\s*/, '')}</li>
                      ))}
                    </ul>
                  );
                }
                if (/^\d+\./.test(p)) {
                  const items = p.split('\n').filter(Boolean);
                  return (
                    <ol key={i}>
                      {items.map((item, j) => (
                        <li key={j}>{item.replace(/^\d+\.\s*/, '')}</li>
                      ))}
                    </ol>
                  );
                }
                if (p.includes(':') && p.split('\n').length === 1 && p.length < 80) {
                  return <h3 key={i}>{p.replace(/:$/, '')}</h3>;
                }
                return <p key={i} style={{ overflowWrap: 'anywhere' }}>{p}</p>;
              })}
            </article>
          </>
        )}
      </main>
    </div>
  );
}
