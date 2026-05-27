// Site IA mirrored from live oddstips.co.uk. URLs preserved exactly (a few are stubs that
// point to `/` because the live site has gaps; that is authentic and we don't invent
// destinations). Two obvious typos on live (Mexican → /football/spain/, Polish →
// /football/usa/) are corrected to the right path here.

export type NavLink = {
  label: string;
  path: string;
};

export type NavLinkWithBlurb = NavLink & {
  blurb: string;
};

export type CountryGroup = {
  country: string;
  path: string;
  children: NavLink[];
};

export const homeSports: NavLink[] = [
  { label: "Football", path: "/football/" },
  { label: "Tennis", path: "/tennis/" },
  { label: "Cricket", path: "/cricket/" },
  { label: "Snooker", path: "/snooker/" },
  { label: "Darts", path: "/darts/" },
  { label: "Basketball", path: "/basketball/" },
];

export const homeLeagues: NavLink[] = [
  { label: "English Premier League", path: "/football/united-kingdom/england-premier-league/" },
  { label: "English Championship", path: "/football/united-kingdom/england-championship/" },
  { label: "Scottish Premiership", path: "/football/united-kingdom/scotland-premiership/" },
  { label: "UEFA Champions League", path: "/football/uefa/uefa-champions-league/" },
  { label: "UEFA Europa League", path: "/football/uefa/uefa-europa-league/" },
  { label: "UEFA Conference League", path: "/football/uefa/uefa-europa-conference-league/" },
  { label: "Spanish La Liga", path: "/football/spain/spain-primera-liga/" },
  { label: "Italian Serie A", path: "/football/italy/italy-serie-a/" },
  { label: "German Bundesliga", path: "/football/germany/germany-bundesliga-i/" },
];

export const homeRegions: NavLinkWithBlurb[] = [
  { label: "United Kingdom Football Tips", path: "/football/united-kingdom/", blurb: "Tips for every football game in England, Scotland, Wales & Northern Ireland" },
  { label: "Spanish Football Tips", path: "/football/spain/", blurb: "Tips for every football game in Spain from bottom leagues to La Liga." },
  { label: "Italian Football Tips", path: "/football/italy/", blurb: "Free predictions for every football game in Italy, including cups and Serie A/B/C." },
  { label: "French Football Tips", path: "/football/france/", blurb: "All France Football tips covered, including La Ligue 1/2 and Coupe de France" },
  { label: "German Football Tips", path: "/football/germany/", blurb: "All Germany football tips including Bundesliga, DFB-Pokal, DFL-Supercup" },
  { label: "Dutch Football Tips", path: "/football/holland/", blurb: "Free predictions for every football game in Netherlands, including the Dutch Eredivisie." },
  { label: "China Football Tips", path: "/football/china/", blurb: "Tips for every football game in China, including the Chinese Super League." },
  { label: "US Football Tips", path: "/football/usa/", blurb: "Betting tips for every football game in USA, including Major League Soccer." },
  { label: "Portuguese Football Tips", path: "/football/portugal/", blurb: "Free Tips for all football games in Portugal, including Portugal's Primeira Ligas." },
  { label: "Brazilian Football Tips", path: "/football/brazil/", blurb: "Tips for every football game in Brazil, including the Brasileiro Serie A." },
  { label: "Mexican Football Tips", path: "/football/mexico/", blurb: "Tips for every football game in Mexico, including the Mexican Liga MX." },
  { label: "Belgian Football Tips", path: "/football/belgium/", blurb: "Free predictions for every football game in Belgium, including the Belgian Jupiler Pro." },
  { label: "Swiss Football Tips", path: "/football/switzerland/", blurb: "Tips for every football game in Switzerland, including the Swiss Super League." },
  { label: "Russian Football Tips", path: "/football/russia/", blurb: "Betting tips for every football game in Russia, including Russian Premier League." },
  { label: "Ukrainian Football Tips", path: "/football/ukraine/", blurb: "Free Tips for all football games in Ukraine, including Ukrainian Premier League." },
  { label: "Turkish Football Tips", path: "/football/turkey/", blurb: "Tips for every football game in Turkey, including the Turkish SuperLig." },
  { label: "Japanese Football Tips", path: "/football/japan/", blurb: "Betting tips for every football game in Japan, including Japanese J1 League." },
  { label: "Argentinian Football Tips", path: "/football/argentina/", blurb: "Free Tips for all football games in Argentina, including Argentinian Primera Division." },
  { label: "Scottish Football Tips", path: "/football/scotland/", blurb: "Tips for every football game in Scotland, including the Scottish Premier League." },
  { label: "Polish Football Tips", path: "/football/poland/", blurb: "Betting tips for every football game in Poland, including Polish Ekstraklasa." },
  { label: "Australian Football Tips", path: "/football/australia/", blurb: "Free Tips for all football games in Australia, including Australian A-League." },
  { label: "UAE Football Tips", path: "/football/uae/", blurb: "Tips for every football game in UAE, including the Arabian Gulf League." },
  { label: "Qatar Football Tips", path: "/football/qatar/", blurb: "Betting tips for every football game in Qatar, including the Qatar Stars League." },
  { label: "Greek Football Tips", path: "/football/greece/", blurb: "Free Tips for all football games in Greece, including the Super League Greece." },
  { label: "Indian Football Tips", path: "/football/india/", blurb: "Tips for every football game in India, including the Indian Super League." },
  { label: "Egyptian Football Tips", path: "/football/egypt/", blurb: "Betting tips for every football game in Egypt, including the Egyptian Premier League." },
  { label: "Irish Football Tips", path: "/football/ireland/", blurb: "Free Tips for all football games in Ireland, including Irish Premier League." },
];

