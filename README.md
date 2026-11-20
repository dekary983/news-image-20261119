# The Day in One Picture

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/dekary983/news-image-20261119/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/dekary983/news-image-20261119/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

A single-file, procedural broadsheet front page covering the requested news edition dated **Thursday, 19 November 2026**. The page puts the International Court of Justice ruling on Myanmar and the Rohingya at the top, with five compact world-news briefs beneath it and an “Also today” ticker along the foot.

## Stories

- **Lead — The Hague:** The requested summary of the International Court of Justice ruling, rendered with a courthouse, globe and scales of justice.
- **Shenzhen Summit:** Trump, Xi and Putin's joint peace declaration and nuclear-risk talks.
- **Wall Street:** Anthropic's record $81bn IPO debut.
- **Ukraine war:** The Kerch Bridge strike, Putin's threatened reply and Ukraine's 2027 funding request.
- **The Arctic:** Denmark's Greenland–US security pact.
- **The art market:** Van Gogh's record $190.4m sale and the painting's Nazi-era history.
- **Also today:** The US Senate Iran war-powers vote, Walmart sales and the UK–Norway naval programme.

The requested source list for the edition is **Reuters, WSJ, Le Monde, Foreign Exchanges, en.h.ua, and Russell Record**. The art direction, illustrations, font, grain and PNG encoding are all created in code; the renderer performs no network access and uses no external assets or packages. The supplied story copy is used as edition content, with those outlets identified as its reporting sources.

## Run

Requires Node.js 22 or newer. From this directory:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The program writes `entry.png` in the selected output directory (default: `/output`). It uses a fixed-seed PRNG and produces a 1024 × 1024 RGBA PNG.
