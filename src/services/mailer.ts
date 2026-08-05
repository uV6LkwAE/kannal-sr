import nodemailer, { type SentMessageInfo, type Transporter } from "nodemailer"
import type { AppConfig } from "../config/env.js"
import type { ContactRequest } from "../contact/schema.js"
import type { ContactMailer } from "../contact/types.js"

const officeName = "横浜関内社労士オフィス"

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })

const display = (value?: string) => value || "（未入力）"

const wasAccepted = (info: SentMessageInfo) =>
  Array.isArray(info.accepted) && info.accepted.length > 0 &&
  Array.isArray(info.rejected) && info.rejected.length === 0

export class GmailContactMailer implements ContactMailer {
  private readonly transporter: Transporter

  constructor(private readonly config: AppConfig["mail"]) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.appPassword,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      logger: false,
      debug: false,
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    })
  }

  async send(data: ContactRequest): Promise<void> {
    const officeMessage = await this.transporter.sendMail({
      from: { name: officeName, address: this.config.user },
      to: this.config.officeAddress,
      replyTo: { name: data.name, address: data.email },
      subject: `【Web問い合わせ】${data.category}`,
      text: [
        "Webサイトから問い合わせがありました。",
        "",
        `会社名: ${display(data.company)}`,
        `お名前: ${data.name}`,
        `メールアドレス: ${data.email}`,
        `電話番号: ${display(data.phone)}`,
        `相談内容: ${data.category}`,
        "",
        "お問い合わせ内容:",
        data.message,
      ].join("\n"),
      html: `
        <p>Webサイトから問い合わせがありました。</p>
        <dl>
          <dt>会社名</dt><dd>${escapeHtml(display(data.company))}</dd>
          <dt>お名前</dt><dd>${escapeHtml(data.name)}</dd>
          <dt>メールアドレス</dt><dd>${escapeHtml(data.email)}</dd>
          <dt>電話番号</dt><dd>${escapeHtml(display(data.phone))}</dd>
          <dt>相談内容</dt><dd>${escapeHtml(data.category)}</dd>
        </dl>
        <p><strong>お問い合わせ内容</strong></p>
        <p>${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>
      `,
    })

    if (!wasAccepted(officeMessage)) throw new Error("Office mail was not accepted")

    const confirmationMessage = await this.transporter.sendMail({
      from: { name: officeName, address: this.config.user },
      to: data.email,
      replyTo: this.config.officeAddress,
      subject: `お問い合わせを受け付けました | ${officeName}`,
      text: [
        `${officeName}へお問い合わせいただき、ありがとうございます。`,
        "お問い合わせを受け付けました。内容を確認のうえ、担当者よりご連絡いたします。",
        "",
        "このメールにはお問い合わせ内容を記載していません。",
        "お心当たりがない場合は、このメールを破棄してください。",
      ].join("\n"),
      html: `
        <p>${officeName}へお問い合わせいただき、ありがとうございます。</p>
        <p>お問い合わせを受け付けました。内容を確認のうえ、担当者よりご連絡いたします。</p>
        <p>このメールにはお問い合わせ内容を記載していません。<br>
        お心当たりがない場合は、このメールを破棄してください。</p>
      `,
    })

    if (!wasAccepted(confirmationMessage)) throw new Error("Confirmation mail was not accepted")
  }
}