export const footballCountries: CountryGroup[] = [
  {
    country: "United Kingdom",
    path: "/football/united-kingdom/",
    children: [
      { label: "England Premier League", path: "/football/united-kingdom/england-premier-league/" },
      { label: "England Championship", path: "/football/united-kingdom/england-championship/" },
      { label: "England EFL Cup", path: "/football/united-kingdom/england-efl-cup/" },
      { label: "England FA Cup", path: "/football/united-kingdom/england-fa-cup/" },
      { label: "England League 1", path: "/football/united-kingdom/england-league-1/" },
      { label: "England League 2", path: "/football/united-kingdom/england-league-2/" },
      { label: "England National League", path: "/football/united-kingdom/england-national-league/" },
      { label: "Scotland Premiership", path: "/football/united-kingdom/scotland-premiership/" },
      { label: "Scotland Championship", path: "/football/united-kingdom/scotland-championship/" },
      { label: "Scotland League One", path: "/football/united-kingdom/scotland-league-one/" },
      { label: "Scotland League Two", path: "/football/united-kingdom/scotland-league-two/" },
    ],
  },
  {
    country: "Spain",
    path: "/football/spain/",
    children: [
      { label: "Spain Primera Liga", path: "/football/spain/spain-primera-liga/" },
      { label: "Spain Segunda", path: "/football/spain/spain-segunda/" },
      { label: "Spain Copa del Rey", path: "/football/spain/spain-copa-del-rey/" },
      { label: "Spain Primera Women", path: "/football/spain/spain-primera-women/" },
    ],
  },
  {
    country: "Italy",
    path: "/football/italy/",
    children: [
      { label: "Italy Serie A", path: "/football/italy/italy-serie-a/" },
      { label: "Italy Serie B", path: "/football/italy/italy-serie-b/" },
      { label: "Italy Lega Pro Cup", path: "/football/italy/italy-lega-pro-cup/" },
      { label: "Italy Campionato Primavera", path: "/football/italy/italy-campionato-primavera/" },
    ],
  },
  {
    country: "France",
    path: "/football/france/",
    children: [
      { label: "France Ligue 1", path: "/football/france/france-ligue-1/" },
      { label: "France Ligue 2", path: "/football/france/france-ligue-2/" },
      { label: "France Cup", path: "/football/france/france-cup/" },
      { label: "France National", path: "/football/france/france-national/" },
    ],
  },
  {
    country: "Germany",
    path: "/football/germany/",
    children: [
      { label: "Germany Bundesliga I", path: "/football/germany/germany-bundesliga-i/" },
      { label: "Germany Bundesliga II", path: "/football/germany/germany-bundesliga-ii/" },
      { label: "Germany 3.Liga", path: "/football/germany/germany-3-liga/" },
      { label: "Germany DFB Pokal", path: "/football/germany/germany-dfb-pokal/" },
    ],
  },
  {
    country: "Holland",
    path: "/football/holland/",
    children: [
      { label: "Holland Eredivisie", path: "/football/holland/holland-eredivisie/" },
      { label: "Holland Eerste Divisie", path: "/football/holland/holland-eerste-divisie/" },
      { label: "Holland Tweede Divisie", path: "/football/holland/holland-tweede-divisie/" },
    ],
  },
  {
    country: "UEFA & International",
    path: "/football/international/",
    children: [
      { label: "UEFA Champions League", path: "/football/uefa/uefa-champions-league/" },
      { label: "UEFA Europa League", path: "/football/uefa/uefa-europa-league/" },
      { label: "UEFA Super Cup", path: "/football/uefa/uefa-super-cup/" },
      { label: "International Match", path: "/football/international/international-match/" },
      { label: "Europe Friendlies", path: "/football/international/europe-friendlies/" },
    ],
  },
];

