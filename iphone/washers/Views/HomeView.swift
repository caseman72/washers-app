//
//  HomeView.swift
//  washers
//

import SwiftUI

enum AppScreen: Hashable {
    case home
    case mirror
    case keepScore
    case players
    case settings
}

struct HomeView: View {
    @Binding var selectedScreen: AppScreen
    @StateObject private var settings = SettingsService.shared

    var body: some View {
        ZStack {
            Color.boardBackground.ignoresSafeArea()

            VStack(spacing: 24) {
                Text("Washers")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.top, 60)

                Spacer()

                VStack(spacing: 16) {
                    MenuButton(title: "Mirror", icon: "display") {
                        selectedScreen = .mirror
                    }

                    MenuButton(title: "Keep Score", icon: "plusminus.circle") {
                        selectedScreen = .keepScore
                    }

                    MenuButton(title: "Players", icon: "person.2") {
                        selectedScreen = .players
                    }

                    MenuButton(title: "Settings", icon: "gearshape") {
                        selectedScreen = .settings
                    }
                }
                .padding(.horizontal, 40)

                Spacer()

                if !settings.namespace.isEmpty {
                    Text(settings.namespace)
                        .font(.caption)
                        .foregroundColor(.gray)
                        .padding(.bottom, 20)
                }
            }
        }
    }
}

struct MenuButton: View {
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .frame(width: 30)
                Text(title)
                    .font(.title2)
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(.gray)
            }
            .padding()
            .background(Color(white: 0.2))
            .foregroundColor(.white)
            .cornerRadius(12)
        }
    }
}

#Preview {
    HomeView(selectedScreen: .constant(.home))
}
