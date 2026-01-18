//
//  KeepScoreView.swift
//  washers
//

import SwiftUI
import Combine

struct KeepScoreView: View {
    @Binding var selectedScreen: AppScreen
    @StateObject private var settings = SettingsService.shared
    @StateObject private var firebase = FirebaseService.shared
    @State private var gameState = GameState()
    @State private var gameNumber: Int = 0
    @State private var showGamePicker = false
    @State private var showFormatPicker = false

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

                        // Game # button
                        Button(action: { showGamePicker = true }) {
                            Text("Game \(gameNumber)")
                                .font(.subheadline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color(white: 0.25))
                                .cornerRadius(6)
                        }

                        // Format button
                        Button(action: { showFormatPicker = true }) {
                            Text("Bo\(settings.format)")
                                .font(.subheadline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color(white: 0.25))
                                .cornerRadius(6)
                        }

                        Spacer()

                        // Sync indicator
                        Circle()
                            .fill(!settings.namespace.isEmpty ? Color.green : Color.gray)
                            .frame(width: 10, height: 10)
                    }
                    .padding()

                    Spacer()

                    // Scoreboard
                    ScoreboardView(
                        gameState: $gameState,
                        interactive: true,
                        format: settings.format,
                        onStateChange: { newState in
                            saveToFirebase(newState)
                        }
                    )
                    .padding(.horizontal, 16)

                    Spacer()

                    // Status
                    if !settings.namespace.isEmpty {
                        Text("\(settings.namespace) / \(gameNumber)")
                            .font(.caption)
                            .foregroundColor(.gray)
                            .padding(.bottom, 8)
                    }
                }
            }
        }
        .onAppear {
            gameState.format = settings.format
            loadFromFirebase()
        }
        .onChange(of: gameNumber) { _, _ in
            loadFromFirebase()
        }
        .sheet(isPresented: $showGamePicker) {
            GamePickerSheet(selectedGame: $gameNumber)
                .presentationDetents([.medium])
        }
        .sheet(isPresented: $showFormatPicker) {
            FormatPickerSheet(selectedFormat: $settings.format)
                .presentationDetents([.height(250)])
        }
    }

    private func loadFromFirebase() {
        guard !settings.namespace.isEmpty else { return }
        firebase.listenToGame(namespace: settings.sanitizedNamespace, gameNumber: gameNumber)
    }

    private func saveToFirebase(_ state: GameState) {
        guard !settings.namespace.isEmpty else { return }
        var stateToSave = state
        stateToSave.format = settings.format
        firebase.saveGameState(stateToSave, namespace: settings.sanitizedNamespace, gameNumber: gameNumber)
    }
}

// MARK: - Format Picker Sheet

struct FormatPickerSheet: View {
    @Binding var selectedFormat: Int
    @Environment(\.dismiss) private var dismiss

    let formats = [1, 3, 5, 7]

    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                ForEach(formats, id: \.self) { format in
                    Button(action: {
                        selectedFormat = format
                        dismiss()
                    }) {
                        HStack {
                            Text("Best of \(format)")
                                .font(.title3)
                                .foregroundColor(.white)
                            Spacer()
                            if selectedFormat == format {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.green)
                            }
                        }
                        .padding()
                        .background(Color(white: 0.2))
                        .cornerRadius(10)
                    }
                }
                Spacer()
            }
            .padding()
            .background(Color(white: 0.1))
            .navigationTitle("Game Format")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    KeepScoreView(selectedScreen: .constant(.keepScore))
}
