# Fourball

A Next.js App Router + TypeScript + Supabase app for a regular four-player simulator golf group. The design uses deep greens, warm ivory, serif typography and landscape photography, inspired by golf editorial design.

## Run locally

Requires Node.js 20.9+.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The initial Autumn Invitational starts on 21 October 2026 at Currahee Golf Club with Brian, John, Derek and Tony, with no results recorded. The remaining rounds retain weekly placeholder dates of 28 October and 4 November, editable in round details. Changes persist in this browser using localStorage. The Currahee photograph is from the official club website; other landscape photographs are illustrative.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/202610210001_clubhouses.sql` in its SQL editor (or use the Supabase CLI migrations).
3. Copy `.env.example` to `.env.local`. Set the project URL and publishable/anon key. Never use a service-role key in the browser.
4. Enable email authentication; configure your Site URL and allowed redirect URLs (including http://localhost:3000 for development).
5. Restart the dev server. Open **Your clubhouse**, request a sign-in link, and return through that link.
6. **Save to cloud** saves the entire local clubhouse; **Load cloud save** replaces local tournaments with the last cloud save. Sync is explicit, not automatic. RLS isolates every account's data.

The initial schema stores each account's complete tournament collection in a JSONB aggregate, making the local and cloud models identical. It is suitable for a single organiser's small group. Shared participant accounts, concurrent editing/merge conflict handling, automatic sync and role-based group management are not yet implemented.

## Tournament rules

- Exactly four players; three rounds, following the clarified requirement.
- The three possible 2v2 matches are drawn using a Fisher–Yates shuffle. Every player partners with every other player exactly once. Redraw is available until a result is recorded.
- 3 points to each player on the winning team; 1 to every player for a draw. Unplayed matches award nothing. Result edits recalculate standings.
- Equal points share a position. Alphabetical display order and wins are used only to order equal-point rows, not to award a tiebreak victory.
- Two closest-to-pin prizes per round, on-green shots only; distance recorded in feet. Prizes do not change standings.
- HIO challenge holes are displayed ahead of play. Confirm challenge holes, par-3 suitability and tee settings in the installed course version. HIO achievements/prize payouts are not automatically detected.
- Handicaps are stored as reference indexes. Handicap allowances, stroke allocation and format scoring are agreed and calculated in GSPro; the organiser records the final team outcome.
- Supported round formats: fourball match play, foursomes match play, scramble stroke play and fourball Stableford.

## Courses and imports

The course collection includes 20 graphics-first Bunker picks plus the five original clubhouse courses. Course pages, designer builds, source credits and flyovers are linked in the UI. The Top 20 is an editorial shortlist informed by player recommendations, course previews and designer showcases; it is not an official GSPro ranking. Published real-world venue ratings are not used as in-game graphics scores. Availability and course versions should be checked in your GSPro installation.

GSPro's practice export and full round scorecards are different data sources. No native round-export schema has been assumed. The import supports an explicit, downloadable CSV template:

```csv
player,hole,strokes,putts,fairway,gir
Brian Scott,1,4,2,true,true
```

`player`, `hole`, `strokes` are required. Player is an exact name (case insensitive) or player ID; holes are 1–18; strokes 1–30; optional putts must be 0 through strokes; optional fairway/GIR values are true/false or 1/0. Duplicate player/hole records are rejected. Partial rounds are accepted. A file is validated and previewed before staging, and **Save round** confirms it. Importing replaces that round's previous scorecard. Summary statistics and hole-by-hole scores are available. Team results are always manually confirmed. A representative real GSPro export is needed to implement its native column mapping.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

Tests cover partnership coverage, win/draw point awards, changed results, import validation and tournament creation. Supabase connectivity and email delivery require a configured project and have not been tested against a live account.

## References

- Design inspiration: https://www.masters.com/en_US/players/player_28237.html
- GSPro: https://gsprogolf.com/
- Course guide: https://20033507.fs1.hubspotusercontent-na1.net/hubfs/20033507/Product%20Documents/Software/GSPro%20Quick%20Start%20Guide.pdf
- Cabot Cliffs on SGT: https://simulatorgolftour.com/tournament/19336
- Photos: Unsplash (downloaded to `public/images`).

## Navigation and canonical URLs

The dashboard lives at `/`; the main player and course collections use `/players` and `/courses`. Tournament pages use `/tournaments/:id`, with `/schedule`, `/leaderboard`, `/players`, and `/courses` for individual tabs. Links support direct visits, refresh, new tabs and browser back/forward. Tournament data stays in a shared provider across navigation and reloads from this browser's saved clubhouse on refresh. A link to a locally created tournament requires that tournament to exist in the receiving browser or be loaded from its owner's cloud save.

`/tournaments` redirects permanently to `/`, and `/tournaments/:id/overview` redirects to `/tournaments/:id`, avoiding duplicate overview URLs. Unknown routes return 404; valid tournament paths with an unavailable local record show a recovery message. Every valid page emits its canonical URL. Set `NEXT_PUBLIC_SITE_URL` to the deployed site's public origin (for example `https://fourball.example.com`) before production builds so canonical metadata uses your domain; the development default is `http://localhost:3000`.

