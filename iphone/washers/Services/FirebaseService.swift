//
//  FirebaseService.swift
//  washers
//
//  Firebase integration for game state and players
//

import Foundation
import Combine
import FirebaseCore
import FirebaseAuth
import FirebaseDatabase

class FirebaseService: ObservableObject {
    static let shared = FirebaseService()

    private var db: DatabaseReference?
    private var authHandle: AuthStateDidChangeListenerHandle?
    private var gameListener: DatabaseHandle?
    private var playersListener: DatabaseHandle?

    @Published var isAuthenticated = false
    @Published var currentGame: GameState?
    @Published var players: [Player] = []

    private init() {}

    // MARK: - Setup

    func configure() {
        FirebaseApp.configure()
        db = Database.database().reference()
        signInAnonymously()
    }

    private func signInAnonymously() {
        Auth.auth().signInAnonymously { [weak self] result, error in
            if let error = error {
                print("Firebase auth error: \(error.localizedDescription)")
                return
            }
            self?.isAuthenticated = result?.user != nil
        }
    }

    // MARK: - Game State

    func listenToGame(namespace: String, gameNumber: Int) {
        stopListeningToGame()

        guard !namespace.isEmpty else { return }

        let sanitized = sanitize(namespace)
        let path = "games/\(sanitized)/\(gameNumber)/current"

        gameListener = db?.child(path).observe(.value) { [weak self] snapshot in
            guard let dict = snapshot.value as? [String: Any] else {
                self?.currentGame = nil
                return
            }
            self?.currentGame = self?.parseGameState(dict)
        }
    }

    func stopListeningToGame() {
        if let handle = gameListener {
            db?.removeObserver(withHandle: handle)
            gameListener = nil
        }
        currentGame = nil
    }

    func saveGameState(_ state: GameState, namespace: String, gameNumber: Int) {
        guard !namespace.isEmpty else { return }

        let sanitized = sanitize(namespace)
        let path = "games/\(sanitized)/\(gameNumber)/current"

        let data: [String: Any] = [
            "player1Score": state.player1Score,
            "player2Score": state.player2Score,
            "player1Games": state.player1Games,
            "player2Games": state.player2Games,
            "player1Rounds": state.player1Rounds,
            "player2Rounds": state.player2Rounds,
            "player1Color": state.player1Color.uppercased(),
            "player2Color": state.player2Color.uppercased(),
            "player1Name": state.player1Name,
            "player2Name": state.player2Name,
            "player1Id": state.player1Id,
            "player2Id": state.player2Id,
            "format": state.format
        ]

        db?.child(path).updateChildValues(data)
    }

    // MARK: - Players

    func listenToPlayers(namespace: String) {
        stopListeningToPlayers()

        guard !namespace.isEmpty else { return }

        let sanitized = sanitize(namespace)
        let path = "players/\(sanitized)"

        playersListener = db?.child(path).observe(.value) { [weak self] snapshot in
            var players: [Player] = []

            for child in snapshot.children {
                guard let snap = child as? DataSnapshot,
                      let dict = snap.value as? [String: Any],
                      let name = dict["name"] as? String else { continue }

                var player = Player(id: snap.key, name: name)
                player.wins = dict["wins"] as? Int ?? 0
                player.losses = dict["losses"] as? Int ?? 0
                player.tournamentWins = dict["tournamentWins"] as? Int ?? 0
                player.tournamentLosses = dict["tournamentLosses"] as? Int ?? 0
                player.teamWins = dict["teamWins"] as? Int ?? 0
                player.teamLosses = dict["teamLosses"] as? Int ?? 0
                player.finalsWins = dict["finalsWins"] as? Int ?? 0
                player.finalsLosses = dict["finalsLosses"] as? Int ?? 0
                player.teamFinalsWins = dict["teamFinalsWins"] as? Int ?? 0
                player.teamFinalsLosses = dict["teamFinalsLosses"] as? Int ?? 0
                players.append(player)
            }

            self?.players = players
        }
    }

    func stopListeningToPlayers() {
        if let handle = playersListener {
            db?.removeObserver(withHandle: handle)
            playersListener = nil
        }
        players = []
    }

    func addPlayer(name: String, namespace: String) {
        guard !namespace.isEmpty, !name.isEmpty else { return }

        let sanitized = sanitize(namespace)
        let path = "players/\(sanitized)"

        let newRef = db?.child(path).childByAutoId()
        newRef?.setValue([
            "name": name,
            "wins": 0,
            "losses": 0,
            "tournamentWins": 0,
            "tournamentLosses": 0,
            "teamWins": 0,
            "teamLosses": 0,
            "finalsWins": 0,
            "finalsLosses": 0,
            "teamFinalsWins": 0,
            "teamFinalsLosses": 0
        ])
    }

    func deletePlayer(id: String, namespace: String) {
        guard !namespace.isEmpty else { return }

        let sanitized = sanitize(namespace)
        let path = "players/\(sanitized)/\(id)"

        db?.child(path).removeValue()
    }

    // MARK: - Helpers

    private func sanitize(_ namespace: String) -> String {
        namespace
            .lowercased()
            .replacingOccurrences(of: ".", with: "_")
            .replacingOccurrences(of: "#", with: "_")
            .replacingOccurrences(of: "$", with: "_")
            .replacingOccurrences(of: "[", with: "_")
            .replacingOccurrences(of: "]", with: "_")
    }

    private func parseGameState(_ dict: [String: Any]) -> GameState {
        var state = GameState()
        state.player1Score = dict["player1Score"] as? Int ?? 0
        state.player2Score = dict["player2Score"] as? Int ?? 0
        state.player1Games = dict["player1Games"] as? Int ?? 0
        state.player2Games = dict["player2Games"] as? Int ?? 0
        state.player1Rounds = dict["player1Rounds"] as? Int ?? 0
        state.player2Rounds = dict["player2Rounds"] as? Int ?? 0
        state.player1Color = (dict["player1Color"] as? String ?? "ORANGE").lowercased()
        state.player2Color = (dict["player2Color"] as? String ?? "BLACK").lowercased()
        state.player1Name = dict["player1Name"] as? String ?? ""
        state.player2Name = dict["player2Name"] as? String ?? ""
        state.player1Id = dict["player1Id"] as? String ?? ""
        state.player2Id = dict["player2Id"] as? String ?? ""
        state.format = dict["format"] as? Int ?? 1
        return state
    }
}
