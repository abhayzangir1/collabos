import type { SkillTag } from '@/types/database';

export interface SkillTagDomain {
  domain: string;
  tags: string[];
}

export const SKILL_TAG_LIBRARY: SkillTagDomain[] = [
  {
    domain: 'Engineering',
    tags: ['React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'GraphQL', 'REST API', 'CI/CD', 'System Design', 'Mobile Development'],
  },
  {
    domain: 'Design',
    tags: ['Figma', 'UI Design', 'UX Design', 'Illustration', 'Branding', 'Motion Design', 'Design Systems', 'Prototyping', 'User Research', 'Accessibility', 'Web Design', 'Icon Design'],
  },
  {
    domain: 'Marketing',
    tags: ['SEO', 'Content Marketing', 'Social Media', 'Email Marketing', 'PPC', 'Analytics', 'Growth Hacking', 'Copywriting', 'Brand Strategy', 'Influencer Marketing', 'Video Marketing'],
  },
  {
    domain: 'Writing',
    tags: ['Technical Writing', 'Blog Writing', 'Copywriting', 'Content Strategy', 'Editing', 'Ghostwriting', 'Script Writing', 'UX Writing', 'Grant Writing', 'Academic Writing'],
  },
  {
    domain: 'Data & Analytics',
    tags: ['Data Analysis', 'Machine Learning', 'Data Visualization', 'SQL', 'Python', 'R', 'Tableau', 'Power BI', 'Statistical Modeling', 'ETL', 'Big Data', 'A/B Testing'],
  },
  {
    domain: 'Operations',
    tags: ['Project Management', 'Agile/Scrum', 'Process Optimization', 'Supply Chain', 'Quality Assurance', 'DevOps', 'Risk Management', 'Vendor Management', 'Logistics', 'Lean Six Sigma'],
  },
  {
    domain: 'Legal & Finance',
    tags: ['Contract Law', 'Intellectual Property', 'Tax Planning', 'Financial Modeling', 'Bookkeeping', 'Compliance', 'Fundraising', 'Budgeting', 'Auditing', 'Corporate Law'],
  },
  {
    domain: 'Others',
    tags: ['Photography', 'Video Production', 'Music Production', 'Translation', 'Coaching', 'Public Speaking', 'Community Management', 'Event Planning', 'Virtual Assistance', 'Customer Support'],
  },
];

export function searchSkillTags(query: string): SkillTag[] {
  if (!query || query.length < 1) return [];
  const lower = query.toLowerCase();
  const results: SkillTag[] = [];

  for (const domain of SKILL_TAG_LIBRARY) {
    for (const tag of domain.tags) {
      if (tag.toLowerCase().includes(lower)) {
        results.push({ domain: domain.domain, label: tag });
      }
    }
  }

  return results;
}

export function getAllSkillTags(): SkillTag[] {
  const results: SkillTag[] = [];
  for (const domain of SKILL_TAG_LIBRARY) {
    for (const tag of domain.tags) {
      results.push({ domain: domain.domain, label: tag });
    }
  }
  return results;
}

export function isCustomTag(tag: SkillTag): boolean {
  return tag.domain === 'Custom';
}