## Initial tournament — 21 October 2026

Opening round: Currahee Golf Club (Currahee Club in GSPro), Toccoa, Georgia, par 72. The opening closest-to-pin defaults are holes 2 and 17; HIO holes are 2, 4, 12 and 17, the par 3s listed by the club. These are editable before play and should be confirmed against the installed simulator version. The initial placeholder win and pin awards are removed when the original sample is upgraded; the upgrade is idempotent and does not reset results saved afterward.

Currahee course photo source: [Official course page](https://curraheeclub.com/the-currahee-club-golf-course), [original photo](https://curraheeclub.com/wp-content/uploads/2026/06/Currahee_14C_5-26_WebReady-1-2.jpg). Credit: Currahee Club. Photo saved locally as `public/images/currahee.jpg` and used in the dashboard, tournament banner and course/round cards. [GSPro listing](https://tpl.realitysportsonline.com/discover/courses/currahee-club).

## Graphics-first course collection

`lib/courses.ts` holds the catalogue: `topCourses` contains 20 curated builds, `clubhouseCourses` preserves the original five course IDs and order, and `courses` exposes all 27 for round selection. Existing tournament assignments are unchanged. Updated Cabot Cliffs is a separate creator-supported edition, so selecting the original Cabot course does not silently change its build.

The collection has search by name/location/designer, landscape and access filters, Top 20 / Clubhouse / All views, per-course graphics notes, designer/listed version details, preview attribution, evidence links and GSPro flyovers where available. All 20 picks have downloaded, course-specific simulator previews; Cape Kidnappers uses its linked flyover thumbnail. The original Currahee photo remains unchanged. Image provenance is in `public/images/courses/SOURCES.md`.

Research checked 21 October 2026. Creator-supported means the listed edition requires checking the creator's access arrangements; the seven Tekbud picks use creator-supported listings. Library listing is a directory category, not a guarantee that a download is free. Versions are the versions listed by the linked directory at research time, not a live update feed. Unlisted par values are omitted rather than guessed.

Selection references:

- [Players discussing GSPro graphics](https://www.reddit.com/r/Golfsimulator/comments/1su2wb8/gs_pro_courses_with_the_best_graphics/)
- [GSPro favourite courses](https://www.reddit.com/r/Golfsimulator/comments/1c6fs86/gspro_best_courses/)
- [2026 player recommendations](https://www.reddit.com/r/Golfsimulator/comments/1sxjuzs/what_is_everyones_top_10_favorite_gspro_courses/)
- [Tekbud's own course showcases](https://tekbud.com/best-courses)
- [The Course View guide](https://thecourseview.com/guides/best-gspro-courses)
- [The Perfect Lie course directory](https://tpl.realitysportsonline.com/discover?kind=courses)

Round two of the initial tournament is Trump International Aberdeen, on 28 October 2026. The verified GSPro listing is **Trump Aberdeen Old Course**, built by Neil McLauchlan (listed version 1, par 72). It is also available under Clubhouse courses and All courses, alongside the Top 20. A one-time saved-data update changes only the second course, preserving dates, pairings and results. [Course listing and preview source](https://tpl.realitysportsonline.com/discover/courses/trump-aberdeen-old-course).

Round three of the initial tournament is **DPC Scottsdale**, on 4 November 2026. The GSPro listing is par 71, by runpuddrun and rdeyer (listed version 3). It is available under Clubhouse courses and All courses. A one-time saved-data update changes the third course while preserving the existing date, format, draw and scores. [Course listing and preview](https://tpl.realitysportsonline.com/discover/courses/dpc-scottsdale).

The initial tournament fixes Brian Scott + Tony McLean together for Trump International Aberdeen, against John Colreavey + Derek McMillan. The other two unique partnerships are randomised across Currahee and DPC Scottsdale. `fixedPairing` is saved with the tournament; the Redraw button honours it, and refreshing preserves the saved draw.