export const footballByRegion: { european: NavLink[]; americas: NavLink[]; restOfWorld: NavLink[] } = {
  european: [
    { label: "Armenia", path: "/football/armenia/" },
    { label: "Austria", path: "/football/austria/" },
    { label: "Belarus", path: "/football/belarus/" },
    { label: "Belgium", path: "/football/belgium/" },
    { label: "Bosnia & Herzegovina", path: "/football/bosnia-herzegovina/" },
    { label: "Bulgaria", path: "/football/bulgaria/" },
    { label: "Croatia", path: "/football/croatia/" },
    { label: "Cyprus", path: "/football/cyprus/" },
    { label: "Czech Republic", path: "/football/czech-republic/" },
    { label: "Denmark", path: "/football/denmark/" },
    { label: "England", path: "/football/united-kingdom/" },
    { label: "Estonia", path: "/football/estonia/" },
    { label: "France", path: "/football/france/" },
    { label: "Finland", path: "/football/finland/" },
    { label: "Germany", path: "/football/germany/" },
    { label: "Gibraltar", path: "/football/gibraltar/" },
    { label: "Greece", path: "/football/greece/" },
    { label: "Holland", path: "/football/holland/" },
    { label: "Hungary", path: "/football/hungary/" },
    { label: "Iceland", path: "/football/iceland/" },
    { label: "Italy", path: "/football/italy/" },
    { label: "Ireland", path: "/football/ireland/" },
    { label: "Kazakhstan", path: "/football/kazakhstan/" },
    { label: "Latvia", path: "/football/latvia/" },
    { label: "Malta", path: "/football/malta/" },
    { label: "Montenegro", path: "/football/montenegro/" },
    { label: "Norway", path: "/football/norway/" },
    { label: "Poland", path: "/football/poland/" },
    { label: "Portugal", path: "/football/portugal/" },
    { label: "Serbia", path: "/football/serbia/" },
    { label: "Slovakia", path: "/football/slovakia/" },
    { label: "Slovenia", path: "/football/slovenia/" },
    { label: "Spain", path: "/football/spain/" },
    { label: "Sweden", path: "/football/sweden/" },
    { label: "Switzerland", path: "/football/switzerland/" },
    { label: "Turkey", path: "/football/turkey/" },
    { label: "Ukraine", path: "/football/ukraine/" },
  ],
  americas: [
    { label: "Argentina", path: "/football/argentina/" },
    { label: "Bolivia", path: "/football/bolivia/" },
    { label: "Brazil", path: "/football/brazil/" },
    { label: "Chile", path: "/football/chile/" },
    { label: "Colombia", path: "/football/colombia/" },
    { label: "Costa Rica", path: "/football/costa-rica/" },
    { label: "Ecuador", path: "/football/ecuador/" },
    { label: "El Salvador", path: "/football/el-salvador/" },
    { label: "Guatemala", path: "/football/guatemala/" },
    { label: "Haiti", path: "/football/haiti/" },
    { label: "Mexico", path: "/football/mexico/" },
    { label: "Paraguay", path: "/football/paraguay/" },
    { label: "Peru", path: "/football/peru/" },
    { label: "Uruguay", path: "/football/uruguay/" },
    { label: "USA", path: "/football/usa/" },
    { label: "Venezuela", path: "/football/venezuela/" },
  ],
  restOfWorld: [
    { label: "Algeria", path: "/football/algeria/" },
    { label: "Australia", path: "/football/australia/" },
    { label: "Bahrain", path: "/football/bahrain/" },
    { label: "China", path: "/football/china/" },
    { label: "Egypt", path: "/football/egypt/" },
    { label: "Ghana", path: "/football/ghana/" },
    { label: "Indonesia", path: "/football/indonesia/" },
    { label: "Israel", path: "/football/israel/" },
    { label: "Japan", path: "/football/japan/" },
    { label: "Malaysia", path: "/football/malaysia/" },
    { label: "Mali", path: "/football/mali/" },
    { label: "Morocco", path: "/football/morocco/" },
    { label: "New Zealand", path: "/football/new-zealand/" },
    { label: "Qatar", path: "/football/qatar/" },
    { label: "Rwanda", path: "/football/rwanda/" },
    { label: "Saudi Arabia", path: "/football/saudi-arabia/" },
    { label: "Senegal", path: "/football/senegal/" },
    { label: "Singapore", path: "/football/singapore/" },
    { label: "South Africa", path: "/football/south-africa/" },
    { label: "Thailand", path: "/football/thailand/" },
    { label: "Tunisia", path: "/football/tunisia/" },
  ],
};

// Latest-tips homepage sections (which sport categories to fetch)
export const homeLatestSections: Array<{ label: string; slug: string; allHref: string }> = [
  { label: "Latest Football Betting Tips", slug: "football", allHref: "/football/" },
  { label: "Latest Cricket Betting Tips", slug: "cricket", allHref: "/cricket/" },
  { label: "Latest Tennis Betting Tips", slug: "tennis", allHref: "/tennis/" },
  { label: "Latest Darts Betting Tips", slug: "darts", allHref: "/darts/" },
  { label: "Latest Snooker Betting Tips", slug: "snooker", allHref: "/snooker/" },
];
