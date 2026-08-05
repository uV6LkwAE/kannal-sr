import { describe, expect, it } from "vitest"
import { InvalidEnvironmentError, loadAppConfig } from "./env.js"

const validEnvironment = {
  TURNSTILE_SITE_KEY: "site-key",
  TURNSTILE_SECRET_KEY: "secret-key",
  TURNSTILE_EXPECTED_HOSTNAME: "yokohama-kannai-sr.com",
  SMTP_USER: "sender@example.com",
  SMTP_APP_PASSWORD: "app-password",
  CONTACT_TO_EMAIL: "office@example.com",
}

describe("loadAppConfig", () => {
  it("maps validated environment values to application configuration", () => {
    const config = loadAppConfig(validEnvironment)
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
    })).toThrowError(InvalidEnvironmentError)

    try {
      loadAppConfig({ ...validEnvironment, SMTP_USER: invalidSecret })
    } catch (error) {
      expect(String(error)).toContain("SMTP_USER")
      expect(String(error)).not.toContain(invalidSecret)
    }
  })
})
