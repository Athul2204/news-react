"""
Single place for everything you may want to edit:
  - the RSS feeds
  - the news categories (must match TOPICS in daybreak-react/src/data/options.js)
"""

# name -> (url, region tag, "prior" category)
# region tag: added to the article's tags (None = no region)
# prior:      for topic-specific feeds the category is very likely this one (None = general feed)
FEEDS = {
    # World
    "BBC World": ("https://feeds.bbci.co.uk/news/world/rss.xml", None, None),
    "CNN": ("http://rss.cnn.com/rss/edition.rss", None, None),
    "The Guardian": ("https://www.theguardian.com/world/rss", None, None),

    # India
    "Google News India": ("https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en", "India", None),
    "The Hindu": ("https://www.thehindu.com/feeder/default.rss", "India", None),
    "Indian Express": ("https://indianexpress.com/feed/", "India", None),
    "NDTV": ("https://feeds.feedburner.com/ndtvnews-top-stories", "India", None),

    # Kerala
    "Google News Kerala": ("https://news.google.com/rss/search?q=Kerala&hl=en-IN&gl=IN&ceid=IN:en", "Kerala", None),
    "Google News Malayalam": ("https://news.google.com/rss/search?q=Kerala&hl=ml&gl=IN&ceid=IN:ml", "Kerala", None),

    # Technology / AI
    "BBC Technology": ("https://feeds.bbci.co.uk/news/technology/rss.xml", None, "Technology"),
    "TechCrunch": ("https://techcrunch.com/feed/", None, "Technology"),
    "The Verge": ("https://www.theverge.com/rss/index.xml", None, "Technology"),
    "Wired": ("https://www.wired.com/feed/rss", None, "Technology"),
    "Google News AI": ("https://news.google.com/rss/search?q=artificial+intelligence&hl=en-IN&gl=IN&ceid=IN:en", None, "Technology"),
    "Google News Machine Learning": ("https://news.google.com/rss/search?q=machine+learning&hl=en-IN&gl=IN&ceid=IN:en", None, "Technology"),

    # Business
    "Economic Times": ("https://economictimes.indiatimes.com/rssfeedstopstories.cms", "India", "Business"),

    # Science
    "NASA": ("https://www.nasa.gov/feed/", None, "Science"),
    "ScienceDaily": ("https://www.sciencedaily.com/rss/all.xml", None, "Science"),

    # Sports
    "BBC Sport": ("https://feeds.bbci.co.uk/sport/rss.xml", None, "Sports"),
}

