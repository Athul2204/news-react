import { BankIcon, ChatIcon, GitIcon, NewspaperIcon, PaperIcon, PenIcon } from '../components/Icons';

/* One card per kind of data Daybreak can collect. Replace with data from your API
   (counts, defaults, descriptions). `on` is the default switch state. */
export const SOURCES = [
  { key: 'news', name: 'News articles', hue: 215, on: true, count: 12480,
    text: 'Stories from newspapers, wire services and broadcasters, past and current.',
    examples: ['Newspapers', 'Wire services', 'Broadcasters'], Icon: NewspaperIcon },
  { key: 'github', name: 'GitHub repositories', hue: 265, on: true, count: 3260,
    text: 'Releases, changelogs, issues and star growth for the projects you follow.',
    examples: ['Releases', 'Issues', 'Security advisories'], Icon: GitIcon },
  { key: 'papers', name: 'Research papers', hue: 190, on: true, count: 5870,
    text: 'Preprints, journal articles and patents, with authors, abstracts and citations.',
    examples: ['arXiv', 'PubMed', 'Patents'], Icon: PaperIcon },
  { key: 'blogs', name: 'Public blogs', hue: 35, on: false, count: 2140,
    text: 'Independent blogs and newsletters from experts, labelled by source quality.',
    examples: ['Blogs', 'Newsletters', 'Engineering posts'], Icon: PenIcon },
  { key: 'filings', name: 'Company and government filings', hue: 150, on: false, count: 9320,
    text: 'Stock exchange filings, results, court judgments and public records.',
    examples: ['Exchange filings', 'Court records', 'Budgets'], Icon: BankIcon },
  { key: 'social', name: 'Social and forums', hue: 330, on: false, count: 18900,
    text: 'Public posts and discussions, used as a sentiment signal rather than as fact.',
    examples: ['Reddit', 'Forums', 'Public posts'], Icon: ChatIcon },
];
