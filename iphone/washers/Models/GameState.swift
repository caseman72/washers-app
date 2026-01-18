//
//  GameState.swift
//  washers
//

import Foundation

struct GameState: Codable, Equatable {
    var player1Score: Int = 0
    var player2Score: Int = 0
    var player1Games: Int = 0
    var player2Games: Int = 0
    var player1Rounds: Int = 0
    var player2Rounds: Int = 0
    var player1Color: String = "orange"
    var player2Color: String = "black"
    var player1Name: String = ""
    var player2Name: String = ""
    var player1Id: String = ""
    var player2Id: String = ""
    var format: Int = 1

    static let empty = GameState()
}
