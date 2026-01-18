//
//  ContentView.swift
//  washers
//
//  Created by Casey Manion on 1/17/26.
//

import SwiftUI

struct ContentView: View {
    @State private var selectedScreen: AppScreen = .home

    var body: some View {
        Group {
            switch selectedScreen {
            case .home:
                HomeView(selectedScreen: $selectedScreen)
            case .mirror:
                MirrorView(selectedScreen: $selectedScreen)
            case .keepScore:
                KeepScoreView(selectedScreen: $selectedScreen)
            case .players:
                PlayersView(selectedScreen: $selectedScreen)
            case .settings:
                SettingsView(selectedScreen: $selectedScreen)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: selectedScreen)
    }
}

#Preview {
    ContentView()
}
