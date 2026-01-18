//
//  Player.swift
//  washers
//

import Foundation

struct Player: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var wins: Int = 0
    var losses: Int = 0
    var tournamentWins: Int = 0
    var tournamentLosses: Int = 0
    var teamWins: Int = 0
    var teamLosses: Int = 0
    var finalsWins: Int = 0
    var finalsLosses: Int = 0
    var teamFinalsWins: Int = 0
    var teamFinalsLosses: Int = 0

    init(id: String = UUID().uuidString, name: String) {
        self.id = id
        self.name = name
    }
}
