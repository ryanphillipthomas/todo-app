import Foundation

protocol APIClient {
    func add(_ text: String)
    func toggle(_ todo: Todo)
    func delete(_ todo: Todo)
    func connect(token: String, onUpdate: @escaping ([Todo]) -> Void)
    func updateToken(_ token: String)
    func disconnect()
}

final class LiveAPIClient: APIClient {
    private let base = URL(string: "http://localhost:3001")!
    private var wsTask: URLSessionWebSocketTask?
    private var token: String = ""
    private var onUpdate: (([Todo]) -> Void)?
    private var reconnectTask: Task<Void, Never>?
    private var active = false

    func connect(token: String, onUpdate: @escaping ([Todo]) -> Void) {
        self.token = token
        self.onUpdate = onUpdate
        active = true
        openWebSocket()
    }

    func updateToken(_ token: String) {
        self.token = token
        wsTask?.cancel(with: .goingAway, reason: nil)
        openWebSocket()
    }

    func disconnect() {
        active = false
        reconnectTask?.cancel()
        wsTask?.cancel(with: .goingAway, reason: nil)
        wsTask = nil
    }

    private func openWebSocket() {
        var components = URLComponents(string: "ws://localhost:3001")!
        components.queryItems = [URLQueryItem(name: "token", value: token)]
        let ws = URLSession.shared.webSocketTask(with: components.url!)
        wsTask = ws
        ws.resume()
        receive(ws: ws)
    }

    private func receive(ws: URLSessionWebSocketTask) {
        ws.receive { [weak self] result in
            guard let self, active else { return }
            switch result {
            case .success(.string(let text)):
                if let data = text.data(using: .utf8),
                   let rows = try? JSONDecoder().decode([TodoResponse].self, from: data) {
                    DispatchQueue.main.async { self.onUpdate?(rows.map { $0.toTodo() }) }
                }
                receive(ws: ws)
            case .failure(let err):
                let nsErr = err as NSError
                // 1008 = policy violation (unauthorized) — need token refresh, not just reconnect
                let closeCode = nsErr.userInfo["NSURLErrorFailingURLErrorKey"] as? Int ?? 0
                let isUnauthorized = nsErr.code == 57 || closeCode == 1008
                scheduleReconnect(refreshFirst: isUnauthorized)
            default:
                receive(ws: ws)
            }
        }
    }

    private func scheduleReconnect(refreshFirst: Bool = false) {
        guard active else { return }
        reconnectTask?.cancel()
        reconnectTask = Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            guard !Task.isCancelled, active else { return }
            openWebSocket()
        }
    }

    func add(_ text: String) {
        var req = authorized(url: base.appendingPathComponent("todos"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONEncoder().encode(["text": text])
        URLSession.shared.dataTask(with: req).resume()
    }

    func toggle(_ todo: Todo) {
        var req = authorized(url: base.appendingPathComponent("todos/\(todo.id.uuidString.lowercased())"))
        req.httpMethod = "PATCH"
        URLSession.shared.dataTask(with: req).resume()
    }

    func delete(_ todo: Todo) {
        var req = authorized(url: base.appendingPathComponent("todos/\(todo.id.uuidString.lowercased())"))
        req.httpMethod = "DELETE"
        URLSession.shared.dataTask(with: req).resume()
    }

    private func authorized(url: URL) -> URLRequest {
        var req = URLRequest(url: url)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        return req
    }
}

struct TodoResponse: Decodable {
    let id: String
    let text: String
    let completed: Int
    let createdAt: Double

    func toTodo() -> Todo {
        Todo(id: UUID(uuidString: id) ?? UUID(), text: text, completed: completed != 0, createdAt: Date(timeIntervalSince1970: createdAt / 1000))
    }
}