# Categories shown in the app.
#   hue      colour of the dot / card tint in the frontend
#   desc     sentence(s) used for embedding similarity (meaning based)
#   keywords whole-word keywords used when the embedding model is not installed
# "World" is also the default bucket for general news that matches nothing else.
CATEGORIES = {
    "World": {
        "hue": 210,
        "desc": "world news, politics, government, elections, parliament, ministers, war, conflict, "
                "diplomacy, crime, police, courts, protests",
        "keywords": [],
    },
    "Business": {
        "hue": 150,
        "desc": "business, economy, stock markets, companies, finance, banks, trade, inflation, "
                "investment, startups funding, jobs and layoffs",
        "keywords": [
            "stock", "stocks", "sensex", "nifty", "market", "markets", "shares", "investor", "investors",
            "bank", "banks", "rbi", "inflation", "gdp", "economy", "economic", "profit", "profits",
            "revenue", "earnings", "ipo", "trade", "tariff", "tariffs", "funding", "valuation", "merger",
            "acquisition", "billion", "crore", "rupee", "dollar", "layoffs", "gst", "budget", "company",
            "companies", "business", "ceo", "retail", "sales", "prices", "fuel", "gold", "loan", "loans",
        ],
    },
    "Technology": {
        "hue": 265,
        "desc": "technology, software, gadgets, smartphones, internet, apps, artificial intelligence, "
                "machine learning, chatbots, chips, cybersecurity, startups",
        "keywords": [
            "tech", "technology", "software", "app", "apps", "iphone", "android", "google", "apple",
            "microsoft", "openai", "anthropic", "ai", "artificial intelligence", "chatbot", "chatgpt",
            "machine learning", "llm", "chip", "chips", "semiconductor", "cyber", "cybersecurity", "hackers",
            "hack", "data breach", "smartphone", "smartphones", "laptop", "internet", "robot", "robots",
            "nvidia", "samsung", "gpu", "algorithm", "cloud", "startup", "startups", "gadget", "gadgets",
            "tesla", "spacex", "meta", "whatsapp", "instagram",
        ],
    },
    "Sports": {
        "hue": 25,
        "desc": "sports, cricket, football, tennis, tournaments, matches, players, coaches, league, olympics",
        "keywords": [
            "cricket", "ipl", "bcci", "match", "matches", "football", "goal", "goals", "league", "tournament",
            "olympic", "olympics", "athlete", "athletes", "tennis", "badminton", "hockey", "world cup",
            "champion", "champions", "championship", "coach", "wicket", "wickets", "innings", "batter",
            "bowler", "fifa", "nba", "f1", "grand prix", "medal", "kabaddi", "premier league", "t20",
            "test series", "captain", "squad", "stadium", "player", "players",
        ],
    },
    "Science": {
        "hue": 190,
        "desc": "science, research, space exploration, astronomy, physics, scientific discoveries, "
                "scientists, experiments, satellites and rockets",
        "keywords": [
            "nasa", "space", "isro", "astronomy", "planet", "planets", "scientists", "researchers",
            "discovery", "physics", "quantum", "telescope", "asteroid", "mars", "moon", "satellite",
            "rocket", "species", "fossil", "genome", "experiment", "scientific", "study", "universe",
            "galaxy", "astronaut", "astronauts", "orbit", "laboratory", "chemistry", "biology",
        ],
    },
    "Health": {
        "hue": 350,
        "desc": "health, medicine, diseases, hospitals, doctors, vaccines, cancer, mental health, nutrition, outbreaks",
        "keywords": [
            "health", "hospital", "hospitals", "doctor", "doctors", "disease", "diseases", "cancer",
            "vaccine", "vaccines", "virus", "covid", "patient", "patients", "medical", "medicine", "drug",
            "drugs", "surgery", "mental health", "diabetes", "heart", "nutrition", "diet", "outbreak",
            "dengue", "nipah", "fever", "symptoms", "therapy", "clinic", "wellness", "obesity",
        ],
    },
    "Entertainment": {
        "hue": 300,
        "desc": "entertainment, movies, cinema, actors, music, celebrities, television, streaming series, film festivals",
        "keywords": [
            "film", "films", "movie", "movies", "cinema", "actor", "actress", "bollywood", "hollywood",
            "netflix", "series", "box office", "album", "singer", "song", "songs", "music", "concert",
            "celebrity", "celebrities", "director", "trailer", "oscar", "oscars", "taylor swift", "tv",
            "web series", "mollywood", "kollywood", "tollywood", "theatre",
        ],
    },
    "Travel": {
        "hue": 45,
        "desc": "travel, tourism, holidays, flights, airlines, airports, railways, trains, hotels, destinations",
        "keywords": [
            "travel", "tourism", "tourist", "tourists", "airline", "airlines", "flight", "flights",
            "airport", "airports", "train", "trains", "railway", "railways", "hotel", "hotels", "visa",
            "destination", "destinations", "cruise", "trek", "itinerary", "passengers", "metro",
            "holiday", "holidays", "vacation", "ferry", "journey", "highway",
        ],
    },
    "Education": {
        "hue": 235,
        "desc": "education, schools, universities, colleges, students, exams, teachers, admissions, scholarships",
        "keywords": [
            "school", "schools", "student", "students", "university", "universities", "college", "colleges",
            "exam", "exams", "neet", "jee", "cbse", "ugc", "admission", "admissions", "teacher", "teachers",
            "curriculum", "scholarship", "campus", "board exam", "syllabus", "education", "learning",
            "vidyarambham", "classroom",
        ],
    },
    "Environment": {
        "hue": 120,
        "desc": "environment, climate change, pollution, wildlife, forests, weather, rainfall, floods, "
                "cyclones, earthquakes, conservation, renewable energy",
        "keywords": [
            "climate", "pollution", "environment", "environmental", "wildlife", "forest", "forests",
            "flood", "floods", "rain", "rains", "rainfall", "monsoon", "cyclone", "earthquake", "landslide",
            "heatwave", "emissions", "carbon", "air quality", "aqi", "elephant", "elephants",
            "drought", "renewable", "solar", "global warming", "biodiversity", "conservation", "weather",
            "imd", "storm", "wildfire", "plastic", "waste", "farmers", "farmer", "rice", "agriculture",
        ],
    },
}

