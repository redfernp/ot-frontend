import { PUBLIC_SPANISH_INDEXING } from "astro:env/server";
import type { WpPost } from "@/lib/graphql";
import { summarizeTip } from "@/lib/tips";

export const SPANISH_LOCALE = "es-ES" as const;
export const SPANISH_ROOT = "/es/";
export const SPANISH_FOOTBALL_PATH = "/es/futbol/";
export const SPANISH_LA_LIGA_PATH = "/es/futbol/espana/la-liga/";
export const ENGLISH_LA_LIGA_PATH = "/football/spain/spain-primera-liga/";
export const LA_LIGA_SOURCE_SLUG = "spain-primera-liga";

export const spanishPagesNoindex = !/^(1|true|yes)$/i.test(PUBLIC_SPANISH_INDEXING || "");

export const spanishBet365Offer = {
  label: "Publicidad · Oferta de nuevo cliente",
  title: "Consigue hasta 200€ en créditos de apuesta para nuevos clientes en bet365",
  description:
    "Regístrate en bet365, ingresa 5€ o más en tu cuenta y conseguirás un 100% de tu ingreso válido en créditos de apuesta (hasta 200€). Solo para clientes nuevos. Se aplican las condiciones. Las ganancias no incluyen el importe de los créditos de apuesta. Es necesario registrarse.",
  cta: "Visitar Bet365",
  href: "/es/go/bet365/",
  destination: "https://www.bet365.com/hub/aff/open-account?affiliate=365_04144977",
  safety: "+18. Si juegas, juega con responsabilidad.",
};

export function absoluteOddstipsUrl(pathname: string): string {
  return new URL(pathname, "https://www.oddstips.co.uk").toString();
}

export function upcomingPosts(posts: WpPost[], now = Date.now()): WpPost[] {
  return posts
    .filter((post) => {
      if (!post.eventStart) return false;
      const eventMs = new Date(post.eventStart).getTime();
      return Number.isFinite(eventMs) && eventMs > now;
    })
    .sort((a, b) => new Date(a.eventStart!).getTime() - new Date(b.eventStart!).getTime());
}

const SOURCE_TIP_SUFFIX = "-free-fixed-odds-tip-football-betting-prediction";

export function sourceTipSlugToSpanishSlug(sourceSlug: string): string {
  const pattern = new RegExp(
    `^(.+?)-v-(.+?)-(\\d{2}-\\d{2}-\\d{4})${SOURCE_TIP_SUFFIX}$`,
    "i",
  );
  const match = sourceSlug.match(pattern);

  if (!match) {
    return `${sourceSlug}-pronostico`;
  }

  const [, home, away, date] = match;
  return `${home}-contra-${away}-pronostico-${date}`;
}

export function spanishTipPath(postOrSlug: WpPost | string): string {
  const sourceSlug = typeof postOrSlug === "string" ? postOrSlug : postOrSlug.slug;
  return `/es/pronosticos/${sourceTipSlugToSpanishSlug(sourceSlug)}/`;
}

export function englishTipPath(post: WpPost): string {
  return post.uri || `/${post.slug}/`;
}

export function spanishFixture(post: WpPost): string {
  const summary = summarizeTip(post);
  const home = spanishTeamName(summary.homeTeam) || "Equipo local";
  const away = spanishTeamName(summary.awayTeam) || "Equipo visitante";
  return `${home} contra ${away}`;
}

export function spanishTipTitle(post: WpPost): string {
  return `${spanishFixture(post)}: pronóstico y cuotas`;
}

export function spanishTipDescription(post: WpPost): string {
  const summary = summarizeTip(post);
  const pick = translatePick(summary.tip);
  const selection = pick ? ` Nuestra selección es ${pick}.` : "";
  return `Consulta el pronóstico de ${spanishFixture(post)} en La Liga, con horario, análisis y cuotas publicadas.${selection}`;
}

export function formatSpanishDate(value: string | undefined | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "full",
    timeZone: "Europe/Madrid",
  }).format(date);
}

export function formatSpanishKickoff(value: string | undefined | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(date);
}

const TRANSLATIONS: Record<string, string> = {
  attacking: "Ofensivo",
  defensive: "Defensivo",
  balanced: "Equilibrado",
  open: "Abierto",
  tactical: "Táctico",
  slow: "Lento",
  frantic: "Muy intenso",
  early: "Temprano",
  late: "Tardío",
  "shot from distance": "Tiro desde fuera del área",
  "set piece": "Balón parado",
  "open play": "Jugada abierta",
  header: "Remate de cabeza",
  penalty: "Penalti",
  high: "Alto",
  "very high": "Muy alto",
  medium: "Medio",
  moderate: "Moderado",
  low: "Bajo",
  "very low": "Muy bajo",
  likely: "Probable",
  possible: "Posible",
  unlikely: "Poco probable",
  none: "Ninguno",
  wide: "Bandas",
  central: "Zona central",
  midfield: "Centro del campo",
  "final third": "Último tercio",
  draw: "Empate",
  home: "Local",
  away: "Visitante",
};

const SPANISH_TEAM_NAMES: Record<string, string> = {
  "atletico madrid": "Atlético Madrid",
  "cd alaves": "CD Alavés",
  "deportivo la coruna": "Deportivo La Coruña",
  malaga: "Málaga",
};

export function spanishTeamName(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return SPANISH_TEAM_NAMES[value.trim().toLowerCase()] || value;
}

export function translateStructuredValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return TRANSLATIONS[value.trim().toLowerCase()] || value;
}

export function translatePick(value: string | undefined): string | undefined {
  const team = spanishTeamName(value);
  return translateStructuredValue(team);
}

export function tipAlternates(post: WpPost) {
  return [
    { hreflang: "es-ES", href: absoluteOddstipsUrl(spanishTipPath(post)) },
    { hreflang: "en-GB", href: absoluteOddstipsUrl(englishTipPath(post)) },
  ];
}
