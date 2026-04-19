import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @Environment(AuthStore.self) var auth

    var body: some View {
        ZStack {
            Color(.systemGroupedBackground).ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 56))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(.blue)
                        .padding(.bottom, 8)

                    Text("Todos")
                        .font(.system(size: 36, weight: .bold, design: .rounded))

                    Text("Sync across all your devices.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.bottom, 48)

                VStack(spacing: 12) {
                    if auth.isLoading {
                        ProgressView()
                            .frame(height: 50)
                    } else {
                        SignInWithAppleButton(.signIn) { request in
                            request.requestedScopes = [.fullName, .email]
                        } onCompletion: { result in
                            if case .success(let authorization) = result,
                               let cred = authorization.credential as? ASAuthorizationAppleIDCredential,
                               let tokenData = cred.identityToken,
                               let token = String(data: tokenData, encoding: .utf8) {
                                Task { await auth.exchangeWithBackend(identityToken: token, fullName: cred.fullName) }
                            }
                        }
                        .signInWithAppleButtonStyle(.black)
                        .frame(height: 52)
                        .clipShape(RoundedRectangle(cornerRadius: 14))

                        #if DEBUG
                        Button {
                            Task { await auth.devLogin() }
                        } label: {
                            Text("Continue as Test User")
                                .font(.subheadline.weight(.medium))
                                .frame(maxWidth: .infinity)
                                .frame(height: 52)
                                .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14))
                        }
                        .foregroundStyle(.secondary)
                        #endif
                    }

                    if let error = auth.error {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 32)

                Spacer()
                Spacer()
            }
        }
    }
}
