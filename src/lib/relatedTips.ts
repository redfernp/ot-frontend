import type { WpPost } from "@/lib/graphql";

// Minimal structured body so summarizeTip() can extract pick + odds for the coupon row.
// Real Paul365 posts include the full body; this just covers Best Bet + Bet365 Odds so
// the dev preview renders something realistic.
function couponContent(pick: string, odds: string): string {
  return `<h2>Best Bet</h2><p>OddsTips Top Value Bet: ${pick}</p><p>Bet365 Odds At Time Of Publication: ${odds}</p>`;
}

// Placeholder Premier League fixtures for the same matchday as the Sunderland v Chelsea preview.
// Replaced by a real WPGraphQL query (same category, same kickoff date) once ACF date fields land.
export const placeholderRelatedTips: WpPost[] = [
  {
    id: "related-arsenal-tottenham",
    slug: "arsenal-v-tottenham-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/arsenal-v-tottenham-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Arsenal v Tottenham - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T12:30:00",
    content: couponContent("Arsenal", "1.72"),
  },
  {
    id: "related-liverpool-newcastle",
    slug: "liverpool-v-newcastle-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/liverpool-v-newcastle-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Liverpool v Newcastle - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T15:00:00",
    content: couponContent("Liverpool", "1.55"),
  },
  {
    id: "related-man-city-everton",
    slug: "manchester-city-v-everton-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/manchester-city-v-everton-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Manchester City v Everton - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T15:00:00",
    content: couponContent("Manchester City", "1.35"),
  },
  {
    id: "related-brentford-brighton",
    slug: "brentford-v-brighton-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/brentford-v-brighton-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Brentford v Brighton - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T15:00:00",
    content: couponContent("Draw", "3.40"),
  },
  {
    id: "related-aston-villa-bournemouth",
    slug: "aston-villa-v-bournemouth-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/aston-villa-v-bournemouth-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Aston Villa v Bournemouth - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T15:00:00",
    content: couponContent("Aston Villa", "1.83"),
  },
  {
    id: "related-fulham-crystal-palace",
    slug: "fulham-v-crystal-palace-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/fulham-v-crystal-palace-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Fulham v Crystal Palace - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T15:00:00",
    content: couponContent("Crystal Palace", "2.65"),
  },
  {
    id: "related-wolves-nottingham-forest",
    slug: "wolves-v-nottingham-forest-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/wolves-v-nottingham-forest-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Wolves v Nottingham Forest - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T15:00:00",
    content: couponContent("Nottingham Forest", "2.20"),
  },
  {
    id: "related-west-ham-leicester",
    slug: "west-ham-v-leicester-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/west-ham-v-leicester-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "West Ham v Leicester - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T15:00:00",
    content: couponContent("West Ham", "1.95"),
  },
  {
    id: "related-ipswich-southampton",
    slug: "ipswich-v-southampton-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/ipswich-v-southampton-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Ipswich v Southampton - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T17:30:00",
    content: couponContent("Ipswich", "2.10"),
  },
];

// Same-day tennis match placeholders for dev preview only. Replaced by a real
// WPGraphQL query against the tennis category once env is wired. Title pattern matches
// live oddstips.co.uk (Player A vs Player B - DD-MM-YYYY ...).
export const placeholderTennisTips: WpPost[] = [
  {
    id: "tennis-alcaraz-zverev",
    slug: "alcaraz-vs-zverev-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction",
    uri: "/alcaraz-vs-zverev-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction/",
    title: "Alcaraz vs Zverev - 24-05-2026 Free Fixed Odds Tip & Tennis Betting Prediction",
    date: "2026-05-24T13:00:00",
    content: couponContent("Alcaraz", "1.55"),
  },
  {
    id: "tennis-sinner-medvedev",
    slug: "sinner-vs-medvedev-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction",
    uri: "/sinner-vs-medvedev-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction/",
    title: "Sinner vs Medvedev - 24-05-2026 Free Fixed Odds Tip & Tennis Betting Prediction",
    date: "2026-05-24T14:30:00",
    content: couponContent("Sinner", "1.72"),
  },
  {
    id: "tennis-djokovic-ruud",
    slug: "djokovic-vs-ruud-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction",
    uri: "/djokovic-vs-ruud-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction/",
    title: "Djokovic vs Ruud - 24-05-2026 Free Fixed Odds Tip & Tennis Betting Prediction",
    date: "2026-05-24T15:30:00",
    content: couponContent("Djokovic", "1.40"),
  },
  {
    id: "tennis-swiatek-sabalenka",
    slug: "swiatek-vs-sabalenka-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction",
    uri: "/swiatek-vs-sabalenka-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction/",
    title: "Swiatek vs Sabalenka - 24-05-2026 Free Fixed Odds Tip & Tennis Betting Prediction",
    date: "2026-05-24T16:00:00",
    content: couponContent("Sabalenka", "2.10"),
  },
  {
    id: "tennis-rune-tsitsipas",
    slug: "rune-vs-tsitsipas-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction",
    uri: "/rune-vs-tsitsipas-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction/",
    title: "Rune vs Tsitsipas - 24-05-2026 Free Fixed Odds Tip & Tennis Betting Prediction",
    date: "2026-05-24T17:00:00",
    content: couponContent("Tsitsipas", "1.95"),
  },
  {
    id: "tennis-rybakina-gauff",
    slug: "rybakina-vs-gauff-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction",
    uri: "/rybakina-vs-gauff-24-05-2026-free-fixed-odds-tip-tennis-betting-prediction/",
    title: "Rybakina vs Gauff - 24-05-2026 Free Fixed Odds Tip & Tennis Betting Prediction",
    date: "2026-05-24T18:30:00",
    content: couponContent("Gauff", "1.85"),
  },
];

// Same-day international match placeholders for dev preview only. Replaced by a real
// WPGraphQL query against the international category once env is wired.
export const placeholderInternationalTips: WpPost[] = [
  {
    id: "international-spain-germany",
    slug: "spain-v-germany-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/spain-v-germany-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Spain v Germany - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T19:45:00",
    content: couponContent("Spain", "2.05"),
  },
  {
    id: "international-france-england",
    slug: "france-v-england-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/france-v-england-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "France v England - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T20:00:00",
    content: couponContent("Draw", "3.20"),
  },
  {
    id: "international-portugal-italy",
    slug: "portugal-v-italy-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/portugal-v-italy-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Portugal v Italy - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T17:45:00",
    content: couponContent("Portugal", "2.40"),
  },
  {
    id: "international-netherlands-belgium",
    slug: "netherlands-v-belgium-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/netherlands-v-belgium-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Netherlands v Belgium - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T15:00:00",
    content: couponContent("Netherlands", "1.85"),
  },
  {
    id: "international-croatia-denmark",
    slug: "croatia-v-denmark-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/croatia-v-denmark-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Croatia v Denmark - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T18:00:00",
    content: couponContent("Croatia", "2.30"),
  },
  {
    id: "international-poland-serbia",
    slug: "poland-v-serbia-24-05-2026-free-fixed-odds-tip-football-betting-prediction",
    uri: "/poland-v-serbia-24-05-2026-free-fixed-odds-tip-football-betting-prediction/",
    title: "Poland v Serbia - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
    date: "2026-05-24T20:45:00",
    content: couponContent("Serbia", "2.75"),
  },
];
