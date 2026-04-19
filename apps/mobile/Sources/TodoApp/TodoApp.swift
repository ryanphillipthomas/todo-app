import SwiftUI

@main
struct TodoApp: App {
    @State private var auth = AuthStore()

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.isSignedIn {
                    ContentView()
                } else {
                    SignInView()
                }
            }
            .environment(auth)
        }
    }
}
