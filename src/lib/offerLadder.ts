// Oddstips offer ladder: the Top 3 offers with every other partner offer under "View all".
// Placed below the main content on match tip pages (after the tipster's read) and on the
// football tips pages (just above "Previous tips"), so the content Google ranks comes first.
//
// Offer copy (headline, terms, link) comes from bookmakers.ts, so terms stay in one place.
// LADDER_ORDER sets the ranking. Betfred is pinned at #1; reorder the rest by hand.
// Every offer shows its full terms (UK ad rules: significant terms must be visible).
import { bookmakers } from "@/lib/bookmakers";

const PINNED_FIRST = "betfred";
export const LADDER_ORDER = ["betfred", "betway", "quinnbet", "spreadex", "betwright", "fafabet", "netbet", "10bet", "mrplaysport"];

const LOGOS: Record<string, string> = {
  betfred: "https://www.everytip.co.uk/wp-content/uploads/2018/06/betfred-154x40.png",
  betway: "https://www.everytip.co.uk/wp-content/uploads/2018/03/Betway-sport-bets-review.jpg",
  quinnbet: "https://www.everytip.co.uk/wp-content/uploads/2024/09/quinnbet-logo-328.png",
  spreadex: "https://www.everytip.co.uk/wp-content/uploads/2024/03/SPX_1_Sports-Primarylogo-WO-11.png",
  betwright: "https://www.everytip.co.uk/wp-content/uploads/2025/04/betwright-logo-light-400px.png",
  fafabet: "https://www.everytip.co.uk/wp-content/uploads/2024/05/fafabet-logo.png",
  netbet: "https://www.everytip.co.uk/wp-content/uploads/2018/04/NetBet_Logo-2CRev-48px.png",
  "10bet": "https://www.everytip.co.uk/wp-content/uploads/2019/07/new-10bet-150x40-logo.jpg",
  mrplaysport: "https://www.everytip.co.uk/wp-content/uploads/2021/09/mrplay-sport-logo-blue-150x40-1.png",
};

const escape = (value: string | undefined) =>
  String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function ladderOffers() {
  const keys = [PINNED_FIRST, ...LADDER_ORDER.filter((key) => key !== PINNED_FIRST)];
  return keys
    .map((key) => ({ key, bookie: bookmakers[key] }))
    .filter(({ bookie }) => bookie?.bonus?.headline && bookie.bonus.terms && bookie.offerHref);
}

type LadderOptions = {
  heading?: string;
  // Prefix for data-affiliate-location, so GA4 tells the placements apart (…_top / …_more).
  location: string;
  count?: number;
};

// HTML string, so it can go into WordPress page content as well as Astro templates.
export function renderOfferLadder({ heading = "Today's Top 3 Betting Offers", location, count = 3 }: LadderOptions) {
  const all = ladderOffers();
  const shown = Math.min(count, all.length);
  const row = ({ key, bookie }: (typeof all)[number], rank: number, part: "top" | "more") => {
    const logo = LOGOS[key];
    return `<li class="ot-ladder__row" style="--ladder-brand:${escape(bookie.color)}">`
      + `<span class="ot-ladder__rank">${rank}</span>`
      + `<span class="ot-ladder__logo">${logo ? `<img src="${escape(logo)}" alt="${escape(bookie.brand)}" loading="lazy" width="138" height="40">` : `<b>${escape(bookie.brand)}</b>`}</span>`
      + `<div class="ot-ladder__copy"><h3>${escape(bookie.bonus.headline)}</h3><p>#Ad - ${escape(bookie.bonus.terms)}</p></div>`
      + `<a class="ot-ladder__cta" href="${escape(bookie.offerHref)}" rel="nofollow sponsored" data-affiliate-location="${escape(location)}_${part}">Claim with ${escape(bookie.brand)}</a></li>`;
  };
  const top = all.slice(0, shown).map((offer, i) => row(offer, i + 1, "top")).join("");
  const more = all.slice(shown).map((offer, i) => row(offer, shown + i + 1, "more")).join("");
  return `<section class="ot-ladder" aria-label="${escape(heading)}">`
    + `<div class="ot-ladder__head"><h2>${escape(heading)}</h2><p>New customers only · 18+ · T&amp;Cs apply</p></div>`
    + `<ol class="ot-ladder__list">${top}</ol>`
    + (more ? `<details class="ot-ladder__more"><summary><span class="ot-ladder__show">View all ${all.length} offers</span><span class="ot-ladder__hide">Show top ${shown} only</span></summary><ol class="ot-ladder__list" start="${shown + 1}">${more}</ol></details>` : "")
    + `<p class="ot-ladder__foot">18+ · BeGambleAware.org · GamCare.org.uk · Please gamble responsibly</p></section>`;
}

// Football tips pages: the ladder goes just above the plugin's "Previous tips" heading.
const PREVIOUS_TIPS = /<h2 class="ot-strong__history-title">/;
export function insertLadderBeforePreviousTips(html: string, location: string) {
  return PREVIOUS_TIPS.test(html) ? html.replace(PREVIOUS_TIPS, (match) => renderOfferLadder({ location }) + match) : html;
}
