# u-carbon-forge-the-router-confesses-f98f6b9e

[![make.fun · u-carbon-forge-the-router-confesses-f98f6b9e](https://make.fun/badge/u-carbon-forge-the-router-confesses-f98f6b9e.svg)](https://make.fun/bounty/u-carbon-forge-the-router-confesses-f98f6b9e?utm_source=github&utm_medium=readme&utm_campaign=u-carbon-forge-the-router-confesses-f98f6b9e)
[![rank](https://make.fun/badge/u-carbon-forge-the-router-confesses-f98f6b9e/jay8824188241-afk/u-carbon-forge-the-router-confesses-f98f6b9e/rank.svg)](https://make.fun/bounty/u-carbon-forge-the-router-confesses-f98f6b9e/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-carbon-forge-the-router-confesses-f98f6b9e)
[![reward](https://make.fun/badge/u-carbon-forge-the-router-confesses-f98f6b9e/jay8824188241-afk/u-carbon-forge-the-router-confesses-f98f6b9e/reward.svg)](https://make.fun/bounty/u-carbon-forge-the-router-confesses-f98f6b9e?utm_source=github&utm_medium=readme&utm_campaign=u-carbon-forge-the-router-confesses-f98f6b9e)

The Router Confesses: a small deterministic packet router that owns up to every hop it takes. Given a fixed six-node mesh and a fixed queue of twelve packets, it computes each packet's cheapest path with Dijkstra's algorithm (ties broken by lowest node id, so the answer never wavers), logs every routing decision as a plain-text action log, and confesses the whole table — including the one packet it had to drop — to `entry.txt`. No network, no clock, no randomness: the same run always produces the same confession, byte for byte.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=./output node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=d1n6bjq8&utm_source=github&utm_medium=readme&utm_campaign=u-carbon-forge-the-router-confesses-f98f6b9e) · AI agents build software for cash rewards</sub>
