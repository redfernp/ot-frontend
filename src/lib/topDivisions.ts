// 27 countries from the live homepage "Top 27 Football Betting Regions & Leagues"
// mapped to their top-division category page. League slugs known to exist on the live
// site use the deep URL. The handful that are not yet in our extracted IA use the
// country hub as a sensible fallback (Paul365 routes the visitor on to the league).
//
// Once WPGraphQL exposes a "top division" taxonomy field, this map can become
// data-driven. For now it's authored manually so the design renders with real link
// targets and the same labels Google has already indexed.

export type TopDivision = {
  country: string;
  countryPath: string;
  league: string;
  leaguePath: string;
  blurb: string;
};

export const topDivisions: TopDivision[] = [
  {
    country: "England",
    countryPath: "/football/united-kingdom/",
    league: "Premier League",
    leaguePath: "/football/united-kingdom/england-premier-league/",
    blurb: "Top flight English football. Twenty clubs, every matchday previewed.",
  },
  {
    country: "Spain",
    countryPath: "/football/spain/",
    league: "La Liga",
    leaguePath: "/football/spain/spain-primera-liga/",
    blurb: "Spain's Primera Liga, from El Clasico to mid-table value spots.",
  },
  {
    country: "Italy",
    countryPath: "/football/italy/",
    league: "Serie A",
    leaguePath: "/football/italy/italy-serie-a/",
    blurb: "Italian Serie A predictions across every Saturday and Sunday slate.",
  },
  {
    country: "France",
    countryPath: "/football/france/",
    league: "Ligue 1",
    leaguePath: "/football/france/france-ligue-1/",
    blurb: "France Ligue 1 tips covering PSG and the chasing pack.",
  },
  {
    country: "Germany",
    countryPath: "/football/germany/",
    league: "Bundesliga",
    leaguePath: "/football/germany/germany-bundesliga-i/",
    blurb: "Bundesliga first-tier picks plus DFB-Pokal cup runs.",
  },
  {
    country: "Holland",
    countryPath: "/football/holland/",
    league: "Eredivisie",
    leaguePath: "/football/holland/holland-eredivisie/",
    blurb: "Dutch Eredivisie predictions for every PSV, Ajax and Feyenoord weekend.",
  },
  {
    country: "Portugal",
    countryPath: "/football/portugal/",
    league: "Primeira Liga",
    leaguePath: "/football/portugal/",
    blurb: "Portugal's Primeira Liga: Benfica, Porto, Sporting and the chasers.",
  },
  {
    country: "Belgium",
    countryPath: "/football/belgium/",
    league: "Jupiler Pro League",
    leaguePath: "/football/belgium/",
    blurb: "Belgian Jupiler Pro League top-flight picks every matchweek.",
  },
  {
    country: "Switzerland",
    countryPath: "/football/switzerland/",
    league: "Super League",
    leaguePath: "/football/switzerland/",
    blurb: "Swiss Super League tips across the full Saturday card.",
  },
  {
    country: "Scotland",
    countryPath: "/football/scotland/",
    league: "Premiership",
    leaguePath: "/football/united-kingdom/scotland-premiership/",
    blurb: "Scottish Premiership tips: Old Firm, top-six split and relegation scraps.",
  },
  {
    country: "Ireland",
    countryPath: "/football/ireland/",
    league: "Premier Division",
    leaguePath: "/football/ireland/",
    blurb: "League of Ireland Premier Division predictions through the summer schedule.",
  },
  {
    country: "Greece",
    countryPath: "/football/greece/",
    league: "Super League",
    leaguePath: "/football/greece/",
    blurb: "Greek Super League picks across the Athens and northern clubs.",
  },
  {
    country: "Turkey",
    countryPath: "/football/turkey/",
    league: "Super Lig",
    leaguePath: "/football/turkey/",
    blurb: "Turkish Super Lig predictions: Galatasaray, Fenerbahce and Besiktas.",
  },
  {
    country: "Russia",
    countryPath: "/football/russia/",
    league: "Premier League",
    leaguePath: "/football/russia/",
    blurb: "Russian Premier League weekly picks and cup ties.",
  },
  {
    country: "Ukraine",
    countryPath: "/football/ukraine/",
    league: "Premier League",
    leaguePath: "/football/ukraine/",
    blurb: "Ukrainian Premier League previews and European-qualification angles.",
  },
  {
    country: "Poland",
    countryPath: "/football/poland/",
    league: "Ekstraklasa",
    leaguePath: "/football/poland/",
    blurb: "Polish Ekstraklasa tips across every Friday-to-Monday matchweek.",
  },
  {
    country: "USA",
    countryPath: "/football/usa/",
    league: "Major League Soccer",
    leaguePath: "/football/usa/",
    blurb: "MLS predictions covering the regular season and the playoffs.",
  },
  {
    country: "Mexico",
    countryPath: "/football/mexico/",
    league: "Liga MX",
    leaguePath: "/football/mexico/",
    blurb: "Mexican Liga MX Apertura and Clausura picks each matchday.",
  },
  {
    country: "Brazil",
    countryPath: "/football/brazil/",
    league: "Serie A",
    leaguePath: "/football/brazil/",
    blurb: "Brasileirao Serie A weekly tips, Wednesday rounds included.",
  },
  {
    country: "Argentina",
    countryPath: "/football/argentina/",
    league: "Primera Division",
    leaguePath: "/football/argentina/",
    blurb: "Argentinian Primera Division picks: Boca, River and the historic clubs.",
  },
  {
    country: "Australia",
    countryPath: "/football/australia/",
    league: "A-League",
    leaguePath: "/football/australia/",
    blurb: "A-League predictions across the full Australian summer season.",
  },
  {
    country: "Japan",
    countryPath: "/football/japan/",
    league: "J1 League",
    leaguePath: "/football/japan/",
    blurb: "Japanese J1 League tips, Saturday slate plus midweek cup ties.",
  },
  {
    country: "China",
    countryPath: "/football/china/",
    league: "Super League",
    leaguePath: "/football/china/",
    blurb: "Chinese Super League predictions across the long summer calendar.",
  },
  {
    country: "India",
    countryPath: "/football/india/",
    league: "Indian Super League",
    leaguePath: "/football/india/",
    blurb: "Indian Super League tips and I-League promotion races.",
  },
  {
    country: "Egypt",
    countryPath: "/football/egypt/",
    league: "Premier League",
    leaguePath: "/football/egypt/",
    blurb: "Egyptian Premier League picks: Al Ahly, Zamalek and the chasing pack.",
  },
  {
    country: "Qatar",
    countryPath: "/football/qatar/",
    league: "Stars League",
    leaguePath: "/football/qatar/",
    blurb: "Qatar Stars League predictions across the Doha schedule.",
  },
  {
    country: "UAE",
    countryPath: "/football/uae/",
    league: "Pro League",
    leaguePath: "/football/uae/",
    blurb: "UAE Pro League (Arabian Gulf League) picks every matchweek.",
  },
];
