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
    .replace(/&mdash;/gi, "-");
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
