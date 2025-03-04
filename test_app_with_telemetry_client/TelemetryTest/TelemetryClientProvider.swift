//
//  TelemetryClientProvider.swift
//  TelemetryTest
//
//  Created by Mykola Harmash on 21.02.25.
//

import SwiftUI

struct TelemetryClientProvider: ViewModifier {
    @State private var sendEventsBatchTimer = Timer.publish(every: 5, tolerance: 3, on: .main, in: .common).autoconnect()
    
    @Environment(\.scenePhase) private var scenePhase
    
    func body(content: Content) -> some View {
        content
            .onChange(of: scenePhase) { _, newPhase in
                switch newPhase {
                case .active:
                    Task {
                        await TelemetryClient.shared.loadQueueFromStorage()
                    }
                case .background:
                    Task {
                        await TelemetryClient.shared.saveQueueToStorage()
                    }
                default:
                    return
                }
            }
            .onReceive(sendEventsBatchTimer) { _ in
                Task {
                    let backgroundTaskID = UIApplication.shared.beginBackgroundTask()
                    
                    await TelemetryClient.shared.sendNextEventsBatch()
                    
                    UIApplication.shared.endBackgroundTask(backgroundTaskID)
                }
            }
    }
}
