import XCTest
@testable import TodoApp

final class MockAPIClient: APIClient {
    var added: [String] = []
    var toggled: [UUID] = []
    var deleted: [UUID] = []
    private var onUpdate: (([Todo]) -> Void)?

    func connect(token: String, onUpdate: @escaping ([Todo]) -> Void) { self.onUpdate = onUpdate }
    func disconnect() {}
    func add(_ text: String) {
        added.append(text)
        let todo = Todo(id: UUID(), text: text, completed: false, createdAt: Date())
        var current = onUpdate.map { _ in [Todo]() } ?? []
        current.append(todo)
        onUpdate?(current)
    }
    func toggle(_ todo: Todo) { toggled.append(todo.id) }
    func delete(_ todo: Todo) { deleted.append(todo.id) }

    func simulateUpdate(_ todos: [Todo]) { onUpdate?(todos) }
}

final class TodoStoreTests: XCTestCase {
    func testStartsEmpty() {
        let mock = MockAPIClient()
        let store = TodoStore(client: mock)
        XCTAssertTrue(store.todos.isEmpty)
    }

    func testAddCallsClient() {
        let mock = MockAPIClient()
        let store = TodoStore(client: mock)
        store.add("Buy milk")
        XCTAssertEqual(mock.added, ["Buy milk"])
    }

    func testIgnoresBlankText() {
        let mock = MockAPIClient()
        let store = TodoStore(client: mock)
        store.add("   ")
        XCTAssertTrue(mock.added.isEmpty)
    }

    func testToggleCallsClient() {
        let mock = MockAPIClient()
        let store = TodoStore(client: mock)
        let todo = Todo(text: "Walk dog")
        store.toggle(todo)
        XCTAssertEqual(mock.toggled, [todo.id])
    }

    func testDeleteCallsClient() {
        let mock = MockAPIClient()
        let store = TodoStore(client: mock)
        let todo = Todo(text: "Read book")
        store.delete(todo)
        XCTAssertEqual(mock.deleted, [todo.id])
    }

    func testUpdatesFromWebSocket() {
        let mock = MockAPIClient()
        let store = TodoStore(client: mock)
        store.connect(token: "fake-token")
        let todos = [Todo(text: "From server")]
        mock.simulateUpdate(todos)
        XCTAssertEqual(store.todos.count, 1)
        XCTAssertEqual(store.todos.first?.text, "From server")
    }
}
