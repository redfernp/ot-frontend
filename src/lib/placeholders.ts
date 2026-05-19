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
    <h2>Event</h2>
    <p>This football match features Sunderland playing against Chelsea (England Premier League).</p>
    <h2>Start Time</h2>
    <p>15:00 (UK time), Sun, 24th May 2026.</p>
    <h2>Game-Flow</h2>
    <p>Controlled away pressure</p>
    <h2>Best Bet</h2>
    <p>OddsTips Top Value Bet: Chelsea</p>
    <p>Bet365 Odds At Time Of Publication: 1.80</p>
  `,
  date: new Date().toISOString(),
};
