import SwiftUI
import AuthenticationServices

private let apiBase = URL(string: "http://localhost:3001")!
private let accessTokenKey = "access_token"
private let refreshTokenKey = "refresh_token"

struct AuthUser {
    let id: String
    let email: String?
    let name: String?
}

@Observable
class AuthStore: NSObject {
    var user: AuthUser?
    var isLoading = false
    var error: String?

    var isSignedIn: Bool { user != nil }

    override init() {
        super.init()
        restoreSession()
    }

    // MARK: - Dev login (DEBUG only)

    #if DEBUG
    @MainActor
    func devLogin() async {
        isLoading = true
        error = nil
        defer { isLoading = false }
        var req = URLRequest(url: apiBase.appendingPathComponent("auth/dev-login"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONEncoder().encode([String: String]())
        guard let (data, _) = try? await URLSession.shared.data(for: req),
              let response = try? JSONDecoder().decode(AuthResponse.self, from: data) else {
            error = "Dev login failed — is the API running?"
            return
        }
        Keychain.save(response.accessToken, for: accessTokenKey)
        Keychain.save(response.refreshToken, for: refreshTokenKey)
        user = AuthUser(id: response.user.id, email: response.user.email, name: response.user.name)
    }
    #endif

    // MARK: - Apple Sign In

    func signInWithApple() {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }

    func signOut() {
        Keychain.delete(accessTokenKey)
        Keychain.delete(refreshTokenKey)
        user = nil
    }

    func accessToken() -> String? {
        Keychain.load(accessTokenKey)
    }

    // MARK: - Session restore

    private func restoreSession() {
        guard let refresh = Keychain.load(refreshTokenKey) else { return }
        Task {
            await refreshAccessToken(using: refresh)
        }
    }

    @MainActor
    private func refreshAccessToken(using refreshToken: String) async {
        var req = URLRequest(url: apiBase.appendingPathComponent("auth/refresh"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONEncoder().encode(["refreshToken": refreshToken])

        guard let (data, _) = try? await URLSession.shared.data(for: req),
              let json = try? JSONDecoder().decode(TokenResponse.self, from: data) else {
            signOut()
            return
        }
        Keychain.save(json.accessToken, for: accessTokenKey)
        Keychain.save(json.refreshToken, for: refreshTokenKey)
        await fetchCurrentUser(token: json.accessToken)
    }

    @MainActor
    private func fetchCurrentUser(token: String) async {
        // Decode user info from JWT payload (no extra round-trip needed)
        let parts = token.split(separator: ".")
        guard parts.count == 3,
              let payloadData = Data(base64Encoded: String(parts[1]).paddedBase64),
              let json = try? JSONDecoder().decode(JWTPayload.self, from: payloadData) else { return }
        user = AuthUser(id: json.sub, email: json.email, name: nil)
    }

    // MARK: - Backend exchange

    @MainActor
    func exchangeWithBackend(identityToken: String, fullName: PersonNameComponents?) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        var req = URLRequest(url: apiBase.appendingPathComponent("auth/apple"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = AppleAuthBody(
            identityToken: identityToken,
            fullName: fullName.map { FullName(givenName: $0.givenName, familyName: $0.familyName) }
        )
        req.httpBody = try? JSONEncoder().encode(body)

        guard let (data, _) = try? await URLSession.shared.data(for: req),
              let response = try? JSONDecoder().decode(AuthResponse.self, from: data) else {
            error = "Sign in failed. Please try again."
            return
        }

        Keychain.save(response.accessToken, for: accessTokenKey)
        Keychain.save(response.refreshToken, for: refreshTokenKey)
        user = AuthUser(id: response.user.id, email: response.user.email, name: response.user.name)
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension AuthStore: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let cred = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = cred.identityToken,
              let token = String(data: tokenData, encoding: .utf8) else { return }
        Task {
            await exchangeWithBackend(identityToken: token, fullName: cred.fullName)
        }
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        if (error as? ASAuthorizationError)?.code != .canceled {
            self.error = error.localizedDescription
        }
    }
}

extension AuthStore: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}

// MARK: - Codable helpers

private struct AppleAuthBody: Encodable {
    let identityToken: String
    let fullName: FullName?
}
private struct FullName: Encodable {
    let givenName: String?
    let familyName: String?
}
private struct AuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let user: UserInfo
}
private struct UserInfo: Decodable {
    let id: String
    let email: String?
    let name: String?
}
private struct TokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String
}
private struct JWTPayload: Decodable {
    let sub: String
    let email: String?
}

private extension String {
    var paddedBase64: String {
        let remainder = count % 4
        return remainder == 0 ? self : self + String(repeating: "=", count: 4 - remainder)
    }
}
