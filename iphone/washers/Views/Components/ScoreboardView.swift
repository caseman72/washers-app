//
//  ScoreboardView.swift
//  washers
//

import SwiftUI

struct ScoreboardView: View {
    @Binding var gameState: GameState
    let interactive: Bool
    let format: Int
    var onStateChange: ((GameState) -> Void)?

    @State private var showWinPrompt: Int? = nil
    @State private var showSeriesWin: Int? = nil
    @State private var showColorPicker: Int? = nil

    private let winningScore = 21

    var body: some View {
        GeometryReader { geometry in
            let size = min(geometry.size.width, geometry.size.height)

            ZStack {
                Color.boardBackground

                VStack(spacing: 0) {
                    // Games counter header
                    gamesHeader(size: size)
                        .frame(height: size * 0.12)

                    // Score panels
                    HStack(spacing: 0) {
                        scorePanel(player: 1, size: size)
                        scorePanel(player: 2, size: size)
                    }
                    .frame(height: size * 0.75)

                    // Reset button
                    if interactive {
                        Button(action: resetGame) {
                            Text("Reset")
                                .font(.system(size: size * 0.04))
                                .foregroundColor(.gray)
                                .padding(.horizontal, size * 0.06)
                                .padding(.vertical, size * 0.02)
                                .background(Color(white: 0.2))
                                .cornerRadius(8)
                        }
                        .padding(.top, size * 0.03)
                    }
                }
                .frame(width: size, height: size)

                // Win confirmation modal
                if let player = showWinPrompt {
                    winModal(player: player)
                }

                // Series win celebration
                if let player = showSeriesWin {
                    seriesWinModal(player: player)
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
        }
        .aspectRatio(1, contentMode: .fit)
        .sheet(item: $showColorPicker.animation()) { player in
            ColorPickerView(
                selectedColor: player == 1 ? $gameState.player1Color : $gameState.player2Color,
                otherColor: player == 1 ? gameState.player2Color : gameState.player1Color
            )
            .presentationDetents([.medium])
        }
    }

    // MARK: - Subviews

    @ViewBuilder
    private func gamesHeader(size: CGFloat) -> some View {
        let p1 = WasherColor.get(gameState.player1Color)
        let p2 = WasherColor.get(gameState.player2Color)

        HStack {
            // Player 1 games badge
            gamesBadge(
                games: gameState.player1Games,
                rounds: gameState.player1Rounds,
                color: p1,
                size: size
            )
            .onTapGesture {
                if interactive { showColorPicker = 1 }
            }

            Spacer()

            Text("GAMES")
                .font(.system(size: size * 0.035, weight: .medium))
                .foregroundColor(.gray)
                .tracking(2)

            Spacer()

            // Player 2 games badge
            gamesBadge(
                games: gameState.player2Games,
                rounds: gameState.player2Rounds,
                color: p2,
                size: size
            )
            .onTapGesture {
                if interactive { showColorPicker = 2 }
            }
        }
        .padding(.horizontal, size * 0.05)
    }

    @ViewBuilder
    private func gamesBadge(games: Int, rounds: Int, color: WasherColor, size: CGFloat) -> some View {
        let displayText = format > 1 ? "\(rounds).\(games)" : "\(games)"

        Text(displayText)
            .font(.system(size: size * 0.06, weight: .bold))
            .foregroundColor(color.text)
            .frame(width: size * 0.18, height: size * 0.09)
            .background(color.background)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(color.id == "white" ? Color.gray.opacity(0.3) : Color.clear, lineWidth: 2)
            )
    }

    @ViewBuilder
    private func scorePanel(player: Int, size: CGFloat) -> some View {
        let score = player == 1 ? gameState.player1Score : gameState.player2Score
        let colorId = player == 1 ? gameState.player1Color : gameState.player2Color
        let color = WasherColor.get(colorId)

        VStack(spacing: 0) {
            // Increment button
            if interactive {
                Button(action: { incrementScore(player: player) }) {
                    Text("+")
                        .font(.system(size: size * 0.08, weight: .bold))
                        .foregroundColor(color.text)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.25))
                }
                .frame(height: size * 0.18)
            }

            // Score display
            Text("\(score)")
                .font(.system(size: size * 0.22, weight: .bold))
                .foregroundColor(color.text)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Decrement button
            if interactive {
                Button(action: { decrementScore(player: player) }) {
                    Text("−")
                        .font(.system(size: size * 0.08, weight: .bold))
                        .foregroundColor(color.text.opacity(0.7))
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.25))
                }
                .frame(height: size * 0.18)
            }
        }
        .background(color.background)
    }

    @ViewBuilder
    private func winModal(player: Int) -> some View {
        let name = player == 1 ? gameState.player1Name : gameState.player2Name
        let displayName = name.isEmpty ? "Player \(player)" : name

        Color.black.opacity(0.8)
            .ignoresSafeArea()

        VStack(spacing: 20) {
            Text("\(displayName) Won?")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)

            HStack(spacing: 12) {
                Button(action: { cancelWin(player: player) }) {
                    Text("No")
                        .font(.title3)
                        .foregroundColor(.gray)
                        .frame(width: 80, height: 50)
                        .background(Color(white: 0.25))
                        .cornerRadius(10)
                }

                Button(action: { confirmWin(player: player) }) {
                    Text("Yes")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(width: 160, height: 50)
                        .background(Color.green)
                        .cornerRadius(10)
                }
            }
        }
        .padding(30)
        .background(Color(white: 0.15))
        .cornerRadius(20)
    }

    @ViewBuilder
    private func seriesWinModal(player: Int) -> some View {
        let name = player == 1 ? gameState.player1Name : gameState.player2Name
        let displayName = name.isEmpty ? "Player \(player)" : name

        Color.black.opacity(0.8)
            .ignoresSafeArea()

        VStack(spacing: 20) {
            Text("\(displayName) Won!")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Button(action: { showSeriesWin = nil }) {
                Text("OK")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(width: 120, height: 50)
                    .background(Color.green)
                    .cornerRadius(10)
            }
        }
        .padding(30)
        .background(Color(white: 0.15))
        .cornerRadius(20)
    }

    // MARK: - Actions

    private func incrementScore(player: Int) {
        if player == 1 {
            gameState.player1Score += 1
            if gameState.player1Score == winningScore {
                showWinPrompt = 1
            } else if gameState.player1Score > winningScore {
                gameState.player1Score = 15 // Bust
            }
        } else {
            gameState.player2Score += 1
            if gameState.player2Score == winningScore {
                showWinPrompt = 2
            } else if gameState.player2Score > winningScore {
                gameState.player2Score = 15 // Bust
            }
        }
        notifyStateChange()
    }

    private func decrementScore(player: Int) {
        if player == 1 {
            gameState.player1Score = max(0, gameState.player1Score - 1)
        } else {
            gameState.player2Score = max(0, gameState.player2Score - 1)
        }
        showWinPrompt = nil
        notifyStateChange()
    }

    private func confirmWin(player: Int) {
        showWinPrompt = nil
        let gamesNeeded = (format / 2) + 1

        if player == 1 {
            gameState.player1Games += 1
            if gameState.player1Games >= gamesNeeded {
                gameState.player1Rounds += 1
                gameState.player1Games = 0
                gameState.player2Games = 0
                if format > 1 {
                    showSeriesWin = 1
                }
            }
        } else {
            gameState.player2Games += 1
            if gameState.player2Games >= gamesNeeded {
                gameState.player2Rounds += 1
                gameState.player1Games = 0
                gameState.player2Games = 0
                if format > 1 {
                    showSeriesWin = 2
                }
            }
        }

        // Reset scores for new game
        gameState.player1Score = 0
        gameState.player2Score = 0
        notifyStateChange()
    }

    private func cancelWin(player: Int) {
        // Trigger bust (reset to 15)
        if player == 1 {
            gameState.player1Score = 15
        } else {
            gameState.player2Score = 15
        }
        showWinPrompt = nil
        notifyStateChange()
    }

    private func resetGame() {
        gameState.player1Score = 0
        gameState.player2Score = 0
        gameState.player1Games = 0
        gameState.player2Games = 0
        gameState.player1Rounds = 0
        gameState.player2Rounds = 0
        showWinPrompt = nil
        showSeriesWin = nil
        notifyStateChange()
    }

    private func notifyStateChange() {
        onStateChange?(gameState)
    }
}

// MARK: - Identifiable extension for sheet binding
extension Int: @retroactive Identifiable {
    public var id: Int { self }
}

#Preview {
    ScoreboardView(
        gameState: .constant(GameState()),
        interactive: true,
        format: 1
    )
    .frame(width: 350, height: 350)
}
