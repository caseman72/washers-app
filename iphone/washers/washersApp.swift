//
//  washersApp.swift
//  washers
//
//  Created by Casey Manion on 1/17/26.
//

import SwiftUI

@main
struct washersApp: App {
    init() {
        FirebaseService.shared.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
