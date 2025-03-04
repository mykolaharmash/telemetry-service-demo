//
//  TelemetryTestApp.swift
//  TelemetryTest
//
//  Created by Mykola Harmash on 20.02.25.
//

import SwiftUI

@main
struct TelemetryTestApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .modifier(TelemetryClientProvider())
        }
    }
}
