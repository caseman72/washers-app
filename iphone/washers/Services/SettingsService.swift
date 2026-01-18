//
//  SettingsService.swift
//  washers
//

import Foundation
import Combine

class SettingsService: ObservableObject {
    static let shared = SettingsService()

    private let defaults = UserDefaults.standard

    private enum Keys {
        static let namespace = "namespace"
        static let format = "format"
        static let mirrorGame = "mirrorGame"
    }

    @Published var namespace: String {
        didSet { defaults.set(namespace, forKey: Keys.namespace) }
    }

    @Published var format: Int {
        didSet { defaults.set(format, forKey: Keys.format) }
    }

    @Published var mirrorGame: Int {
        didSet { defaults.set(mirrorGame, forKey: Keys.mirrorGame) }
    }

    private init() {
        let storedFormat = defaults.integer(forKey: Keys.format)

        self.namespace = defaults.string(forKey: Keys.namespace) ?? ""
        self.format = storedFormat == 0 ? 1 : storedFormat
        self.mirrorGame = defaults.object(forKey: Keys.mirrorGame) as? Int ?? 0
    }

    var sanitizedNamespace: String {
        namespace
            .lowercased()
            .replacingOccurrences(of: ".", with: "_")
            .replacingOccurrences(of: "#", with: "_")
            .replacingOccurrences(of: "$", with: "_")
            .replacingOccurrences(of: "[", with: "_")
            .replacingOccurrences(of: "]", with: "_")
    }
}
