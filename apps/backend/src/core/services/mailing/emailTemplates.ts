/**
 * Templates HTML d'emails — Fanafodiko
 *
 * Design inline-style pour compatibilité maximale avec tous les clients mail
 * (Gmail, Outlook, Apple Mail, Yahoo…).
 * Couleur principale : #4f46e5 (indigo-600)
 * Pas de border-radius — cohérent avec le style du frontend.
 */

const APP_NAME = "Fanafodiko";
const APP_URL = process.env.APP_URL ?? "https://fanafodiko.andritiana.tech";
const SUPPORT_EMAIL = `pro@${process.env.RESEND_DOMAIN_NAME ?? "fanafodiko.andritiana.tech"}`;

// ─── Layout de base ────────────────────────────────────────────────────────────
function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Corps -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 40px 32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td align="center" style="padding:24px 0 0 0;">
              <p style="margin:0;color:#a5b4fc;font-size:12px;line-height:20px;">
                Vous recevez cet email car vous avez un compte sur ${APP_NAME}.<br/>
                Des questions ? Écrivez-nous à
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:8px 0 0 0;color:#c7d2fe;font-size:11px;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Template — Email de bienvenue ─────────────────────────────────────────────
export function welcomeEmailTemplate(email: string): {
  subject: string;
  html: string;
} {
  const html = baseLayout(`
    <!-- Barre colorée en haut du corps -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#4f46e5;height:4px;"></td>
      </tr>
    </table>

    <!-- Titre -->
    <h1 style="margin:0 0 8px 0;text-align:center;color:#1c1917;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
      Bienvenue sur ${APP_NAME}
    </h1>
    <p style="margin:0 0 28px 0;text-align:center;color:#6366f1;font-size:15px;">
      Votre compte a été créé avec succès.
    </p>

    <hr style="border:none;border-top:1px solid #e0e7ff;margin:0 0 28px 0;" />

    <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:24px;">
      Bonjour,
    </p>
    <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:24px;">
      Nous sommes ravis de vous accueillir sur <strong style="color:#4f46e5;">${APP_NAME}</strong>,
      l'application de gestion des médicaments pour toute la famille.
    </p>
    <p style="margin:0 0 24px 0;color:#374151;font-size:15px;line-height:24px;">
      Avec ${APP_NAME}, vous pouvez&nbsp;:
    </p>

    <!-- Fonctionnalités -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        ["Suivre les médicaments", "Planifiez et suivez les traitements de chaque membre de votre foyer."],
        ["Rappels intelligents", "Recevez des notifications pour ne manquer aucune prise, jusqu'à 30 jours à l'avance."],
        ["Historique complet", "Consultez l'historique des prises et mesurez l'observance du traitement."],
        ["Mode hors-ligne", "L'application fonctionne même sans connexion internet."],
      ].map(([title, desc]) => `
      <tr>
        <td style="padding:0 0 14px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="8" valign="top" style="padding-top:5px;padding-right:12px;">
                <div style="width:8px;height:8px;background-color:#4f46e5;"></div>
              </td>
              <td valign="top">
                <p style="margin:0 0 2px 0;color:#1c1917;font-size:14px;font-weight:600;">${title}</p>
                <p style="margin:0;color:#6b7280;font-size:13px;line-height:20px;">${desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("")}
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${APP_URL}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;letter-spacing:0.2px;">
            Accéder à l'application
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:22px;text-align:center;">
      L'équipe ${APP_NAME}
    </p>
  `);

  return {
    subject: `Bienvenue sur ${APP_NAME}`,
    html,
  };
}

// ─── Template — Réinitialisation du mot de passe ───────────────────────────────
export function resetPasswordEmailTemplate(code: string): {
  subject: string;
  html: string;
} {
  const html = baseLayout(`
    <!-- Barre colorée en haut du corps -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#4f46e5;height:4px;"></td>
      </tr>
    </table>

    <!-- Titre -->
    <h1 style="margin:0 0 8px 0;text-align:center;color:#1c1917;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
      Réinitialisation du mot de passe
    </h1>
    <p style="margin:0 0 28px 0;text-align:center;color:#6366f1;font-size:15px;">
      Une demande de réinitialisation a été effectuée sur votre compte.
    </p>

    <hr style="border:none;border-top:1px solid #e0e7ff;margin:0 0 28px 0;" />

    <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:24px;">
      Bonjour,
    </p>
    <p style="margin:0 0 24px 0;color:#374151;font-size:15px;line-height:24px;">
      Vous avez demandé à réinitialiser votre mot de passe sur <strong style="color:#4f46e5;">${APP_NAME}</strong>.
      Utilisez le code ci-dessous pour continuer&nbsp;:
    </p>

    <!-- Code -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background-color:#eef2ff;border:2px solid #c7d2fe;padding:20px 40px;">
            <span style="font-size:36px;font-weight:700;color:#4f46e5;letter-spacing:10px;font-family:'Courier New',monospace;">${code}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Avertissement expiration -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#fef3c7;border-left:3px solid #d97706;padding:14px 18px;">
          <p style="margin:0;color:#92400e;font-size:13px;line-height:20px;">
            <strong>Ce code expire dans 15 minutes.</strong><br/>
            Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email — votre compte reste sécurisé.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:22px;text-align:center;">
      Pour toute question, contactez-nous à
      <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;text-decoration:none;">${SUPPORT_EMAIL}</a>
    </p>
  `);

  return {
    subject: `Réinitialisation de votre mot de passe ${APP_NAME}`,
    html,
  };
}
