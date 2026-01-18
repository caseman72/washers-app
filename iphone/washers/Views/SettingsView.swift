//
//  SettingsView.swift
//  washers
//

import SwiftUI

struct SettingsView: View {
    @Binding var selectedScreen: AppScreen
    @StateObject private var settings = SettingsService.shared

    let formatOptions = [1, 3, 5, 7]
    let gameOptions = Array(0...99)

    var body: some View {
        ZStack {
            Color.boardBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: { selectedScreen = .home }) {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                            Text("Back")
                        }
                        .foregroundColor(.orange)
                    }
                    Spacer()
                    Text("Settings")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                    // Spacer for balance
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                        Text("Back")
                    }
                    .opacity(0)
                }
                .padding()

                Form {
                    Section(header: Text("Account")) {
                        TextField("Email (namespace)", text: $settings.namespace)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .autocorrectionDisabled()
                    }

                    Section(header: Text("Game Format")) {
                        Picker("Best of", selection: $settings.format) {
                            ForEach(formatOptions, id: \.self) { option in
                                Text("Best of \(option)").tag(option)
                            }
                        }
                        .pickerStyle(.segmented)
                    }

                    Section(header: Text("Mirror Mode")) {
                        Picker("Game Table", selection: $settings.mirrorGame) {
                            ForEach(gameOptions, id: \.self) { option in
                                Text("Game \(option)").tag(option)
                            }
                        }
                    }
                }
                .scrollContentBackground(.hidden)
            }
        }
    }
}

#Preview {
    SettingsView(selectedScreen: .constant(.settings))
}
