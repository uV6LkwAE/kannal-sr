type HomePageProps = {
  turnstileSiteKey: string
}

export function HomePage({ turnstileSiteKey }: HomePageProps) {
  return (
    <main id="main">
          <section class="hero" id="top">
            <div class="hero-grid">
              <div class="hero-copy">
                <div class="header-facts" aria-label="当事務所の特徴">
                  <p><strong><small>SINCE</small>1999</strong><span>開業からの実績</span></p>
                  <p><strong>桜木町駅 1分</strong><span>クロスゲート7階</span></p>
                  <p><strong>幅広い業種</strong><span>神奈川県内を中心に対応</span></p>
                </div>
    
                <p class="eyebrow">YOKOHAMA / SAKURAGICHO</p>
                <h1>企業の人と労務に、<br /><span>確かな伴走を。</span></h1>
                <p class="hero-lead">
                  労働社会保険の手続きから労務相談、行政調査対応まで。<br />
                  横浜・関内の企業労務を、正確に、すばやく、親身に支えます。
                </p>
                <div class="hero-actions">
                  <a class="button button-primary" href="#contact">相談・お問い合わせ</a>
                  <a class="text-link" href="tel:09032323649">
                    <span>お電話でのご相談</span>
                    <span class="phone-number">
                      <svg
                        class="phone-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <strong>090-3232-3649</strong>
                    </span>
                  </a>
                </div>
              </div>
    
              <div class="hero-visual" aria-label="横浜・桜木町を拠点に企業労務を支援"></div>
    
              <div class="hero-facts" aria-label="当事務所の特徴">
                <div class="hero-facts-inner">
                  <p><strong><small>SINCE</small>1999</strong><span>開業から積み重ねた実績</span></p>
                  <p><strong>桜木町駅 1分</strong><span>クロスゲート7階</span></p>
                  <p><strong>幅広い業種</strong><span>神奈川県内を中心に対応</span></p>
                </div>
              </div>
            </div>
          </section>
    
          <section class="intro section">
            <div class="section-inner intro-grid reveal">
              <div>
                <p class="section-number">01 / ABOUT</p>
                <h2>身近な相談相手として、<br />経営と働く人を支えます。</h2>
              </div>
              <div class="intro-copy">
                <p>
                  手続きの正確さはもちろん、相談しやすさと対応の早さを大切にしています。
                  日々の小さな疑問から、就業規則の整備、行政機関による調査への対応まで、
                  企業ごとの状況を丁寧にうかがい、実務に即した支援を行います。
                </p>
                <a class="arrow-link" href="#strengths">当事務所について詳しく見る <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </section>
    
          <section class="services section" id="services">
            <div class="section-inner">
              <div class="section-heading reveal">
                <div>
                  <p class="section-number">02 / SERVICES</p>
                  <h2>相談できること</h2>
                </div>
                <p>
                  企業の成長段階や課題に合わせ、必要な手続きと労務管理を一貫して支援します。
                </p>
              </div>
    
              <div class="service-list">
                <article class="service-item reveal">
                  <p class="service-index">01</p>
                  <div class="service-body">
                    <p class="service-label">PROCEDURES</p>
                    <h3>労働社会保険の<br />手続き代行</h3>
                  </div>
                  <ul>
                    <li>社会保険・労働保険の新規適用</li>
                    <li>入退社に伴う資格取得・喪失手続き</li>
                    <li>算定基礎届・月額変更届・年度更新</li>
                    <li>労災保険・雇用保険の各種給付</li>
                  </ul>
                </article>
    
                <article class="service-item reveal">
                  <p class="service-index">02</p>
                  <div class="service-body">
                    <p class="service-label">CONSULTING</p>
                    <h3>労務管理の<br />相談・指導</h3>
                  </div>
                  <ul>
                    <li>就業規則・各種社内規程の作成、見直し</li>
                    <li>採用・労働契約・退職に関する相談</li>
                    <li>労働時間・賃金・福利厚生の整備</li>
                    <li>36協定・変形労働時間制の届出</li>
                  </ul>
                </article>
    
                <article class="service-item reveal">
                  <p class="service-index">03</p>
                  <div class="service-body">
                    <p class="service-label">INSPECTION SUPPORT</p>
                    <h3>行政機関による<br />調査立会い</h3>
                  </div>
                  <ul>
                    <li>労働基準監督署による調査への対応</li>
                    <li>日本年金機構による調査への対応</li>
                    <li>事前確認・必要書類の準備</li>
                    <li>是正報告書等の作成支援</li>
                  </ul>
                </article>
              </div>
            </div>
          </section>
    
          <section class="strengths section" id="strengths">
            <div class="section-inner strengths-grid">
              <div class="strengths-heading reveal">
                <p class="section-number light">03 / OUR APPROACH</p>
                <h2>積み重ねた経験を、<br />一社一社の安心へ。</h2>
                <p>
                  1999年の開業以来、神奈川県内を中心にさまざまな企業の労務を支援してきました。
                </p>
              </div>
    
              <ol class="strength-list">
                <li class="reveal">
                  <span>01</span>
                  <div>
                    <h3>正確で、すばやい対応</h3>
                    <p>期限と制度要件を押さえ、実務が滞らないよう迅速に進めます。</p>
                  </div>
                </li>
                <li class="reveal">
                  <span>02</span>
                  <div>
                    <h3>幅広い業種への支援経験</h3>
                    <p>医療、教育、介護、運輸、建設、ITなど、多様な現場への理解があります。</p>
                  </div>
                </li>
                <li class="reveal">
                  <span>03</span>
                  <div>
                    <h3>情報管理と守秘義務の徹底</h3>
                    <p>法令と守秘義務を遵守し、大切な個人情報を適切に取り扱います。</p>
                  </div>
                </li>
              </ol>
            </div>
          </section>
    
          <section class="representative section" id="representative">
            <div class="section-inner representative-grid reveal">
              <figure class="portrait">
                <div class="portrait-frame">
                  <img
                    src="./assets/profile.jpg"
                    alt="代表 社会保険労務士 山崎敏之"
                    width="933"
                    height="1400"
                   />
                </div>
              </figure>
              <div class="representative-copy">
                <p class="section-number">04 / MESSAGE</p>
                <h2>親しみやすく、<br />質の高いサービスを。</h2>
                <p>
                  1999年7月の開業以来、神奈川県内を中心に、さまざまな業種・業態の事業者様を
                  支援してまいりました。制度や手続きの説明をわかりやすくお伝えし、
                  気軽に相談できる社労士でありたいと考えています。
                </p>
                <p>
                  人事・労務に関するお困りごとは、どのようなことでもまずはお聞かせください。
                  企業の状況に合わせて、誠実に対応いたします。
                </p>
                <div class="representative-name">
                  <span>代表・社会保険労務士</span>
                  <strong>山崎 敏之</strong>
                </div>
              </div>
            </div>
          </section>
    
          <section class="industries section" id="industries">
            <div class="section-inner reveal">
              <div class="section-heading compact">
                <div>
                  <p class="section-number">05 / EXPERIENCE</p>
                  <h2>対応実績のある業種</h2>
                </div>
                <p>法人・個人事業を問わず、幅広い事業者様を支援しています。</p>
              </div>
              <ul class="industry-list" aria-label="対応実績業種">
                <li>医療法人</li>
                <li>学校法人・幼稚園</li>
                <li>介護</li>
                <li>運輸</li>
                <li>建設・建機リース</li>
                <li>製造</li>
                <li>飲食・小売</li>
                <li>不動産</li>
                <li>士業</li>
                <li>ソフトウェア開発</li>
                <li>設計</li>
                <li>各種サービス業</li>
              </ul>
            </div>
          </section>
    
          <section class="office section" id="office">
            <div class="section-inner">
              <div class="section-heading reveal">
                <div>
                  <p class="section-number">06 / OFFICE</p>
                  <h2>事務所概要</h2>
                </div>
              </div>
    
              <div class="office-grid reveal">
                <dl class="office-details">
                  <div><dt>事務所名</dt><dd>横浜関内社労士オフィス</dd></div>
                  <div><dt>代表</dt><dd>山崎 敏之</dd></div>
                  <div><dt>開業</dt><dd>1999年7月</dd></div>
                  <div>
                    <dt>登録</dt>
                    <dd>全国社会保険労務士会連合会 登録<br />神奈川県社会保険労務士会 会員</dd>
                  </div>
                  <div>
                    <dt>所在地</dt>
                    <dd>〒231-0062<br />神奈川県横浜市中区桜木町1丁目101番地1<br />クロスゲート7階</dd>
                  </div>
                  <div><dt>電話</dt><dd><a href="tel:09032323649">090-3232-3649</a></dd></div>
                </dl>
    
                <aside class="office-policy">
                  <p class="service-label">CONFIDENTIALITY</p>
                  <h3>守秘義務を遵守し、<br />情報を適切に管理します。</h3>
                  <p>
                    ご相談内容やお預かりした個人情報は、法令および社会保険労務士の
                    守秘義務に基づいて取り扱います。
                  </p>
                  <a class="arrow-link" href="/privacy">個人情報保護方針 <span aria-hidden="true">→</span></a>
                </aside>
              </div>
            </div>
          </section>
    
          <section class="access section" id="access">
            <iframe
              class="access-map"
              title="横浜関内社労士オフィス周辺のGoogle Map"
              src="https://www.google.com/maps?q=%E7%A5%9E%E5%A5%88%E5%B7%9D%E7%9C%8C%E6%A8%AA%E6%B5%9C%E5%B8%82%E4%B8%AD%E5%8C%BA%E6%A1%9C%E6%9C%A8%E7%94%BA1%E4%B8%81%E7%9B%AE101%E7%95%AA%E5%9C%B01%20%E3%82%AF%E3%83%AD%E3%82%B9%E3%82%B2%E3%83%BC%E3%83%887%E9%9A%8E&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            ></iframe>
            <div class="section-inner access-content reveal">
              <p class="section-number">07 / ACCESS</p>
              <h2>桜木町駅から<br />徒歩1分。</h2>
              <p class="access-address">
                〒231-0062<br />
                神奈川県横浜市中区桜木町1丁目101番地1<br />
                クロスゲート7階
              </p>
              <ul class="access-routes">
                <li><strong>JR</strong><span>桜木町駅 南改札・東口から徒歩1分</span></li>
                <li><strong>地下鉄</strong><span>桜木町駅 北1出口から徒歩1分</span></li>
                <li><strong>みなとみらい線</strong><span>馬車道駅 1b出口から徒歩3分</span></li>
              </ul>
            </div>
          </section>
    
          <section class="contact section" id="contact">
            <div class="section-inner">
              <div class="contact-heading reveal">
                <p class="section-number light">08 / CONTACT</p>
                <h2>まずは、お困りごとを<br />お聞かせください。</h2>
                <p>
                  ご相談内容を確認後、通常2営業日以内を目安にご連絡します。
                  お急ぎの場合はお電話をご利用ください。
                </p>
                <a href="tel:09032323649" class="contact-phone">
                  <span>お電話でのお問い合わせ</span>
                  <strong>090-3232-3649</strong>
                </a>
                <button
                  class="contact-form-toggle"
                  type="button"
                  aria-expanded="false"
                  aria-controls="contact-panel"
                  data-contact-toggle
                >
                  <span>フォームで問い合わせる</span>
                  <span class="contact-toggle-mark" aria-hidden="true"></span>
                </button>
              </div>
    
              <div class="contact-panel reveal" id="contact-panel" data-contact-panel>
                <form id="contact-form" action="/api/contact" method="post" noValidate>
                  <div class="form-grid">
                    <label>
                      <span>会社名 <small>任意</small></span>
                      <input type="text" name="company" autoComplete="organization" maxLength="100" />
                    </label>
                    <label>
                      <span>お名前 <em>必須</em></span>
                      <input type="text" name="name" autoComplete="name" maxLength="100" required />
                    </label>
                    <label>
                      <span>メールアドレス <em>必須</em></span>
                      <input type="email" name="email" autoComplete="email" maxLength="254" required />
                    </label>
                    <label>
                      <span>電話番号 <small>任意</small></span>
                      <input
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        minLength={7}
                        maxLength={30}
                        pattern="[0-9０-９+＋()（）\-ー―−\s]+"
                      />
                    </label>
                  </div>
    
                  <label>
                    <span>ご相談内容 <em>必須</em></span>
                    <select name="category" required>
                      <option value="">選択してください</option>
                      <option>労働社会保険手続き</option>
                      <option>労務管理相談</option>
                      <option>就業規則</option>
                      <option>行政調査対応</option>
                      <option>助成金</option>
                      <option>その他</option>
                    </select>
                  </label>
    
                  <label>
                    <span>お問い合わせ内容 <em>必須</em></span>
                    <textarea
                      name="message"
                      rows={7}
                      minLength={10}
                      maxLength={2000}
                      placeholder="現在の状況やお困りのことをご記入ください"
                      required
                    ></textarea>
                  </label>
    
                  <div
                    class="cf-turnstile turnstile-widget"
                    data-sitekey={turnstileSiteKey}
                    data-action="contact"
                    data-response-field-name="turnstileToken"
                    data-error-callback="onTurnstileError"
                    data-expired-callback="onTurnstileExpired"
                    data-size="flexible"
                    data-theme="light"
                  ></div>
    
                  <label class="agreement">
                    <input type="checkbox" name="privacy" required />
                    <span>
                      <a href="/privacy" target="_blank">個人情報保護方針</a>に同意する
                      <em>必須</em>
                    </span>
                  </label>
    
                  <p class="form-error" role="alert" hidden data-form-error></p>
                  <button class="button submit-button" type="submit" disabled data-submit>
                    <span>入力内容を送信する</span>
                  </button>
                </form>
    
                <div class="form-success" role="status" tabIndex={-1} hidden data-success>
                  <span class="success-mark" aria-hidden="true">✓</span>
                  <h3>お問い合わせを受け付けました</h3>
                  <p>内容を確認のうえ、担当者よりご連絡いたします。</p>
                  <button class="text-button" type="button" data-reset>フォームに戻る</button>
                </div>
              </div>
            </div>
          </section>
        </main>
  )
}
