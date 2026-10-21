/* Sample research reports (dummy data). Replace with calls to your API. */
export const HUES = { World: 210, Business: 150, Technology: 265, Sports: 25, Science: 190, Health: 340, Entertainment: 300, Travel: 45, Education: 235, Environment: 120 };

const topics = [
  ['Technology', 'How open-source AI models are changing small business software'],
  ['Environment', 'Impact of rooftop solar on rural household budgets'],
  ['Business', 'Why regional airlines are adding short-haul routes'],
  ['Health', 'Trends in preventive care adoption after 2024'],
  ['Education', 'Online tutoring and exam results: what the data shows'],
  ['World', 'Cross-border trade corridors and food prices'],
  ['Science', 'Progress in battery recycling over the last decade'],
  ['Travel', 'Why autumn is becoming peak season for hill stations'],
  ['Sports', 'Grassroots football funding across five countries'],
  ['Entertainment', 'The rise of regional-language streaming originals'],
  ['Technology', 'Satellite internet adoption in remote communities'],
  ['Business', 'Small exporters and the cost of container shipping'],
  ['Environment', 'Urban tree cover and summer heat in dense neighborhoods'],
  ['Health', 'Telemedicine access for rural clinics'],
  ['Education', 'Scholarship programs and first-generation graduation rates'],
  ['Science', 'Weather forecasting accuracy: a five-year review'],
  ['World', 'Water access agreements between neighboring regions'],
  ['Travel', 'Rail versus air for trips under 500 km'],
];

export const SAMPLE_REPORTS = topics.map(([category, title], i) => ({
  id: `sample-${i + 1}`,
  title,
  category,
  summary: 'A review of recent reporting, public data and expert commentary, with key findings, open questions and a short list of sources to read next.',
  status: i % 5 === 3 ? 'progress' : 'complete',
  sources: 8 + (i * 3) % 17,
  date: new Date(2026, 9, 8 - i * 2).toISOString(),
}));
