// Affiliate link registry. Every outbound affiliate URL on the site goes through
// a self-hosted /go/{slug}/ redirector so we can fire a GA4 affiliate_click event
// before the browser leaves Oddstips.
//
// Destinations point at the partner network directly (Bet365, Betway, Tipstrr
// etc), bypassing the EveryTip /go/ middleman. Affiliate IDs baked into the URLs
// route commission to the correct (EveryTip) account; the redirects.txt source
// of truth lives on the EveryTip server and we mirror the relevant slugs here.
//
// When adding a new affiliate destination:
//   1. Pick a stable, lowercase, hyphenated slug
//   2. Add the direct URL (with affiliate ID) and a brand label
//   3. Use /go/{slug}/ in any template/data file that links to it
//   4. The static path is generated automatically by src/pages/go/[slug].astro
//
// Two slugs differ from the bookmaker key in bookmakers.ts:
//   - mrplaysport (bookmaker key) -> /go/mrplay/
//   - netbet      (bookmaker key) -> /go/netbet-50/

export type AffiliateLink = {
  destination: string;
  brand: string;
};

export const affiliateLinks: Record<string, AffiliateLink> = {
  "bet365": {
    destination: "https://www.bet365.com/hub/en-gb/open-account-offer?affiliate=365_371786",
    brand: "Bet365",
  },
  "betfred": {
    destination: "https://bfpartners.click/o/t9b-WJ?lpage=dRMZ-2&site_id=54649&r_id=332",
    brand: "Betfred",
  },
  "betway": {
    destination: "https://betway.com/bwp/bet10get40/en-gb/?s=bw41213&a=spadid223931",
    brand: "Betway",
  },
  "quinnbet": {
    destination: "https://quinnbet.click/o/p8sdpa?lpage=YuZWlV",
    brand: "QuinnBet",
  },
  "spreadex": {
    destination: "https://spreadex.com/?tid=786574",
    brand: "Spreadex",
  },
  "betwright": {
    destination: "https://refer.onyxaffiliates.com/redirect?cid=67ff798c7766cd997e38e84f&oid=644901df3d562de33590ec88&bid=67410b9e621f8bfcbc8e2170&pid=&customParameter=",
    brand: "BetWright",
  },
  "fafabet": {
    destination: "https://ffbt.link/o/6lBbK4?lpage=WtX_iY",
    brand: "Fafabet",
  },
  "netbet-50": {
    destination: "https://banners.livepartners.com/view.php?z=72193",
    brand: "NetBet",
  },
  "10bet": {
    destination: "https://track.10bet.com/C.ashx?btag=a_52705b_6192c_&affid=1680674&siteid=52705&adid=6192&c=",
    brand: "10Bet",
  },
  "mrplay": {
    destination: "https://online.mrplaypartners.com/promoRedirect?key=ej0yNDAwNDg0MSZsPTI0MDA0Nzk5JnA9MTEzMDk5",
    brand: "mr.playSPORT",
  },
  "footballer-tips-tipstrr": {
    destination: "https://tipstrr.com/tipster/footballer-tips?via=everytip",
    brand: "Pro Football Tips",
  },
};

// Helper for building cloaked URLs from a slug. Always returns the trailing
// slash form to match Astro's default static output.
export function affiliateLink(slug: string): string {
  return `/go/${slug}/`;
}
