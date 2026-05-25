import type { WpPost } from "@/lib/graphql";

export type CouponPick = "H" | "D" | "A" | null;

export type TipSummary = {
  fixture: string;
  homeTeam?: string;
  awayTeam?: string;
  event?: string;
  kickoff?: string;
  gameFlow?: string;
  firstGoal?: string;
  sourceOfFirstGoal?: string;
  riskOfInjuries?: string;
  cornerCount?: string;
  bookings?: string;
  penaltiesAwarded?: string;
  keyArea?: string;
  tip?: string;
  odds?: string;
  returns?: string;
  value?: string;
  couponPick: CouponPick;
};

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&pound;/gi, "£")
    .replace(/&#163;/g, "£")
    .replace(/&euro;/gi, "€")
    .replace(/&#8364;/g, "€");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function htmlToLines(html = "") {
  return decodeHtml(html)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function cleanTitle(title = "") {
  const text = decodeHtml(title.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const fixtureMatch = text.match(/^(.+?)\s+[\u2013-]\s+\d{2}-\d{2}-\d{4}/);

  return fixtureMatch?.[1]?.trim() || text.replace(/\s+[\u2013-]\s+Free Fixed Odds Tip.*$/i, "").trim();
}

function splitFixture(fixture: string) {
  const teams = fixture.split(/\s+(?:v|vs)\s+/i);

  if (teams.length !== 2) {
    return {};
  }

  return {
    homeTeam: teams[0].trim(),
    awayTeam: teams[1].trim(),
  };
}

function fieldAfter(lines: string[], label: RegExp) {
  const index = lines.findIndex((line) => label.test(line));

  if (index === -1) {
    return undefined;
  }

  return lines[index + 1];
}

function valueAfter(text: string, label: RegExp) {
  const match = text.match(label);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

export function findFirstLink(html: string | undefined, matcher: RegExp) {
  if (!html) {
    return undefined;
  }

  const linkPattern = /<a\s+[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html))) {
    const href = decodeHtml(match[2]);
    const label = decodeHtml(match[3].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

    if (matcher.test(href) || matcher.test(label)) {
      return href;
    }
  }

  return undefined;
}

export function splitTipBody(html = "") {
  const cleaned = cleanTipContentHtml(html);
  const headingMatch = cleaned.match(/<h[2-6][^>]*>\s*Related Reading\s*<\/h[2-6]>/i);

  if (!headingMatch || headingMatch.index === undefined) {
    return { lede: cleaned, relatedReading: "" };
  }

  return {
    lede: cleaned.slice(0, headingMatch.index).trim(),
    relatedReading: cleaned.slice(headingMatch.index + headingMatch[0].length).trim(),
  };
}

export type SignalIntensity = "high" | "med" | "low" | "neutral";

export function intensityOf(value: string | undefined): SignalIntensity {
  if (!value) {
    return "neutral";
  }

  const v = value.toLowerCase().trim();

  if (/^(very high|high|likely|late|frantic)$/.test(v)) {
    return "high";
  }

  if (/^(medium|med|possible|moderate|open|mid)$/.test(v)) {
    return "med";
  }

  if (/^(very low|low|unlikely|early|tactical|slow|none)$/.test(v)) {
    return "low";
  }

  return "neutral";
}

// Extract HH:MM from any free-form kickoff string. WP "Start Time" is often a long
// phrase like "15:00 (UK time), Sun, 24th May 2026."; this just pulls the time.
export function extractTime(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/\b(\d{1,2}):(\d{2})\b/);

  if (!match) {
    return null;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

// Filter out 0 / 0.0 / 0.00 / "-" / empty as missing odds. WP sometimes returns these
// for unpriced matches and we don't want to render them as if they were real prices.
export function cleanOdds(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "-" || /^0(\.0+)?$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function parseReturns(returnsText: string | undefined) {
  if (!returnsText) {
    return null;
  }

  const stakeMatch = returnsText.match(/(?:£|£|GBP\s*)?(\d+(?:\.\d+)?)\s*(?:bet|stake)?/i);
  const returnMatch = returnsText.match(/returns?\s+(?:a\s+total\s+of\s+)?(?:£|£)?(\d+(?:\.\d+)?)/i);

  const stake = stakeMatch ? Number(stakeMatch[1]) : null;
  const total = returnMatch ? Number(returnMatch[1]) : null;

  if (!stake || !total) {
    return null;
  }

  return {
    stake,
    total,
    profit: Math.round((total - stake) * 100) / 100,
  };
}

export function cleanTipContentHtml(html = "") {
  const structuredLabels = [
    "Event",
    "Start Time",
    "Game-Flow",
    "First Goal",
    "Source Of First Goal",
    "Risk Of Injuries",
    "Corner Count",
    "Bookings",
    "Penalties Awarded",
    "Key Area",
    "Best Bet",
    "Returns",
    "Value",
  ];

  return structuredLabels
    .reduce((content, label) => {
      const pattern = new RegExp(
        `<h[2-6][^>]*>\\s*${escapeRegExp(label)}\\s*</h[2-6]>[\\s\\S]*?(?=<h[2-6][^>]*>|$)`,
        "gi",
      );

      return content.replace(pattern, "");
    }, html)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function couponPick(tip: string | undefined, homeTeam?: string, awayTeam?: string): CouponPick {
  if (!tip) {
    return null;
  }

  const normalizedTip = tip.toLowerCase();

  if (normalizedTip === "draw") {
    return "D";
  }

  if (homeTeam && normalizedTip === homeTeam.toLowerCase()) {
    return "H";
  }

  if (awayTeam && normalizedTip === awayTeam.toLowerCase()) {
    return "A";
  }

  return null;
}

export function summarizeTip(post: WpPost): TipSummary {
  const fixture = cleanTitle(post.title);
  const { homeTeam, awayTeam } = splitFixture(fixture);
  const lines = htmlToLines(post.content || post.excerpt || "");
  const text = lines.join("\n");
  const event = fieldAfter(lines, /^Event$/i);
  const kickoff = fieldAfter(lines, /^Start Time$/i);
  const gameFlow = fieldAfter(lines, /^Game-Flow$/i);
  const firstGoal = fieldAfter(lines, /^First Goal$/i);
  const sourceOfFirstGoal = fieldAfter(lines, /^Source Of First Goal$/i);
  const riskOfInjuries = fieldAfter(lines, /^Risk Of Injuries$/i);
  const cornerCount = fieldAfter(lines, /^Corner Count$/i);
  const bookings = fieldAfter(lines, /^Bookings$/i);
  const penaltiesAwarded = fieldAfter(lines, /^Penalties Awarded$/i);
  const keyArea = fieldAfter(lines, /^Key Area$/i);
  const tip =
    valueAfter(text, /OddsTips Top Value Bet:\s*([^\n]+)/i) ||
    valueAfter(text, /Top Value Bet:\s*([^\n]+)/i) ||
    fieldAfter(lines, /^Best Bet$/i);
  const odds = valueAfter(text, /Bet365 Odds At Time Of Publication:\s*([^\n]+)/i);
  const returns = fieldAfter(lines, /^Returns$/i);
  const value = fieldAfter(lines, /^Value$/i);

  return {
    fixture,
    homeTeam,
    awayTeam,
    event,
    kickoff,
    gameFlow,
    firstGoal,
    sourceOfFirstGoal,
    riskOfInjuries,
    cornerCount,
    bookings,
    penaltiesAwarded,
    keyArea,
    tip,
    odds,
    returns,
    value,
    couponPick: couponPick(tip, homeTeam, awayTeam),
  };
}
