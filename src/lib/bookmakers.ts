// Bookmaker review fixtures. Currently hand-authored; planned to move to an ACF Pro
// field group on a `bookmaker` CPT (see HANDOFF.md Codex TODO #7).
//
// Lives in its own file because Astro hoists getStaticPaths into an isolated module
// scope that cannot see top-level constants in the page frontmatter. Importing the
// data from a lib keeps the getStaticPaths in pages/reviews/[slug].astro working.

import type { Bookmaker } from "@/components/BookmakerReviewPage.astro";

export const bookmakers: Record<string, Bookmaker> = {
  bet365: {
    slug: "bet365",
    brand: "Bet365",
    color: "#027a3e",
    rating: 4.8,
    tagline: "The all-rounder. Best 1x2 odds, market depth and live streaming.",
    established: "2000",
    license: "UKGC, MGA",
    minDeposit: "5",
    payout: "1 to 3 business days",
    payments: ["Visa", "Mastercard", "PayPal", "Apple Pay", "Bank Transfer", "Skrill", "Neteller"],
    bonus: {
      headline: "Bet 10, Get 30 in Free Bets",
      code: "OTBONUS",
      cta: "Claim 30 free bet",
      terms: "New customers only. Min deposit 10. Free bets paid as bet credits. T&Cs apply. 18+. BeGambleAware.org.",
      wagering: "1x",
      expiry: "30 days",
    },
    pros: [
      "Best 1x2 odds across the Premier League",
      "Cash out on 5,000+ markets",
      "Free live streaming for funded accounts",
      "Bet builder available pre-match and in-play",
    ],
    cons: [
      "Withdrawal can take up to 3 days",
      "Limits for sharp punters can be tight",
    ],
    scores: [
      { label: "Odds quality", value: 4.9 },
      { label: "Market depth", value: 4.9 },
      { label: "Welcome offer", value: 4.4 },
      { label: "Mobile app", value: 4.8 },
      { label: "Customer support", value: 4.6 },
      { label: "Banking", value: 4.5 },
    ],
    sections: [
      {
        id: "markets",
        title: "Markets and odds",
        body: "<p>Bet365 leads the UK market on Premier League price quality and depth, with 200+ markets on most fixtures and competitive lines across European leagues, Champions League and the EFL.</p><p>Bet builder, request a bet and cash-out are all available pre-match and in-play. Acca insurance returns your stake on five-fold-plus accumulators when one leg lets you down.</p>",
      },
      {
        id: "app",
        title: "App and mobile experience",
        body: "<p>The Bet365 app is the benchmark in the UK. Fast bet placement, live streaming, in-play stats and biometric login. Push notifications for own-team scorelines and live cash-out alerts.</p>",
      },
      {
        id: "banking",
        title: "Deposits, withdrawals and security",
        body: "<p>Deposits process instantly via Visa, Mastercard, PayPal and Apple Pay. Withdrawals take 1 to 3 business days depending on method. SCA two-factor auth is enforced for card transactions.</p>",
      },
      {
        id: "support",
        title: "Customer support",
        body: "<p>24/7 live chat with average response under 90 seconds in our tests. Help centre is extensive and covers responsible gambling tools, KYC, account verification and odds-format changes.</p>",
      },
    ],
    faqs: [
      {
        q: "Is Bet365 legit in the UK?",
        a: "Yes. Bet365 is licensed by the UK Gambling Commission and the Malta Gaming Authority. It's one of the largest regulated sportsbooks in the world.",
      },
      {
        q: "How long do Bet365 withdrawals take?",
        a: "Card withdrawals typically take 1 to 3 business days; PayPal is usually same-day; bank transfer 1 to 5 days.",
      },
      {
        q: "Does Bet365 offer free live streaming?",
        a: "Yes, funded accounts can stream thousands of events per year including football, tennis and basketball.",
      },
      {
        q: "What is the Bet365 welcome offer?",
        a: "Bet 10, get 30 in free bets for new customers. Min deposit 10; free bets paid as bet credits; T&Cs apply.",
      },
    ],
  },
  "william-hill": {
    slug: "william-hill",
    brand: "William Hill",
    color: "#0b3d91",
    rating: 4.6,
    tagline: "British high-street institution with the biggest free bet of our top picks.",
    established: "1934",
    license: "UKGC",
    minDeposit: "10",
    payout: "1 to 5 business days",
    payments: ["Visa", "Mastercard", "PayPal", "Apple Pay", "Bank Transfer", "Paysafecard"],
    bonus: {
      headline: "Bet 10, Get 40 in Free Bets",
      code: "WHFB40",
      cta: "Claim 40 free bet",
      terms: "New customers only. Min deposit 10. Free bets paid as 4x10 tokens. T&Cs apply. 18+. BeGambleAware.org.",
      wagering: "1x",
      expiry: "30 days",
    },
    pros: [
      "Highest free bet value of our top four",
      "Strong football market depth and EPL coverage",
      "Boosted odds offers most days",
      "Shop-and-online integration",
    ],
    cons: [
      "Mobile app feels dated next to Bet365",
      "Withdrawal can extend to 5 days for bank transfer",
    ],
    scores: [
      { label: "Odds quality", value: 4.5 },
      { label: "Market depth", value: 4.6 },
      { label: "Welcome offer", value: 4.8 },
      { label: "Mobile app", value: 4.2 },
      { label: "Customer support", value: 4.4 },
      { label: "Banking", value: 4.5 },
    ],
    sections: [
      {
        id: "markets",
        title: "Markets and odds",
        body: "<p>William Hill offers solid football coverage across the EPL, Championship and Champions League with 150+ markets per top match, plus best-odds-guaranteed promotions and strong in-play depth.</p>",
      },
      {
        id: "app",
        title: "App and mobile experience",
        body: "<p>The William Hill app gets the job done but doesn't match Bet365 for polish. Live streaming is more limited and the bet builder UX is fiddly on smaller screens.</p>",
      },
      {
        id: "banking",
        title: "Deposits, withdrawals and security",
        body: "<p>Deposits are instant. Withdrawals take 1 to 5 business days depending on method. PayPal is fastest.</p>",
      },
      {
        id: "support",
        title: "Customer support",
        body: "<p>24/7 live chat and a UK phone number. In-shop support is also a real differentiator for high-street customers.</p>",
      },
    ],
    faqs: [
      {
        q: "Is William Hill safe?",
        a: "Yes. William Hill is licensed by the UKGC and has operated continuously since 1934.",
      },
      {
        q: "Does William Hill offer best odds guaranteed?",
        a: "Yes, on every UK and Irish horse race, both pre-race and at the off.",
      },
      {
        q: "How do I claim the 40 free bet?",
        a: "Register a new account, deposit 10, place a 10 qualifying bet at evens (2.00) or higher, and 40 in free bets is credited automatically.",
      },
    ],
  },
};
