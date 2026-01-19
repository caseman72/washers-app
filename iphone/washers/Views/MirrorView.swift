//
//  MirrorView.swift
//  washers
//

import SwiftUI
import Combine

struct MirrorView: View {
    @Binding var selectedScreen: AppScreen
    @StateObject private var settings = SettingsService.shared
    @StateObject private var firebase = FirebaseService.shared
    @State private var gameState = GameState()
    @State private var showGamePicker = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.boardBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Header
                    HStack {
                        Button(action: { selectedScreen = .home }) {
                            HStack(spacing: 4) {
                                Image(systemName: "chevron.left")
                                Text("Menu")
                            }
                            .foregroundColor(.orange)
                        }
                        Spacer()

                        // Connection indicator
                        Circle()
                            .fill(firebase.currentGame != nil ? Color.green : Color.red)
                            .frame(width: 10, height: 10)
                            .padding(.trailing, 8)
                    }
                    .padding()
                    

                    if settings.namespace.isEmpty {
                        // No namespace configured
                        VStack(spacing: 16) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 48))
                                .foregroundColor(.yellow)
                            Text("No namespace configured")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text("Go to Settings to set your email")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            Button(action: { selectedScreen = .settings }) {
                                Text("Open Settings")
                                    .foregroundColor(.orange)
                                    .padding()
                                    .background(Color(white: 0.2))
                                    .cornerRadius(10)
                            }
                        }
                    } else {
                        // Scoreboard (read-only)
                        ScoreboardView(
                            gameState: $gameState,
                            interactive: false,
                            format: gameState.format
                        )
                        .padding(.horizontal, 16)
                    }


                    // Status
                    Text(firebase.currentGame != nil ? "Connected" : "Waiting for data...")
                        .foregroundColor(firebase.currentGame != nil ? Color.green : Color.gray)
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .padding(.bottom, 8)
                    
                    Spacer()
                    Spacer()
                    
                    // Header
                    HStack {
                        Button(action: { selectedScreen = .home }) {
                            HStack(spacing: 4) {
                                Image(systemName: "chevron.left")
                                Text("Menu")
                            }
                            .foregroundColor(.orange)
                        }
                        Spacer()

                        // Game # button
                        Button(action: { showGamePicker = true }) {
                            Text("Game \(settings.mirrorGame)")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(white: 0.25))
                                .cornerRadius(8)
                        }

                        Spacer()

                        // Connection indicator
                        Circle()
                            .fill(firebase.currentGame != nil ? Color.green : Color.red)
                            .frame(width: 10, height: 10)
                            .padding(.trailing, 8)
                    }
                    .padding()
                    
                }
            }
        }
        .onAppear {
            startListening()
        }
        .onDisappear {
            stopListening()
        }
        .onChange(of: settings.namespace) { _, _ in
            restartListening()
        }
        .onChange(of: settings.mirrorGame) { _, _ in
            restartListening()
        }
        .onReceive(firebase.$currentGame) { newGame in
            if let game = newGame {
                gameState = game
            }
        }
        .sheet(isPresented: $showGamePicker) {
            GamePickerSheet(selectedGame: $settings.mirrorGame)
                .presentationDetents([.medium])
        }
    }

    private func startListening() {
        guard !settings.namespace.isEmpty else { return }
        firebase.listenToGame(namespace: settings.sanitizedNamespace, gameNumber: settings.mirrorGame)
    }

    private func stopListening() {
        firebase.stopListeningToGame()
    }

    private func restartListening() {
        stopListening()
        startListening()
    }
}

// MARK: - Game Picker Sheet

struct GamePickerSheet: View {
    @Binding var selectedGame: Int
    @Environment(\.dismiss) private var dismiss
    @State private var tempGame: Int = 0

    var body: some View {
        NavigationView {
            VStack {
                Picker("Game", selection: $tempGame) {
                    ForEach(0..<100, id: \.self) { num in
                        Text("Game \(num)").tag(num)
                    }
                }
                .pickerStyle(.wheel)
            }
            .navigationTitle("Select Game")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        selectedGame = tempGame
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            tempGame = selectedGame
        }
    }
}

#Preview {
    MirrorView(selectedScreen: .constant(.mirror))
}
