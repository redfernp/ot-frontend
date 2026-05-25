// Dev-preview fallback for the ACF Pro fields on the Category taxonomy:
//   category_top_seo_text     (WYSIWYG)   -> hero / under H1
//   category_bottom_seo_text  (textarea)  -> under the tips list
//
// In production these come from WPGraphQL via category.categoryTopSeoText /
// .categoryBottomSeoText. This map is only used when WP env is not configured (so
// dev previews still render with realistic copy) or when a particular category does
// not yet have the field populated.

export type CategorySeoCopy = {
  top?: string;
  bottom?: string;
};

export const categorySeoCopy: Record<string, CategorySeoCopy> = {
  tennis: {
    top: `<p>Looking for the latest tennis betting tips? You will find the best predictions, both for today's matches and those taking place a little later, right here on OddsTips.</p>`,
    bottom: `
<p>Oddstips is the number 1 website for those looking to find the best tennis value bets. A value bet is a wager that offers good value for money. Finding the best value bet sometimes means betting on a result that is not the most likely to actually happen. What matters most are the betting prices (odds) that can be found.</p>
<p>OddsTips uses a unique 38-section algorithm, to find the value bet in any tennis match. Unlike many other sites that use unsophisticated algorithms based on just four or five pieces of data (previous head-to-head results, generally), this is where you will find great bets that are based on much-deeper mining of the underlying statistics and info.</p>
<p>Our algorithm takes into account factors such as predicted humidity, predicted court temperature, how many days of rest players have been given, starting time of match, surface, the number of matches played by each player in the current season, form trends and much, much more.</p>
<p>Remember, we are looking for value bets here and not just the most likely outcome. Sometimes it makes sense to back a short-priced favourite, while at others putting your money on a long-shot makes more sense.</p>
<p>Make sure you add OddsTips to your favourites. Hundreds of new tips are added every day to this site, so come back regularly to find the latest top betting tips.</p>
    `.trim(),
  },
  football: {
    top: `<p>Looking for today's best Football 1x2 betting tips and predictions? Oddstips covers every major league, cup and international fixture with Bet365 odds, value angles and accumulator picks. Pick a league below or browse the latest predictions.</p>`,
    bottom: `
<h2>What Is 1x2 Betting?</h2>
<p>In football betting, 1x2 is the simplest market around:</p>
<ul>
  <li>1 = Home team win</li>
  <li>X = Draw</li>
  <li>2 = Away team win</li>
</ul>
<p>It's the foundation of most accumulators (accas) and the market used by bookies worldwide. According to <a href="https://www.uefa.com/" rel="nofollow">UEFA</a>, this is also the most widely bet-on market in European football.</p>
<p>Our 1x2 betting tips today cover league fixtures, cup matches, and internationals, using stats like form, injuries, and even expected goals (xG) to give context.</p>

<h2>Why 1x2 Is Perfect for Acca Betting</h2>
<p>Most casual punters love accas, and 1x2 bets are the backbone. By stacking multiple match outcomes, you can turn a small stake into a big win.</p>
<p>Example: A simple 4-fold acca at average odds of 1.80 gives a return of over 10x your stake.</p>
<p>For more detail, check our support guide on <a href="/how-1x2-betting-works-in-accas/">How 1x2 Betting Works in Accas</a>, which is a perfect intro if you're new to building multiples.</p>

<h2>Smarter 1x2 Betting with Expected Goals (xG)</h2>
<p>Form and league tables don't always tell the full story. That's where <a href="https://en.wikipedia.org/wiki/Expected_goals" rel="nofollow"><strong>Expected Goals (xG)</strong></a> comes in.</p>
<ul>
  <li><strong>xG</strong> measures the <em>quality</em> of chances a team creates and concedes.</li>
  <li>A side with a high xG but poor results may be <em>undervalued</em> by bookies.</li>
  <li>Sharp bettors use xG to spot mispriced 1x2 odds.</li>
</ul>
<p>See our explainer: <a href="/what-is-expected-goals-in-football-betting/">What Is Expected Goals in Football Betting?</a></p>

<h2>Popular Strategies for 1x2 Betting</h2>
<p>Here are three simple approaches you can try today:</p>
<ol>
  <li><strong>Banker Strategy</strong> &ndash; Back short-odds favourites as singles or doubles.</li>
  <li><strong>Value Hunter</strong> &ndash; Look for teams with higher xG than results suggest.</li>
  <li><strong>Acca Builder</strong> &ndash; Combine 4 to 6 strong 1x2 picks for big returns.</li>
</ol>
<p>Want more angles? Check out our <a href="/beginners-guide-to-football-1x2-betting/">Beginner's Guide to Football 1x2 Betting</a> for step-by-step strategies.</p>

<h2>Why Trust Our Football 1x2 Tips?</h2>
<ul>
  <li>We keep it <strong>simple and fun</strong>; no jargon, just straight picks.</li>
  <li>Tips are based on <strong>stats + context</strong>, not blind guesses.</li>
  <li>Written for <strong>everyday fans</strong> in the UK and Ireland.</li>
</ul>
<p>We're not here to overload you with data. We give you <strong>ready-to-back bets</strong>; whether you're the <strong>Lazy Copycat</strong> looking for today's banker, the <strong>Hopeful Optimist</strong> chasing a long shot, or the <strong>Fun-First Fan</strong> wanting a flutter for tonight's game.</p>

<h2>Join 10,000+ Fans Backing Our Daily Picks</h2>
<p>Every morning we send out free <strong>football betting tips</strong>, with our top 3 <strong>1x2 acca of the day</strong> included, plus Football 5-fold, Football 10-fold and Cross-Sports Multi 10-fold accas.</p>
<p><a href="/free-bets/"><strong>Sign up here for free</strong></a> and never miss a winner.</p>
    `.trim(),
  },
};

export function getCategorySeoCopy(slug: string | undefined): CategorySeoCopy {
  if (!slug) {
    return {};
  }

  return categorySeoCopy[slug] ?? {};
}
