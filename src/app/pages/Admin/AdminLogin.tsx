import { useState } from "react";
import { useNavigate } from "react-router";
import { LogIn } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { ThemeToggle } from "../../components/ThemeToggle";
import { setAdminToken } from "../../../utils/adminApi";
import { ADMIN_DASHBOARD_PATH } from "../../../utils/adminConfig";
import { apiJson } from "../../../utils/api";

export function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = await apiJson<{ token?: string; error?: string }>("/admin-api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });
      const token = body?.token;
      if (!token) throw new Error("No token returned from server");

      setAdminToken(token);
      navigate(ADMIN_DASHBOARD_PATH, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="bg-card rounded-2xl p-8 max-w-md w-full border border-border">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 600 }}>
            {t("admin.login")}
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block mb-2 text-sm">
              {t("admin.username")}
            </label>
            <input
              id="username"
              type="text"
              required
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm">
              {t("admin.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t("admin.signingIn") || "Signing in..." : t("admin.loginBtn")}
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {t("admin.loginHelp") || "Enter your admin credentials to continue."}
        </p>
      </div>
    </div>
  );
}
