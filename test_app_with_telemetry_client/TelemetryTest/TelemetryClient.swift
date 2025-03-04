//
//  TelemetryClient.swift
//  TelemetryTest
//
//  Created by Mykola Harmash on 21.02.25.
//

import Foundation
import UIKit
import OSLog
import SwiftUI

fileprivate let logger = Logger(subsystem: "BasicTelemetryTestApp", category: "TelemetryClient")

fileprivate struct TelemetryEvent: Codable {
    var id = UUID()
    let deviceId: String
    let eventKind: String
    var createdAt = Int(Date.now.timeIntervalSince1970)
    var parameters: [String: String] = [:]
}

fileprivate let CACHE_FILE_URL: URL? = FileManager.default
    .urls(for: .cachesDirectory, in: .userDomainMask)
    .first?
    .appending(components: "telemetry-events-cache")
    .appendingPathExtension("json")

fileprivate enum TelemetryError: Error {
    case ServerDidNotAcceptEvents(response: String)
}

actor TelemetryClient {
    static let shared: TelemetryClient = .init(
        serverHost: URL(string: "http://localhost:3000")!,
        ingestToken: "dev-ingest-token"
    )
    
    static let BATCH_SIZE: Int = 20
    
    let serverHost: URL
    let ingestToken: String
    
    private var eventQueue: [TelemetryEvent] = []
    
    init(serverHost: URL, ingestToken: String) {
        self.serverHost = serverHost
        self.ingestToken = ingestToken
    }
    
    func enqueue(_ eventKind: String, _ parameters: [String: String]) async {
        eventQueue.append(
            .init(
                deviceId: await getDeviceId(),
                eventKind: eventKind,
                parameters: parameters
            )
        )
    }
    
    func sendNextEventsBatch() async {
        logger.log("\(#function) Attempting to send the next telemetry events batch.")
        
        let eventList = takeNextEventBatch()
        
        print(eventList)
        
        guard !eventList.isEmpty else {
            logger.log("\(#function) The events queue is empty, nothing to send.")
            return
        }
        
        let url = serverHost.appending(component: "events")
        var request = URLRequest(url: url)
        
        request.httpMethod = "POST"
        request.setValue("Bearer \(ingestToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(eventList)
            let (_, response) = try await URLSession.shared.data(for: request)
            let httpResponse = response as! HTTPURLResponse
            
            guard httpResponse.statusCode == 202 else {
                throw TelemetryError.ServerDidNotAcceptEvents(response: response.debugDescription)
            }
            
            logger.log("Successfully sent the next telemetry events batch. Sent events count: \(eventList.count)")
        } catch {
            switch error {
            case TelemetryError.ServerDidNotAcceptEvents(let response):
                logger.error(
                    "Telemetry server did not accept the events batch. \(response)"
                )
            default:
                logger.error(
                    "An error occurred while sending the next telemetry events batch. \(error.localizedDescription)"
                )
            }
            
            logger.log("\(#function) Adding the events back to the queue.")
            eventQueue.append(contentsOf: eventList)
        }
    }
    
    func loadQueueFromStorage() {
        guard
            let cacheFileUrl = CACHE_FILE_URL,
            FileManager.default.fileExists(atPath: cacheFileUrl.path())
        else {
            logger.info("\(#function) - Telemetry events cache file does not exist")
            return
        }
        
        do {
            let eventsCacheData: Data = try Data(contentsOf: cacheFileUrl)
            
            self.eventQueue = try JSONDecoder().decode([TelemetryEvent].self, from: eventsCacheData)
            
            try FileManager.default.removeItem(atPath: cacheFileUrl.path())
            
            logger.info("\(#function) - Successfully read and decoded events cache from storage")
        } catch {
            logger.error("\(#function) - Could not load events cache from storage. \(error)")
            
            return
        }
    }
    
    func saveQueueToStorage() {
        guard !eventQueue.isEmpty else {
            logger.info("\(#function) - events queue is empty, nothing to save")
            return
        }
        
        do {
            let eventsCacheData = try JSONEncoder().encode(eventQueue)
            try eventsCacheData.write(to: CACHE_FILE_URL!)
            
            self.eventQueue = []
            
            logger.info("\(#function) - Successfully saved events cache to storage")
        } catch {
            logger.error("\(#function) - Could not save events cache to storage. \(error)")
        }
    }
    
    private func takeNextEventBatch() -> [TelemetryEvent] {
        let nextBatch = Array(eventQueue.prefix(Self.BATCH_SIZE))
        
        eventQueue.removeFirst(min(Self.BATCH_SIZE, eventQueue.count))
        
        return nextBatch
    }
    
    private func getDeviceId() async -> String {
        if let identifierForVendor = await UIDevice.current.identifierForVendor?.uuidString {
            return identifierForVendor
        }
        
        return "Unknown Device ID"
    }
    
    /** Sending events convenience methods */
    
    @MainActor
    func circleTapped(color: Color) {
        Task {
            await self.enqueue("circle-tapped", ["color": color.description])
        }
    }
    
}
