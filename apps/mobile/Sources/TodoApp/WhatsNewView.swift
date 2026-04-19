import SwiftUI

struct ChangeEntry {
    enum ChangeType { case feature, improvement, fix }
    let type: ChangeType
    let text: String
}

struct AppRelease {
    let version: String
    let date: String
    let changes: [ChangeEntry]
}

private let releases: [AppRelease] = [
    AppRelease(version: "1.2.0", date: "Apr 19, 2026", changes: [
        ChangeEntry(type: .feature, text: "Sign in with Apple"),
        ChangeEntry(type: .feature, text: "Your todos are now private to your account"),
        ChangeEntry(type: .improvement, text: "Tokens stored securely in Keychain"),
        ChangeEntry(type: .improvement, text: "Sessions restore automatically on launch"),
    ]),
    AppRelease(version: "1.1.0", date: "Apr 19, 2026", changes: [
        ChangeEntry(type: .feature, text: "Real-time sync across all devices"),
        ChangeEntry(type: .feature, text: "Todos persist across sessions"),
        ChangeEntry(type: .improvement, text: "Connection status indicator"),
        ChangeEntry(type: .improvement, text: "Auto-reconnect with backoff"),
    ]),
    AppRelease(version: "1.0.0", date: "Apr 19, 2026", changes: [
        ChangeEntry(type: .feature, text: "Add, complete, and delete todos"),
        ChangeEntry(type: .feature, text: "Available on web and iOS"),
        ChangeEntry(type: .improvement, text: "Incomplete todos sorted before completed"),
    ]),
]

let currentAppVersion = releases.first!.version

struct WhatsNewView: View {
    @Binding var isPresented: Bool

    var body: some View {
        NavigationStack {
            List {
                ForEach(releases, id: \.version) { release in
                    Section {
                        ForEach(release.changes, id: \.text) { change in
                            HStack(alignment: .top, spacing: 10) {
                                Text(change.type.label)
                                    .font(.caption.bold())
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 7)
                                    .padding(.vertical, 3)
                                    .background(change.type.color)
                                    .clipShape(RoundedRectangle(cornerRadius: 4))
                                Text(change.text)
                                    .font(.subheadline)
                            }
                            .padding(.vertical, 2)
                        }
                    } header: {
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text("v\(release.version)")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Text(release.date)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .textCase(nil)
                    }
                }
            }
            .navigationTitle("What's New")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { isPresented = false }
                        .bold()
                }
            }
        }
    }
}

private extension ChangeEntry.ChangeType {
    var label: String {
        switch self {
        case .feature: "New"
        case .improvement: "Improved"
        case .fix: "Fixed"
        }
    }

    var color: Color {
        switch self {
        case .feature: .black
        case .improvement: .blue
        case .fix: .green
        }
    }
}
