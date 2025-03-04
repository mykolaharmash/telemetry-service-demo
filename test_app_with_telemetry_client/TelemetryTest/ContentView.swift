//
//  ContentView.swift
//  TelemetryTest
//
//  Created by Mykola Harmash on 20.02.25.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 30) {
            CircleButton(color: .red)
            CircleButton(color: .green)
            CircleButton(color: .blue)
        }
        .padding()
    }
}

fileprivate struct CircleButton: View {
    let color: Color
    
    var body: some View {
        Button(action: {
            TelemetryClient.shared.circleTapped(color: color)
        }) {
            Circle()
                .fill(color)
                .frame(width: 80)
        }
    }
}

#Preview {
    ContentView()
}
