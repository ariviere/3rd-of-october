#!/usr/bin/env python3
"""Generate the FR / EN / JP invite emails. Run from anywhere."""

from pathlib import Path

OUT = Path(__file__).resolve().parent
SITE = "https://wedding.riviere.tf"
PASSWORD = "mochacoco"
PHOTO = f"{SITE}/images/japan.jpeg"
LEAF_LEFT = f"{SITE}/images/gold-leaf-left.png?v=4"
LEAF_RIGHT = f"{SITE}/images/gold-leaf-right.png?v=5"

TEMPLATE = r"""<!DOCTYPE html>
<html lang="@@LANG@@">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<meta name="format-detection" content="telephone=no,date=no,address=no">
<meta name="robots" content="noindex">
<title>@@SUBJECT@@</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="@@FONT_HREF@@" rel="stylesheet">
<!-- Subject: @@SUBJECT@@ -->
<style>
  :root { color-scheme: light only; supported-color-schemes: light; }
  body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  body { margin: 0; padding: 0; background: #E7F1F6; }
  table { border-collapse: collapse; }
  img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  a { text-decoration: none; }
  @media screen and (max-width: 640px) {
    .container { width: 100% !important; }
    .leaf { display: none !important; width: 0 !important; max-width: 0 !important; max-height: 0 !important; overflow: hidden !important; font-size: 0 !important; line-height: 0 !important; }
    .card { padding: 40px 22px 44px !important; }
    .title { font-size: 36px !important; }
    .invite { font-size: 18px !important; }
  }
</style>
</head>
<body bgcolor="#E7F1F6" style="margin:0;padding:0;background:#E7F1F6;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#E7F1F6;opacity:0;">
@@PREHEADER@@ &#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#E7F1F6" style="background:#E7F1F6;border-collapse:collapse;">
  <tr>
    <td align="center" style="padding:28px 12px 36px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
      <table role="presentation" class="container" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#C6A45C" style="width:100%;max-width:600px;background:#C6A45C;border-collapse:collapse;">
        <tr>
          <td bgcolor="#C6A45C" style="background:#C6A45C;padding:1px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F8F4EC" style="background:#F8F4EC;border-collapse:collapse;">
              <tr>
                <td class="leaf" valign="middle" width="88" bgcolor="#F8F4EC" style="width:88px;background:#F8F4EC;vertical-align:middle;">
                  <table role="presentation" width="88" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr>
                      <td width="16" style="width:16px;font-size:0;line-height:0;">&nbsp;</td>
                      <td width="58" valign="middle" style="width:58px;vertical-align:middle;">
                        <img src="@@LEAF_LEFT@@" width="58" height="535" alt="" style="display:block;width:58px;height:auto;border:0;">
                      </td>
                      <td width="14" style="width:14px;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
                <td class="card" align="center" bgcolor="#F8F4EC" style="background:#F8F4EC;padding:52px 4px 48px;text-align:center;">
                  <p style="margin:0;font-family:@@BODY@@;font-size:12px;line-height:1.4;letter-spacing:@@KICKER_LS@@;text-transform:uppercase;color:#8A6828;">@@KICKER@@</p>
                  <p style="margin:6px 0 0;font-family:@@BODY@@;font-size:12px;line-height:1.4;letter-spacing:@@KICKER_LS@@;text-transform:uppercase;color:#8A6828;">@@LEAD@@</p>
                  <p class="title" style="margin:8px 0 0;font-family:@@DISPLAY@@;font-size:44px;line-height:1.1;font-weight:300;letter-spacing:0.04em;color:#2F6E8A;">Norika &amp; Antoine</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#C6A45C" style="background:#C6A45C;border-collapse:collapse;margin-top:28px;">
                    <tr>
                      <td bgcolor="#C6A45C" style="background:#C6A45C;padding:5px;line-height:0;font-size:0;">
                        <img src="@@PHOTO@@" width="220" height="293" alt="@@ALT@@" style="display:block;width:220px;max-width:100%;height:auto;border:0;">
                      </td>
                    </tr>
                  </table>
                  <p style="margin:28px 0 0;font-family:@@BODY@@;font-size:15px;line-height:1.5;font-weight:300;letter-spacing:@@DATE_LS@@;color:#8A6828;">@@HERO_DATE@@</p>
                  <p style="margin:14px 0 0;font-family:@@DISPLAY@@;font-size:20px;line-height:1.4;font-weight:300;color:#2F6E8A;">@@VENUE@@</p>
                  <p style="margin:4px 0 0;font-family:@@BODY@@;font-size:15px;line-height:1.5;font-weight:300;color:#5C6872;">@@PLACE@@</p>
                  <p class="invite" style="margin:22px auto 0;max-width:400px;font-family:@@DISPLAY@@;font-size:20px;line-height:1.5;font-weight:300;color:#24303A;">@@INVITE@@</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin-top:28px;">
                    <tr>
                      <td width="56" height="1" bgcolor="#C6A45C" style="background:#C6A45C;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                  <p style="margin:22px 0 6px;font-family:@@BODY@@;font-size:11px;line-height:1.4;letter-spacing:@@KICKER_LS@@;text-transform:uppercase;color:#8A6828;">@@PASSWORD_LABEL@@</p>
                  <p style="margin:0 0 22px;font-family:@@DISPLAY@@;font-size:22px;line-height:1.2;font-weight:300;letter-spacing:1px;color:#2F6E8A;">@@PASSWORD@@</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;">
                    <tr>
                      <td align="center" bgcolor="#F8F4EC" style="background:#F8F4EC;border:1px solid #2F6E8A;border-radius:24px;">
                        <a href="@@URL@@" style="display:inline-block;padding:14px 36px;font-family:@@BODY@@;font-size:13px;line-height:1;letter-spacing:2px;text-transform:uppercase;color:#2F6E8A;text-decoration:none;">RSVP</a>
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="leaf" valign="middle" width="88" bgcolor="#F8F4EC" style="width:88px;background:#F8F4EC;vertical-align:middle;">
                  <table role="presentation" width="88" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr>
                      <td width="14" style="width:14px;font-size:0;line-height:0;">&nbsp;</td>
                      <td width="58" valign="middle" style="width:58px;vertical-align:middle;">
                        <img src="@@LEAF_RIGHT@@" width="58" height="489" alt="" style="display:block;width:58px;height:auto;border:0;">
                      </td>
                      <td width="16" style="width:16px;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>
"""

