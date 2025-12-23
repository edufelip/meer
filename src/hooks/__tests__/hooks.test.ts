import { useLogin } from "../useLogin";
import { useSignup } from "../useSignup";
import { useLoginWithGoogle } from "../useLoginWithGoogle";
import { useLoginWithApple } from "../useLoginWithApple";
import { useForgotPassword } from "../useForgotPassword";
import { useValidateToken } from "../useValidateToken";
import { useLogout } from "../useLogout";
import { login, signup, loginWithGoogle, loginWithApple, validateToken } from "../../api/auth";
import { cacheProfile } from "../../storage/profileCache";
import { api, clearAuthSession } from "../../api/client";
import { navigationRef } from "../../app/navigation/navigationRef";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

jest.mock("react", () => ({
  useCallback: (fn: any) => fn
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options) => options),
  useQuery: jest.fn((options) => options),
  useQueryClient: jest.fn()
}));

jest.mock("../../api/auth", () => ({
  login: jest.fn(),
  signup: jest.fn(),
  validateToken: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithApple: jest.fn()
}));

jest.mock("../../api/client", () => ({
  clearAuthSession: jest.fn(),
  api: {
    post: jest.fn()
  }
}));

jest.mock("../../storage/profileCache", () => ({
  cacheProfile: jest.fn()
}));

jest.mock("../../app/navigation/navigationRef", () => ({
  navigationRef: {
    isReady: jest.fn(),
    reset: jest.fn()
  }
}));

const apiMock = {
  login: login as jest.Mock,
  signup: signup as jest.Mock,
  loginWithGoogle: loginWithGoogle as jest.Mock,
  loginWithApple: loginWithApple as jest.Mock,
  validateToken: validateToken as jest.Mock
};

const cacheProfileMock = cacheProfile as jest.Mock;
const clearAuthSessionMock = clearAuthSession as jest.Mock;
const apiClientMock = api as unknown as { post: jest.Mock };
const navMock = navigationRef as unknown as { isReady: jest.Mock; reset: jest.Mock };

const useMutationMock = useMutation as jest.Mock;
const useQueryMock = useQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;

describe("hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("useLogin delegates to login", async () => {
    const options = useLogin() as any;
    apiMock.login.mockResolvedValue({ token: "t" });

    await options.mutationFn({ email: "user@example.com", password: "pw" });

    expect(apiMock.login).toHaveBeenCalledWith({ email: "user@example.com", password: "pw" });
    expect(useMutationMock).toHaveBeenCalled();
  });

  it("useSignup delegates to signup", async () => {
    const options = useSignup() as any;
    apiMock.signup.mockResolvedValue({ token: "t" });

    await options.mutationFn({ name: "User", email: "user@example.com", password: "pw" });

    expect(apiMock.signup).toHaveBeenCalledWith({ name: "User", email: "user@example.com", password: "pw" });
  });

  it("useLoginWithGoogle delegates to loginWithGoogle", async () => {
    const options = useLoginWithGoogle() as any;
    apiMock.loginWithGoogle.mockResolvedValue({ token: "t" });

    await options.mutationFn({ provider: "google", client: "web", idToken: "id" });

    expect(apiMock.loginWithGoogle).toHaveBeenCalledWith({ provider: "google", client: "web", idToken: "id" });
  });

  it("useLoginWithApple delegates to loginWithApple", async () => {
    const options = useLoginWithApple() as any;
    apiMock.loginWithApple.mockResolvedValue({ token: "t" });

    await options.mutationFn({ provider: "apple", client: "ios", authorizationCode: "code" });

    expect(apiMock.loginWithApple).toHaveBeenCalledWith({ provider: "apple", client: "ios", authorizationCode: "code" });
  });

  it("useForgotPassword posts reset request", async () => {
    apiClientMock.post.mockResolvedValue({ data: { message: "ok" } });
    const options = useForgotPassword() as any;

    const result = await options.mutationFn({ email: "user@example.com" });

    expect(apiClientMock.post).toHaveBeenCalledWith("/auth/forgot-password", { email: "user@example.com" });
    expect(result).toEqual({ message: "ok" });
  });

  it("useValidateToken configures query and caches profile", async () => {
    const options = useValidateToken(true) as any;

    expect(useQueryMock).toHaveBeenCalled();
    expect(options.enabled).toBe(true);

    const profile = { id: "user-1" } as any;
    await options.onSuccess(profile);

    expect(cacheProfileMock).toHaveBeenCalledWith(profile);
  });

  it("useLogout clears session, query cache, and resets navigation", async () => {
    useQueryClientMock.mockReturnValue({ clear: jest.fn() });
    navMock.isReady.mockReturnValue(true);

    const logout = useLogout();
    await logout();

    expect(clearAuthSessionMock).toHaveBeenCalledTimes(1);
    expect(navMock.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "login" }] });
  });

  it("useLogout skips reset when navigation not ready", async () => {
    useQueryClientMock.mockReturnValue({ clear: jest.fn() });
    navMock.isReady.mockReturnValue(false);

    const logout = useLogout();
    await logout();

    expect(navMock.reset).not.toHaveBeenCalled();
  });
});
