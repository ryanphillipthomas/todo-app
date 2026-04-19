import Foundation

struct Todo: Identifiable {
    let id: UUID
    var text: String
    var completed: Bool
    let createdAt: Date

    init(text: String) {
        self.id = UUID()
        self.text = text
        self.completed = false
        self.createdAt = Date()
    }

    init(id: UUID, text: String, completed: Bool, createdAt: Date) {
        self.id = id
        self.text = text
        self.completed = completed
        self.createdAt = createdAt
    }
}