TEXT = """@@KICKER@@
@@LEAD@@
Norika & Antoine

@@HERO_DATE@@
@@VENUE@@
@@PLACE@@

@@INVITE_TEXT@@

@@PASSWORD_LABEL@@: @@PASSWORD@@

RSVP: @@URL@@
"""

COPY = {
    "en": {
        "subject": "Norika & Antoine — August 14th, 2027",
        "preheader": "You're invited to the wedding of Norika & Antoine, at the Château de la Poterie.",
        "kicker": "You're invited",
        "lead": "to the wedding of",
        "hero_date": "Saturday, August 14th, 2027",
        "venue": "Château de la Poterie",
        "place": "La Chapelle-sur-Erdre, France",
        "invite": "We'd love to have you with us.<br>Let us know if you can make it.",
        "alt": "Norika and Antoine",
        "password_label": "Password",
    },
    "fr": {
        "subject": "Norika & Antoine — 14 août 2027",
        "preheader": "Vous êtes invités au mariage de Norika & Antoine, au Château de la Poterie.",
        "kicker": "Vous êtes invités",
        "lead": "au mariage de",
        "hero_date": "Samedi 14&nbsp;août 2027",
        "venue": "Château de la Poterie",
        "place": "La Chapelle-sur-Erdre, France",
        "invite": "Nous serions heureux<br>de vous avoir avec nous&nbsp;!<br>Dites-nous si vous pourrez être là.",
        "alt": "Norika et Antoine",
        "password_label": "Mot de passe",
    },
    "ja": {
        "subject": "Norika & Antoine — 2027年8月14日",
        "preheader": "Norika と Antoine の結婚式へのご招待です。Château de la Poterie。",
        "kicker": "ご招待",
        "lead": "フランスでの結婚式",
        "hero_date": "2027年8月14日（土）",
        "venue": "Château de la Poterie",
        "place": "La Chapelle-sur-Erdre, France",
        "invite": "ご一緒いただけたら、うれしいです。<br>出欠をお知らせください。",
        "alt": "NorikaとAntoine",
        "password_label": "パスワード",
    },
}


def fill(template: str, values: dict) -> str:
    html = template
    for key, value in values.items():
        html = html.replace(f"@@{key}@@", value)
    leftover = [token for token in html.split("@@")[1::2]]
    if leftover:
        raise SystemExit(f"Unreplaced tokens: {leftover}")
    return html


def font_stack(lang: str) -> dict:
    if lang == "ja":
        return {
            "FONT_HREF": "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400&family=Noto+Serif+JP:wght@200;300&display=swap",
            "DISPLAY": "'Noto Serif JP','Hiragino Mincho ProN','Yu Mincho',Georgia,serif",
            "BODY": "'Noto Sans JP','Hiragino Sans','Yu Gothic',Meiryo,sans-serif",
            "DATE_LS": "0.04em",
            "KICKER_LS": "0.12em",
        }
    return {
        "FONT_HREF": "https://fonts.googleapis.com/css2?family=Fahkwang:wght@200;300&family=Jost:wght@300;400&display=swap",
        "DISPLAY": "'Fahkwang',Georgia,'Times New Roman',serif",
        "BODY": "'Jost','Helvetica Neue',Helvetica,Arial,sans-serif",
        "DATE_LS": "0.12em",
        "KICKER_LS": "0.16em",
    }