CATEGORY_NAMES = list(CATEGORIES)
DEFAULT_CATEGORY = "World"
HUES = {name: c["hue"] for name, c in CATEGORIES.items()}

# Malayalam keyword stems for the fast (no model) categoriser. They are matched at the START of a word and
# may be followed by suffixes (Malayalam attaches endings to words), e.g. "മഴ" also matches "മഴയോട്".
# Add more stems here whenever you see a Malayalam story in the wrong category.
KEYWORDS_ML = {
    "Business": ["ബാങ്ക്", "ഓഹരി", "സ്വർണ", "സാമ്പത്തിക", "നിക്ഷേപ", "ബജറ്റ്", "വായ്പ", "ജിഎസ്ടി", "കമ്പനി",
                 "ഷെയർ", "സെൻസെക്സ്", "വ്യാപാര", "ലാഭ", "വിലക്കയറ്റ", "റിസർവ് ബാങ്ക്", "സ്റ്റാർട്ടപ്"],
    "Technology": ["ടെക്", "സ്മാർട്ട്ഫോൺ", "ഐഫോൺ", "ഗൂഗിൾ", "വാട്സ്ആപ്പ്", "ഇൻസ്റ്റഗ്രാം", "എഐ", "നിർമിതബുദ്ധി",
                   "സൈബർ", "ഹാക്ക്", "മൊബൈൽ", "ആപ്പ്", "ഇന്റർനെറ്റ്", "ചാറ്റ്ജിപിടി", "സോഫ്റ്റ്‌വെയർ"],
    "Sports": ["ക്രിക്കറ്റ്", "ഫുട്ബോൾ", "ഫുട്ബാൾ", "ബ്ലാസ്റ്റേഴ്സ്", "ഐപിഎൽ", "ഗോൾ", "ടൂർണമെന്റ്", "ഒളിമ്പിക്സ്",
               "ബാഡ്മിന്റൺ", "ടെന്നീസ്", "ഹോക്കി", "ലീഗ്", "വിക്കറ്റ്", "ലോകകപ്പ്", "കായിക", "സന്തോഷ് ട്രോഫി"],
    "Science": ["ശാസ്ത്ര", "ഐഎസ്ആർഒ", "നാസ", "ബഹിരാകാശ", "ഗവേഷണ", "ഗ്രഹ", "ഉപഗ്രഹ", "റോക്കറ്റ്", "ഗവേഷക"],
    "Health": ["ആശുപത്രി", "രോഗ", "ചികിത്സ", "ഡോക്ടർ", "വാക്സിൻ", "കാൻസർ", "പനി", "ആരോഗ്യ", "നിപ", "ഡെങ്കി",
               "മരുന്ന്", "ശസ്ത്രക്രിയ", "എലിപ്പനി", "ലഹരി"],
    "Entertainment": ["സിനിമ", "ചലച്ചിത്ര", "നടൻ", "നടി", "സംവിധായക", "ഗാനം", "ഓസ്കർ", "ബിഗ് ബോസ്", "മോഹൻലാൽ",
                      "മമ്മൂട്ടി", "ട്രെയിലർ", "റിലീസ്", "ഒടിടി", "സീരിയൽ", "ഫിലിം"],
    "Travel": ["വിമാന", "ട്രെയിൻ", "റെയിൽ", "ടൂറിസം", "വിനോദസഞ്ചാര", "യാത്ര", "കെഎസ്ആർടിസി", "മെട്രോ", "ഹോട്ടൽ",
               "വിസ", "വന്ദേഭാരത്", "ബസ്"],
    "Education": ["വിദ്യാർഥി", "വിദ്യാർത്ഥി", "സ്കൂൾ", "പരീക്ഷ", "കോളേജ്", "കോളജ്", "സർവകലാശാല", "വിദ്യാഭ്യാസ",
                  "അധ്യാപക", "വിദ്യാരംഭ", "പ്ലസ് ടു", "എസ്എസ്എൽസി", "സ്കോളർഷിപ്പ്", "അദ്ധ്യാപക", "പാഠ"],
    "Environment": ["മഴ", "കാലാവസ്ഥ", "ചുഴലിക്കാറ്റ്", "വെള്ളപ്പൊക്ക", "ഭൂചലന", "മലിനീകരണ", "വന്യജീവി", "കാട്ടാന",
                    "പരിസ്ഥിതി", "അലർട്ട്", "കനത്ത മഴ", "ഡാം", "ഉരുൾ", "ചൂട്", "വരൾച്ച", "കടലാക്രമണ"],
}
