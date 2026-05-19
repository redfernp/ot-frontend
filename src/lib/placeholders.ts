import type { WpCategory, WpPost } from "@/lib/graphql";

export const placeholderCategory: WpCategory = {
  id: "placeholder-category",
  slug: "example",
  uri: "/category/example/",
  name: "Example Category",
  description: "This placeholder will be replaced by staging WordPress category data once WPGraphQL is configured.",
};

export const placeholderPost: WpPost = {
  id: "placeholder-post",
  slug: "example-tip",
  uri: "/tips/example-tip/",
  title: "Sunderland v Chelsea - 24-05-2026 Free Fixed Odds Tip & Football Betting Prediction",
  excerpt: "This placeholder will be replaced by a real Paul365 tip post from staging WordPress.",
  content: `
    <p>Looking for Sunderland v Chelsea free predictions?</p>
    <p>Scroll down for our fixed odds betting tip.</p>
    <h2>Event</h2>
    <p>This football match features Sunderland playing against Chelsea (United Kingdom, England Premier League).</p>
    <h2>Start Time</h2>
    <p>16:00 (UK time), Sun, 24th May 2026.</p>
    <h2>Game-Flow</h2>
    <p>Tactical</p>
    <h2>First Goal</h2>
    <p>Late</p>
    <h2>Source Of First Goal</h2>
    <p>Tap-In</p>
    <h2>Risk Of Injuries</h2>
    <p>Low</p>
    <h2>Corner Count</h2>
    <p>High</p>
    <h2>Bookings</h2>
    <p>High</p>
    <h2>Penalties Awarded</h2>
    <p>Likely</p>
    <h2>Key Area</h2>
    <p>Central</p>
    <h2>Best Bet</h2>
    <p>OddsTips Top Value Bet: Chelsea</p>
    <p>Bet365 Odds At Time Of Publication: 1.91</p>
    <h2>Returns</h2>
    <p>A &pound;100 bet on this outcome returns a total of &pound;191, which includes your returned stake.</p>
    <h2>Value</h2>
    <p>Our data indicates that this is a good value bet. For best results, only bet on this outcome if you can get the advised odds or better.</p>
    <p>Back this tip with Bet365.</p>
    <h2>Related Reading</h2>
    <p>Best Football Betting Sites UK</p>
    <p>Recommended Football Tipster - NEW TIPSTER ALERT</p>
    <p>Join The FOOTBALLER TIPS SERVICE Now - See WINNING GRAPH - UPDATED DAILY.</p>
  `,
  date: new Date().toISOString(),
};
