import SwiftUI

@Observable
class TodoStore {
    var todos: [Todo] = []
    private let client: APIClient
    private let base = URL(string: "http://localhost:3001")!
    private var token: String = ""

    init(client: APIClient = LiveAPIClient()) {
        self.client = client
    }

    func connect(token: String) {
        self.token = token
        client.connect(token: token) { [weak self] updated in
            self?.todos = updated
        }
        // Eagerly fetch via REST so list populates even if WS is slow
        Task { await fetchREST() }
    }

    func disconnect() { client.disconnect() }

    var sorted: [Todo] { todos }

    func add(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        client.add(trimmed)
        // Fallback: if WS doesn't update within 1.5s, poll REST
        Task {
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            await fetchREST()
        }
    }

    func toggle(_ todo: Todo) {
        client.toggle(todo)
        Task {
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            await fetchREST()
        }
    }

    func delete(_ todo: Todo) {
        client.delete(todo)
        Task {
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            await fetchREST()
        }
    }

    @MainActor
    private func fetchREST() async {
        guard !token.isEmpty else { return }
        var req = URLRequest(url: base.appendingPathComponent("todos"))
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        guard let (data, _) = try? await URLSession.shared.data(for: req),
              let rows = try? JSONDecoder().decode([TodoResponse].self, from: data) else { return }
        todos = rows.map { $0.toTodo() }
    }
}
