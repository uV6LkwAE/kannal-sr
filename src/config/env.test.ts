// テストケースのときに使う
import { describe, expect, it } from "vitest"
import { InvalidEnvironmentError, loadAppConfig } from "./env.js"

const validEnvironment = {
  HOST: "0.0.0.0",
  PORT: "3000",
  STATIC_ROOT: "public",
  TURNSTILE_SITE_KEY: "site-key",
  TURNSTILE_SECRET_KEY: "secret-key",
  TURNSTILE_EXPECTED_HOSTNAME: "yokohama-kannai-sr.com",
  SMTP_USER: "sender@example.com",
  SMTP_APP_PASSWORD: "app-password",
  CONTACT_TO_EMAIL: "office@example.com",
}

// まとめ見出し
describe("loadAppConfig", () => {
  // itはこうあるべき
  // 一つのテストケースを定義
  it("maps validated environment values to application configuration", () => {
    const config = loadAppConfig(validEnvironment)
    expect(config.server.host).toBe("0.0.0.0")
    expect(config.server.port).toBe(3000)
    expect(config.server.staticRoot).toBe("public")
    expect(config.turnstile.expectedAction).toBe("contact")
    expect(config.mail.host).toBe("smtp.gmail.com")
    expect(config.mail.officeAddress).toBe("office@example.com")
  })

  it("reports invalid key names without including secret values", () => {
    const invalidSecret = "do-not-leak-this-value"
    expect(() => loadAppConfig({
      ...validEnvironment,
      TURNSTILE_SECRET_KEY: "",
      SMTP_USER: invalidSecret,
    })).toThrow(InvalidEnvironmentError)

    try {
      loadAppConfig({ ...validEnvironment, SMTP_USER: invalidSecret })
    } catch (error) {
      expect(String(error)).toContain("SMTP_USER")
      expect(String(error)).not.toContain(invalidSecret)
    }
  })

  it("fails when server settings are missing", () => {
    expect(() => loadAppConfig({
      ...validEnvironment,
      HOST: "",
    })).toThrow(InvalidEnvironmentError)
  })
})
