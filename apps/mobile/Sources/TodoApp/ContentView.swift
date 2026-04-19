import SwiftUI

private let seenVersionKey = "whats_new_seen_version"

struct ContentView: View {
    @Environment(AuthStore.self) var auth
    @State private var store = TodoStore()
    @State private var newText = ""
    @State private var showWhatsNew = false
    @State private var showSettings = false
    @FocusState private var fieldFocused: Bool

    var body: some View {
        ZStack(alignment: .bottom) {
            Color(.systemGroupedBackground).ignoresSafeArea()

            VStack(spacing: 0) {
                header
                todoList
            }

            addBar
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
        }
        .sheet(isPresented: $showWhatsNew) {
            WhatsNewView(isPresented: $showWhatsNew)
        }
        .sheet(isPresented: $showSettings) {
            SettingsView().environment(auth)
        }
        .onAppear {
            if let token = auth.accessToken() { store.connect(token: token) }
            if UserDefaults.standard.string(forKey: seenVersionKey) != currentAppVersion {
                showWhatsNew = true
                UserDefaults.standard.set(currentAppVersion, forKey: seenVersionKey)
            }
        }
    }

    // MARK: Header

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Todos")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                if let name = auth.user?.name ?? auth.user?.email {
                    Text(name)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            Menu {
                Button("Settings") { showSettings = true }
                Button("What's New") { showWhatsNew = true }
                Divider()
                Button("Sign Out", role: .destructive) {
                    store.disconnect()
                    auth.signOut()
                }
            } label: {
                Image(systemName: "ellipsis.circle.fill")
                    .font(.title2)
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(.primary)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    // MARK: List

    private var todoList: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                if store.sorted.isEmpty {
                    emptyState
                } else {
                    ForEach(store.sorted) { todo in
                        TodoCard(todo: todo,
                                 onToggle: { store.toggle(todo) },
                                 onDelete: { store.delete(todo) })
                        .transition(.asymmetric(
                            insertion: .move(edge: .top).combined(with: .opacity),
                            removal: .move(edge: .trailing).combined(with: .opacity)
                        ))
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 100)
            .animation(.spring(response: 0.35, dampingFraction: 0.8), value: store.sorted.map(\.id))
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 48))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(.tertiary)
            Text("All clear")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("Add your first todo below")
                .font(.subheadline)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 80)
    }

    // MARK: Add bar

    private var addBar: some View {
        HStack(spacing: 10) {
            HStack {
                Image(systemName: "plus.circle.fill")
                    .foregroundStyle(newText.isEmpty ? Color(.tertiaryLabel) : Color.blue)
                    .font(.title3)
                    .animation(.easeInOut(duration: 0.15), value: newText.isEmpty)

                TextField("New todo…", text: $newText)
                    .focused($fieldFocused)
                    .onSubmit(addTodo)
                    .submitLabel(.done)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))

            if !newText.isEmpty {
                Button(action: addTodo) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 38))
                        .foregroundStyle(.blue)
                }
                .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.75), value: newText.isEmpty)
        .shadow(color: .black.opacity(0.08), radius: 12, y: 4)
    }

    private func addTodo() {
        guard !newText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        store.add(newText)
        newText = ""
        fieldFocused = false
    }
}
