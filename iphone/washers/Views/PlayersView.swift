//
//  PlayersView.swift
//  washers
//

import SwiftUI
import Combine

struct PlayersView: View {
    @Binding var selectedScreen: AppScreen
    @StateObject private var settings = SettingsService.shared
    @StateObject private var firebase = FirebaseService.shared
    @State private var newPlayerName = ""
    @State private var showAddPlayer = false
    @State private var playerToDelete: Player? = nil

    var sortedPlayers: [Player] {
        firebase.players.sorted { $0.name.lowercased() < $1.name.lowercased() }
    }

    var body: some View {
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
                    Text("Players")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                    Button(action: { showAddPlayer = true }) {
                        Image(systemName: "plus")
                            .foregroundColor(.orange)
                    }
                    .disabled(settings.namespace.isEmpty)
                }
                .padding()

                if settings.namespace.isEmpty {
                    // No namespace configured
                    Spacer()
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
                    Spacer()
                } else if sortedPlayers.isEmpty {
                    // No players yet
                    Spacer()
                    VStack(spacing: 16) {
                        Image(systemName: "person.badge.plus")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        Text("No players yet")
                            .font(.headline)
                            .foregroundColor(.white)
                        Text("Tap + to add a player")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    Spacer()
                } else {
                    // Players list
                    List {
                        ForEach(sortedPlayers) { player in
                            PlayerRow(player: player)
                                .listRowBackground(Color(white: 0.15))
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button(role: .destructive) {
                                        playerToDelete = player
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }

                // Status
                if !settings.namespace.isEmpty {
                    Text("\(sortedPlayers.count) players")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .padding(.bottom, 8)
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
        .alert("Add Player", isPresented: $showAddPlayer) {
            TextField("Name", text: $newPlayerName)
            Button("Cancel", role: .cancel) {
                newPlayerName = ""
            }
            Button("Add") {
                addPlayer()
            }
            .disabled(newPlayerName.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .alert("Delete Player", isPresented: .init(
            get: { playerToDelete != nil },
            set: { if !$0 { playerToDelete = nil } }
        )) {
            Button("Cancel", role: .cancel) {
                playerToDelete = nil
            }
            Button("Delete", role: .destructive) {
                if let player = playerToDelete {
                    deletePlayer(player)
                }
            }
        } message: {
            if let player = playerToDelete {
                Text("Delete \(player.name)?")
            }
        }
    }

    private func startListening() {
        guard !settings.namespace.isEmpty else { return }
        firebase.listenToPlayers(namespace: settings.sanitizedNamespace)
    }

    private func stopListening() {
        firebase.stopListeningToPlayers()
    }

    private func restartListening() {
        stopListening()
        startListening()
    }

    private func addPlayer() {
        let name = newPlayerName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }

        firebase.addPlayer(name: name, namespace: settings.sanitizedNamespace)
        newPlayerName = ""
    }

    private func deletePlayer(_ player: Player) {
        firebase.deletePlayer(id: player.id, namespace: settings.sanitizedNamespace)
        playerToDelete = nil
    }
}

struct PlayerRow: View {
    let player: Player

    var body: some View {
        HStack {
            Circle()
                .fill(Color.orange)
                .frame(width: 40, height: 40)
                .overlay(
                    Text(String(player.name.prefix(1)).uppercased())
                        .font(.headline)
                        .foregroundColor(.white)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(player.name)
                    .font(.body)
                    .foregroundColor(.white)

                HStack(spacing: 12) {
                    Text("W: \(player.wins)")
                    Text("L: \(player.losses)")
                }
                .font(.caption)
                .foregroundColor(.gray)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    PlayersView(selectedScreen: .constant(.players))
}
