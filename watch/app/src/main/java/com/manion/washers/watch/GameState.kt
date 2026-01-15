package com.manion.washers.watch

/**
 * Game state for the scoreboard.
 * Tracks current game score, overall games won, and player colors.
 */
data class GameState(
    val player1Score: Int = 0,
    val player2Score: Int = 0,
    val player1Games: Int = 0,
    val player2Games: Int = 0,
    val player1Rounds: Int = 0,
    val player2Rounds: Int = 0,
    val player1Color: PlayerColor = PlayerColor.DEFAULT_PLAYER1,
    val player2Color: PlayerColor = PlayerColor.DEFAULT_PLAYER2,
    val format: Int = 1
) {
    companion object {
        const val WINNING_SCORE = 21
        const val BUST_SCORE = 15
    }

    val player1AtWinningScore: Boolean get() = player1Score == WINNING_SCORE
    val player2AtWinningScore: Boolean get() = player2Score == WINNING_SCORE

    val gamesNeededToWinSession: Int get() = (format / 2) + 1

    fun incrementPlayer1(): GameState {
        val newScore = if (player1Score >= WINNING_SCORE) BUST_SCORE else player1Score + 1
        return copy(player1Score = newScore)
    }

    fun incrementPlayer2(): GameState {
        val newScore = if (player2Score >= WINNING_SCORE) BUST_SCORE else player2Score + 1
        return copy(player2Score = newScore)
    }

    fun decrementPlayer1(): GameState = copy(player1Score = maxOf(0, player1Score - 1))
    fun decrementPlayer2(): GameState = copy(player2Score = maxOf(0, player2Score - 1))

    /** Called when user says "No" to win confirmation - bust back to 15 */
    fun bustPlayer1(): GameState = copy(player1Score = BUST_SCORE)
    fun bustPlayer2(): GameState = copy(player2Score = BUST_SCORE)

    fun confirmWin(winner: Int): GameState {
        val newPlayer1Games = if (winner == 1) player1Games + 1 else player1Games
        val newPlayer2Games = if (winner == 2) player2Games + 1 else player2Games

        val player1WinsSession = newPlayer1Games >= gamesNeededToWinSession
        val player2WinsSession = newPlayer2Games >= gamesNeededToWinSession

        return when {
            player1WinsSession -> copy(
                player1Score = 0,
                player2Score = 0,
                player1Games = 0,
                player2Games = 0,
                player1Rounds = player1Rounds + 1
            )
            player2WinsSession -> copy(
                player1Score = 0,
                player2Score = 0,
                player1Games = 0,
                player2Games = 0,
                player2Rounds = player2Rounds + 1
            )
            else -> copy(
                player1Score = 0,
                player2Score = 0,
                player1Games = newPlayer1Games,
                player2Games = newPlayer2Games
            )
        }
    }

    fun setPlayer1Color(color: PlayerColor): GameState = copy(player1Color = color)
    fun setPlayer2Color(color: PlayerColor): GameState = copy(player2Color = color)
    fun setFormat(newFormat: Int): GameState = copy(format = newFormat)

    fun resetAll(): GameState = GameState(
        player1Color = player1Color,
        player2Color = player2Color,
        format = format
    )

    fun resetColors(): GameState = copy(
        player1Color = PlayerColor.DEFAULT_PLAYER1,
        player2Color = PlayerColor.DEFAULT_PLAYER2
    )
}