def main() -> None:
    subjects = {}
    for lang, copy in COPY.items():
        values = {
            "LANG": lang,
            "SUBJECT": copy["subject"],
            "PREHEADER": copy["preheader"],
            "KICKER": copy["kicker"],
            "LEAD": copy["lead"],
            "HERO_DATE": copy["hero_date"],
            "VENUE": copy["venue"],
            "PLACE": copy["place"],
            "INVITE": copy["invite"],
            "ALT": copy["alt"],
            "PASSWORD_LABEL": copy["password_label"],
            "PASSWORD": PASSWORD,
            "URL": f"{SITE}/?lang={lang}",
            "PHOTO": PHOTO,
            "LEAF_LEFT": LEAF_LEFT,
            "LEAF_RIGHT": LEAF_RIGHT,
            **font_stack(lang),
        }
        (OUT / f"invite.{lang}.html").write_text(fill(TEMPLATE, values), encoding="utf-8")

        text_values = {
            "KICKER": copy["kicker"],
            "LEAD": copy["lead"],
            "HERO_DATE": copy["hero_date"].replace("&nbsp;", " "),
            "VENUE": copy["venue"],
            "PLACE": copy["place"],
            "INVITE_TEXT": copy["invite"].replace("<br>", "\n").replace("&nbsp;", " "),
            "PASSWORD_LABEL": copy["password_label"],
            "PASSWORD": PASSWORD,
            "URL": f"{SITE}/?lang={lang}",
        }
        (OUT / f"invite.{lang}.txt").write_text(fill(TEXT, text_values).strip() + "\n", encoding="utf-8")
        subjects[lang] = copy["subject"]

    preview = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Invite emails — Norika &amp; Antoine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fahkwang:wght@300;400&family=Jost:wght@300;400&display=swap" rel="stylesheet">
<style>
  body {{
    margin: 0;
    background: #F8F4EC;
    color: #24303A;
    font-family: "Jost", "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-weight: 300;
  }}
  header {{ text-align: center; padding: 36px 16px 8px; }}
  .mark {{
    font-family: "Fahkwang", Georgia, serif;
    letter-spacing: 0.28em;
    color: #8A6828;
    font-size: 13px;
  }}
  h1 {{
    margin: 10px 0 0;
    font-family: "Fahkwang", Georgia, serif;
    font-weight: 300;
    font-size: 2rem;
    letter-spacing: 0.04em;
  }}
  .langs {{ display: flex; gap: 8px; justify-content: center; margin: 18px 0 16px; }}
  button {{
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #2F6E8A;
    background: transparent;
    color: #2F6E8A;
    font-family: inherit;
    font-size: 12px;
    letter-spacing: 0.06em;
    cursor: pointer;
  }}
  button.on, button:hover {{ background: #2F6E8A; color: #fff; }}
  .subject {{ margin: 0; color: #24303A; font-size: 16px; }}
  .subject span.label {{
    display: block;
    margin-bottom: 4px;
    color: #8A6828;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }}
  .hint {{
    margin: 10px auto 0;
    max-width: 36rem;
    color: #5C6872;
    font-size: 14px;
    line-height: 1.5;
  }}
  iframe {{
    display: block;
    width: min(760px, 100%);
    height: 2100px;
    margin: 22px auto 48px;
    border: 0;
    background: #E7F1F6;
  }}
</style>
</head>
<body>
<header>
  <div class="mark">A &amp; N</div>
  <h1>Invite</h1>
  <div class="langs" role="group" aria-label="Language">
    <button type="button" data-lang="en">EN</button>
    <button type="button" data-lang="fr">FR</button>
    <button type="button" data-lang="ja">JP</button>
  </div>
  <p class="subject"><span class="label">Subject</span><span id="subject"></span></p>
  <p class="hint">Open invite.en.html, invite.fr.html, or invite.ja.html and send that file as the email. Plain-text versions sit beside them.</p>
</header>
<iframe id="frame" title="Invite email"></iframe>
<script>
  var subjects = {{
    en: {subjects["en"]!r},
    fr: {subjects["fr"]!r},
    ja: {subjects["ja"]!r}
  }};
  var frame = document.getElementById("frame");
  var subject = document.getElementById("subject");
  function fit() {{
    try {{
      frame.style.height = (frame.contentDocument.documentElement.scrollHeight + 8) + "px";
    }} catch (err) {{}}
  }}
  function show(lang) {{
    document.querySelectorAll(".langs button").forEach(function (btn) {{
      var on = btn.dataset.lang === lang;
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }});
    frame.src = "invite." + lang + ".html";
    subject.textContent = subjects[lang];
  }}
  document.querySelector(".langs").addEventListener("click", function (e) {{
    var btn = e.target.closest("button");
    if (btn) show(btn.dataset.lang);
  }});
  frame.addEventListener("load", fit);
  show("en");
</script>
</body>
</html>
"""
    (OUT / "preview.html").write_text(preview, encoding="utf-8")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
