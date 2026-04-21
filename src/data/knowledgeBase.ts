export interface KBArticle {
  id: string;
  section: string;
  titleKey: string;
  contentKey: string;
  slug: string;
}

export interface KBSection {
  id: string;
  titleKey: string;
  slug: string;
  articles: KBArticle[];
}

export const KB_SECTIONS: KBSection[] = [
  {
    id: 'getting-started',
    titleKey: 'kb.sections.gettingStarted',
    slug: 'getting-started',
    articles: [
      { id: 'what-is-collabos', section: 'getting-started', titleKey: 'kb.articles.whatIsCollabos.title', contentKey: 'kb.articles.whatIsCollabos.content', slug: 'what-is-collabos' },
      { id: 'creating-account', section: 'getting-started', titleKey: 'kb.articles.creatingAccount.title', contentKey: 'kb.articles.creatingAccount.content', slug: 'creating-account' },
      { id: 'building-proofchain', section: 'getting-started', titleKey: 'kb.articles.buildingProofchain.title', contentKey: 'kb.articles.buildingProofchain.content', slug: 'building-proofchain' },
      { id: 'navigating-dashboard', section: 'getting-started', titleKey: 'kb.articles.navigatingDashboard.title', contentKey: 'kb.articles.navigatingDashboard.content', slug: 'navigating-dashboard' },
      { id: 'first-trade', section: 'getting-started', titleKey: 'kb.articles.firstTrade.title', contentKey: 'kb.articles.firstTrade.content', slug: 'first-trade' },
    ],
  },
  {
    id: 'trust-algorithm',
    titleKey: 'kb.sections.trustAlgorithm',
    slug: 'trust-algorithm',
    articles: [
      { id: 'how-trust-calculated', section: 'trust-algorithm', titleKey: 'kb.articles.howTrustCalculated.title', contentKey: 'kb.articles.howTrustCalculated.content', slug: 'how-trust-calculated' },
      { id: 'events-affect-score', section: 'trust-algorithm', titleKey: 'kb.articles.eventsAffectScore.title', contentKey: 'kb.articles.eventsAffectScore.content', slug: 'events-affect-score' },
      { id: 'trust-history-analytics', section: 'trust-algorithm', titleKey: 'kb.articles.trustHistoryAnalytics.title', contentKey: 'kb.articles.trustHistoryAnalytics.content', slug: 'trust-history-analytics' },
      { id: 'improving-trust-score', section: 'trust-algorithm', titleKey: 'kb.articles.improvingTrustScore.title', contentKey: 'kb.articles.improvingTrustScore.content', slug: 'improving-trust-score' },
    ],
  },
  {
    id: 'use-cases',
    titleKey: 'kb.sections.useCases',
    slug: 'use-cases',
    articles: [
      { id: 'freelancer-skill-exchange', section: 'use-cases', titleKey: 'kb.articles.freelancerSkillExchange.title', contentKey: 'kb.articles.freelancerSkillExchange.content', slug: 'freelancer-skill-exchange' },
      { id: 'team-collaboration', section: 'use-cases', titleKey: 'kb.articles.teamCollaboration.title', contentKey: 'kb.articles.teamCollaboration.content', slug: 'team-collaboration' },
      { id: 'managing-pipelines', section: 'use-cases', titleKey: 'kb.articles.managingPipelines.title', contentKey: 'kb.articles.managingPipelines.content', slug: 'managing-pipelines' },
      { id: 'exporting-analytics', section: 'use-cases', titleKey: 'kb.articles.exportingAnalytics.title', contentKey: 'kb.articles.exportingAnalytics.content', slug: 'exporting-analytics' },
    ],
  },
];

export function findArticle(sectionSlug: string, articleSlug: string): KBArticle | undefined {
  const section = KB_SECTIONS.find((s) => s.slug === sectionSlug);
  return section?.articles.find((a) => a.slug === articleSlug);
}

export function findSection(sectionSlug: string): KBSection | undefined {
  return KB_SECTIONS.find((s) => s.slug === sectionSlug);
}

export function searchArticles(query: string, t: (key: string) => string): { article: KBArticle; section: KBSection; excerpt: string }[] {
  if (!query || query.length < 2) return [];
  const lower = query.toLowerCase();
  const results: { article: KBArticle; section: KBSection; excerpt: string }[] = [];

  for (const section of KB_SECTIONS) {
    for (const article of section.articles) {
      const title = t(article.titleKey).toLowerCase();
      const content = t(article.contentKey).toLowerCase();
      if (title.includes(lower) || content.includes(lower)) {
        const idx = content.indexOf(lower);
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + lower.length + 60);
        const excerpt = (start > 0 ? '...' : '') + t(article.contentKey).slice(start, end) + (end < content.length ? '...' : '');
        results.push({ article, section, excerpt });
      }
    }
  }

  return results;
}
