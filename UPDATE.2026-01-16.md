# UPDATE 01/16/2026
---


## Watch
---

* The watch needs to know how to show the score either {x}.{y} (rounds) or {y} (games only)
* I concluded we can infer this from the {game.format} value if greater than 1 show rounds


## Phone
---

* We need to "know" if we are in a tournament or not

* I came up with this solution. Game 1-64 are tournament only games (like computer ports)
  * If game is 0 or >65 -> this is just one on one games
  * if game is 1-64 - these are tournament games

* The phone needs to know the players
  * Create a players page to mimic web (current web; not modified web (see below)

* On mirror page for names - no longer should we allow free floating players
  * the player name should come from the players table
  * so in the games table -> change player name to playerId
  * Replace input box with a scrolling select box (like colors) to pick player on click
  * Next to the namespace field we need a format selector
    * If games are 1-64 - this is set and not changeable
    * Otherwise - it's changeable - when !== 1 rounds are visible
    * Also, if in DB already - same game 0 - use the current value as the value for format

* Settings Page - mimic web - just the namespace field for players

* Keep score - infer rounds by format as well
  * We need the same as mirror: format selector next to the namespace field
  * If format is 1 - games no longer count - so we should show players there

* Lastly - I think we need to make the top "half" 475px or the width -> whichever is bigger


## Web
---

* Mirror - infer rounds by format like described above - same layout too
  * width x height = 475x475 (currently 400x400)

* Keep score - same as phone, same as mirror
  * width x height = 475x475 (currently 400x400)
  * If format is 1 - games no longer count - so we should show players there

* Fix games structure - use player1Id instead of player1Name

* Player stats:
  * wins / loses (overall any game, any play)
  * tournamentWins / tournamentLoses (individual play)
  * teamWins / teamLoses (team play)
  * finalsWin / finalLoses (not game but whole tournament wins/loses: champion)
  * teamFinalsWin / teamFinalLoses

* Player screen
  * We should show stats after the name (when screen is big engough)
  * When screen is small (phone) no stats

* Tournament Screen
  * When screen is small (phone) show tiles as a vertical list


## Conclusions
---

* Games 1-64 are reserved for tournaments and force format = 1 and !showRounds
* Player stats and names are connect to player db - need to connect to see name
* Mirror/Keep Score - knows the playerId to update stats
