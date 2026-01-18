//
//  Color+Washers.swift
//  washers
//

import SwiftUI

struct WasherColor: Identifiable, Equatable {
    let id: String
    let name: String
    let background: Color
    let text: Color

    static let all: [WasherColor] = [
        WasherColor(id: "orange", name: "Orange", background: Color(hex: "#d35400"), text: .white),
        WasherColor(id: "black", name: "Black", background: Color(hex: "#1a1a1a"), text: .white),
        WasherColor(id: "silver", name: "Silver", background: Color(hex: "#c0c0c0"), text: .black),
        WasherColor(id: "red", name: "Red", background: Color(hex: "#c0392b"), text: .white),
        WasherColor(id: "white", name: "White", background: .white, text: .black),
        WasherColor(id: "blue", name: "Blue", background: Color(hex: "#2980b9"), text: .white),
        WasherColor(id: "yellow", name: "Yellow", background: Color(hex: "#f1c40f"), text: .black),
        WasherColor(id: "purple", name: "Purple", background: Color(hex: "#8e44ad"), text: .white),
        WasherColor(id: "green", name: "Green", background: Color(hex: "#27ae60"), text: .white),
        WasherColor(id: "brown", name: "Brown", background: Color(hex: "#795548"), text: .white),
    ]

    static func get(_ id: String) -> WasherColor {
        all.first { $0.id == id.lowercased() } ?? all[0]
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    static let boardBackground = Color(hex: "#515151")
}
