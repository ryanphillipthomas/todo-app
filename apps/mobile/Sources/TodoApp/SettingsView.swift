import SwiftUI

struct SettingsView: View {
    @Environment(AuthStore.self) private var auth
    @AppStorage("appearance") private var appearance: String = "System"
    @State private var showWhatsNew = false

    private let appearanceOptions = ["Light", "Dark", "System"]

    var body: some View {
        NavigationStack {
            Form {
                // MARK: Account
                Section("Account") {
                    HStack(spacing: 14) {
                        initialsAvatar
                        VStack(alignment: .leading, spacing: 2) {
                            if let name = auth.user?.name {
                                Text(name)
                                    .font(.headline)
                            }
                            if let email = auth.user?.email {
                                Text(email)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }

                // MARK: Appearance
                Section("Appearance") {
                    Picker("Theme", selection: $appearance) {
                        ForEach(appearanceOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                    .listRowInsets(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16))
                    .onChange(of: appearance) { _, newValue in
                        applyAppearance(newValue)
                    }
                }

                // MARK: About
                Section("About") {
                    Button("What's New") {
                        showWhatsNew = true
                    }
                    .foregroundStyle(.primary)

                    HStack {
                        Text("Version")
                        Spacer()
                        Text(appVersion)
                            .foregroundStyle(.secondary)
                    }
                }

                // MARK: Danger zone
                Section {
                    Button("Sign Out", role: .destructive) {
                        auth.signOut()
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showWhatsNew) {
                WhatsNewView(isPresented: $showWhatsNew)
            }
        }
    }

    // MARK: - Helpers

    private var initialsAvatar: some View {
        Circle()
            .fill(Color.blue)
            .frame(width: 48, height: 48)
            .overlay {
                Text(initials)
                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
            }
    }

    private var initials: String {
        if let name = auth.user?.name {
            let parts = name.split(separator: " ")
            let letters = parts.prefix(2).compactMap { $0.first }.map { String($0) }
            return letters.joined().uppercased()
        }
        if let email = auth.user?.email, let first = email.first {
            return String(first).uppercased()
        }
        return "?"
    }

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "—"
    }

    private func applyAppearance(_ value: String) {
        let style: UIUserInterfaceStyle
        switch value {
        case "Light":  style = .light
        case "Dark":   style = .dark
        default:       style = .unspecified
        }
        for scene in UIApplication.shared.connectedScenes {
            guard let windowScene = scene as? UIWindowScene else { continue }
            for window in windowScene.windows {
                window.overrideUserInterfaceStyle = style
            }
        }
    }
}
