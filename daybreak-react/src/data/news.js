/* ==========================================================================
   news.js  -  100 sample news items (dummy data) -> export NEWS_ITEMS
   Each item: { id, category, hue, title, summary, content[], source, time, readMinutes, image, url }
   Replace with a fetch() to your API; the pages only need the array.
   ========================================================================== */

export const NEWS_ITEMS = (function () {
  'use strict';
  var sources = ['Daily Ledger', 'The Meridian', 'Northgate Post', 'Harbor Wire', 'City Chronicle', 'Open Desk'];
  var tails = [
    'Analysts say the effects could be felt over the coming months.',
    'Residents and experts have been quick to share their reactions.',
    'More details are expected later this week.'
  ];

  var categories = [
    { name: 'World', hue: 210, blurb: 'Officials and local groups outline what happens next.', titles: [
      'Regional leaders agree to new border cooperation pact', 'Floodwaters recede as relief teams reach isolated villages',
      'Summit ends with pledge to expand clean water access', 'Election observers praise calm and orderly voting',
      'Ports reopen after weeks of shipping delays', 'Talks resume on long-stalled trade corridor',
      'Aid convoy delivers medical supplies to remote towns', 'New ferry link to connect island communities',
      'Ancient harbor city marks 800 years with festival', 'Neighboring countries launch joint wildlife patrol'] },
    { name: 'Business', hue: 150, blurb: 'Markets and companies weigh what the change means for customers.', titles: [
      'Retail sales rise for third straight month', 'Local startups raise record funding this quarter',
      'Central bank holds rates steady, signals patience', 'Shipping costs ease as supply chains recover',
      'Airline adds routes ahead of the holiday season', 'Small businesses embrace four-day work weeks',
      'Housing market cools as mortgage demand slips', 'Farmers\u2019 cooperative expands into online sales',
      'Energy prices dip after mild autumn weather', 'Bank unveils app for instant small-business loans'] },
    { name: 'Technology', hue: 265, blurb: 'The update is aimed at making everyday devices simpler and safer.', titles: [
      'New chip promises all-day battery for budget phones', 'Open-source group releases privacy-first browser',
      'Cities test self-cleaning smart bus shelters', 'Messaging apps roll out stronger encryption',
      'Startup builds low-cost solar charger for villages', 'Developers race to support the new foldable standard',
      'Study finds most people reuse weak passwords', 'Robot kitchen helper debuts at tech expo',
      'Update brings offline maps to older tablets', 'Schools pilot coding classes for primary students'] },
    { name: 'Sports', hue: 25, blurb: 'Fans and players react as the season moves into a key stretch.', titles: [
      'Late goal secures dramatic win in derby clash', 'Young sprinter breaks national record',
      'Cricket board names squad for winter tour', 'Marathon draws record crowds along the coast',
      'Coach praises team spirit after tough defeat', 'Tennis star returns from injury with straight-sets win',
      'City hosts national swimming championships', 'Badminton duo claim doubles title',
      'Football league announces new youth academies', 'Cyclists tackle mountain stage in heavy rain'] },
    { name: 'Science', hue: 190, blurb: 'The finding adds a new piece to an ongoing research effort.', titles: [
      'Astronomers spot faint ring around distant planet', 'Researchers map deep-sea ridge for the first time',
      'New battery material charges in minutes', 'Fossil find sheds light on early whales',
      'Telescope captures sharpest image of a young star', 'Scientists teach drones to track migrating birds',
      'Lab-grown coral shows promise for reef recovery', 'Weather satellite sends first high-resolution images',
      'Team decodes sounds of rainforest frogs', 'Rock samples hint at ancient river on Mars'] },
    { name: 'Health', hue: 350, blurb: 'Specialists offer practical advice that people can use right away.', titles: [
      'Doctors urge flu shots as cases begin to climb', 'Daily walking linked to better sleep, study says',
      'Clinic opens mobile unit for rural check-ups', 'Nutritionists share simple tips for school lunches',
      'Hospital trial tests faster test for infections', 'Local gym offers free classes for seniors',
      'Experts explain how to spot burnout early', 'New guidelines suggest earlier vision screening',
      'Community drive collects blood donations', 'Dentists back sugar-free snacks in schools'] },
    { name: 'Entertainment', hue: 300, blurb: 'Audiences and critics are already talking about what comes next.', titles: [
      'Indie drama sweeps the film festival awards', 'Beloved author announces sequel after ten years',
      'Streaming service greenlights new mystery series', 'Street musicians turn old station into stage',
      'Concert tour adds extra dates after quick sell-out', 'Animated feature tops weekend box office',
      'Theater troupe brings classic play to schools', 'Podcast about local history hits one million plays',
      'Museum opens interactive film archive', 'Comedy night raises funds for animal shelter'] },
    { name: 'Travel', hue: 45, blurb: 'Visitors can expect easier journeys and a few new places to explore.', titles: [
      'Scenic rail route reopens after restoration', 'Hill station sees record autumn visitors',
      'Airport introduces faster self check-in gates', 'Eco lodges open along the coastal trail',
      'Night market becomes the city\u2019s newest attraction', 'Guide reveals quiet beaches away from crowds',
      'Heritage walk takes visitors through old bazaars', 'Cruise line adds river tours for families',
      'Cycling paths link three national parks', 'Tourism board launches app with offline guides'] },
    { name: 'Education', hue: 235, blurb: 'Teachers and families hope the change makes learning easier.', titles: [
      'Universities expand scholarships for first-year students', 'Library opens late-night study space',
      'Teachers trial short lessons to boost focus', 'Students build weather station from recycled parts',
      'Online courses see surge in evening enrolments', 'School garden project feeds the whole canteen',
      'Exam board shares updated study timetable', 'Robotics club wins regional championship',
      'Free tutoring program reaches 5,000 learners', 'Language app partners with local schools'] },
    { name: 'Environment', hue: 120, blurb: 'Local groups say the effort could make a lasting difference.', titles: [
      'City plants 10,000 trees to cool dense neighborhoods', 'Solar farm begins powering thousands of homes',
      'River cleanup collects tons of plastic in a week', 'Wetland reserve welcomes first migratory flocks',
      'Villages switch to shared electric buses', 'Recycling drive turns old clothes into insulation',
      'Beach volunteers protect nesting turtles', 'Coastal wall plan balances homes and wildlife',
      'New rules cut single-use plastics in markets', 'Rooftop gardens help buildings stay cooler'] }
  ];

  // Dummy artwork: a small SVG scene per story (swap for real image URLs from your API)
  function art(hue, i) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',70%,60%)"/>' +
      '<stop offset="1" stop-color="hsl(' + (hue + 50) + ',70%,35%)"/></linearGradient></defs>' +
      '<rect width="320" height="180" fill="url(#g)"/>' +
      '<circle cx="' + (60 + (i * 53) % 200) + '" cy="' + (40 + (i * 29) % 50) + '" r="' + (28 + (i % 4) * 8) + '" fill="hsl(' + (hue + 20) + ',90%,85%)" opacity=".6"/>' +
      '<path d="M0 180V' + (120 + (i % 5) * 6) + 'Q80 ' + (90 + (i % 7) * 5) + ' 160 125T320 110V180Z" fill="hsl(' + hue + ',60%,25%)" opacity=".55"/></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29');
  }

  // Dummy article body paragraphs (swap for the real article text from your API)
  var body = [
    'Officials confirmed the development on Thursday, saying the decision followed several months of discussion with local groups and independent experts.',
    'Those close to the matter described the mood as cautious but hopeful. \u201cThis is a step in the right direction, and there is still plenty of work ahead,\u201d one participant said.',
    'Observers note that similar efforts elsewhere have taken time to show results, and that the next few weeks will be an important test of how well the plan holds up in practice.',
    'Further announcements are expected soon. This is sample content for demonstration only; replace it with the full story text from your news source.'
  ];

  // Interleave categories so every page shows a mix
  var items = [];
  for (var i = 0; i < 100; i++) {
    var c = categories[i % 10];
    var hours = 1 + (i * 7) % 46;
    items.push({
      id: i + 1,
      category: c.name,
      hue: c.hue,
      title: c.titles[Math.floor(i / 10)],
      summary: c.blurb + ' ' + tails[i % 3],
      source: sources[i % 6],
      time: hours < 24 ? hours + 'h ago' : '1d ago',
      readMinutes: 2 + (i % 5),
      content: body,
      image: art(c.hue, i),
      url: 'https://example.com/news/' + (i + 1)   // link to the original story (replace with real URLs)
    });
  }
  return items;
})();
