//
//  ContentView.swift
//  TelemetryDashboard
//
//  Created by Mykola Harmash on 23.02.25.
//

import Foundation
import SwiftUI
import Charts

fileprivate let SERVER_HOST = URL(string: "http://localhost:3000")!
fileprivate let SERVER_READ_TOKEN = "dev-read-token"

fileprivate struct TimeSeriesChartDataPoint: Codable, Identifiable {
    var id: String { "\(valueType)_\(timestamp)" }
    
    let timestamp: Double
    let valueType: String
    let value: Double
}

fileprivate struct ValueDistributionChartDataPoint: Decodable, Identifiable {
    var id: String { valueName }
    
    let valueName: String
    let value: Double
}

struct TelemetryDashboard: View {
    @State private var colorsOverTime: [TimeSeriesChartDataPoint] = []
    @State private var colorsDistribution: [ValueDistributionChartDataPoint] = []
    
    var body: some View {
        let foregroundStyleScale: (String) -> Color = { color in
            switch color {
            case "red": .red
            case "green": .green
            case "blue": .blue
            default: .black
            }
        }
        
        ScrollView {
            VStack(spacing: 30) {
                Chart {
                    ForEach(colorsOverTime) { dataPoint in
                        BarMark(
                            x: .value(
                                "Timestamp",
                                Date(timeIntervalSince1970: dataPoint.timestamp),
                                unit: .minute
                            ),
                            y: .value("Value", dataPoint.value)
                        )
                        .foregroundStyle(by: .value("Type", dataPoint.valueType))
                    }
                }
                .chartForegroundStyleScale(mapping: foregroundStyleScale)
                .chartXAxis {
                    AxisMarks(
                        format: .dateTime.hour().minute(),
                        values: .stride(by: .minute, count: 2)
                    )
                }
                .padding()
                .background(Color.white)
                .clipShape(.rect(cornerRadius: 12))
                .frame(height: 270)
                
                Chart {
                    ForEach(colorsDistribution) { dataPoint in
                        SectorMark(
                            angle: .value("Value", dataPoint.value),
                            innerRadius: .ratio(0.618),
                            outerRadius: .inset(10),
                            angularInset: 1
                        )
                        .foregroundStyle(by: .value("Name", dataPoint.valueName))
                    }
                }
                .chartForegroundStyleScale(mapping: foregroundStyleScale)
                .padding()
                .background(Color.white)
                .clipShape(.rect(cornerRadius: 12))
                .frame(height: 270)
            }
            .padding()
        }
        .refreshable {
            fetchData()
        }
        .background(.gray.opacity(0.2))
        .onAppear {
            fetchData()
        }
    }
    
    fileprivate func fetchData() {
        Task {
            colorsOverTime = await fetchTelemetryData(path: "colors-over-time") ?? []
            colorsDistribution = await fetchTelemetryData(path: "colors-distribution") ?? []
        }
    }
    
    fileprivate func fetchTelemetryData<Data: Decodable>(path: String) async -> Data? {
        var request = URLRequest(url: SERVER_HOST.appendingPathComponent(path))

        do {
     
            request.httpMethod = "GET"
            request.addValue("Bearer \(SERVER_READ_TOKEN)", forHTTPHeaderField: "Authorization")
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard
                let httpResponse = response as? HTTPURLResponse,
                httpResponse.statusCode == 200
            else {
                print("Response is not 200 or content type is not JSON. \(response.debugDescription)")
                return nil
            }
            
            return try JSONDecoder().decode(Data.self, from: data)
        } catch {
            print(error)
            return nil
        }
    }
}

#Preview {
    TelemetryDashboard()
}
