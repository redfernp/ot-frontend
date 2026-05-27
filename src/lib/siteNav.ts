// Site IA mirrored from live oddstips.co.uk. URLs preserved exactly (a few are stubs that
// point to `/` because the live site has gaps; that is authentic and we don't invent
// destinations). Two obvious typos on live (Mexican → /football/spain/, Polish →
// /football/usa/) are corrected to the right path here.

export type NavLink = {
  label: string;
  path: string;
};

export type CountryGroup = {
  country: string;
  path: string;
  children: NavLink[];
};

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
