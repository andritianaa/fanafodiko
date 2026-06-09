/**
 * Templates HTML d'emails, Fanafodiko
 *
 * Design inline-style pour compatibilité maximale avec tous les clients mail
 * (Gmail, Outlook, Apple Mail, Yahoo…).
 * Couleur principale : #4f46e5 (indigo-600)
 * Pas de border-radius, cohérent avec le style du frontend.
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

// ─── Template, Email de bienvenue ─────────────────────────────────────────────
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
        [
          "Suivre les médicaments",
          "Planifiez et suivez les traitements de chaque membre de votre foyer.",
        ],
        [
          "Rappels intelligents",
          "Recevez des notifications pour ne manquer aucune prise, jusqu'à 30 jours à l'avance.",
        ],
        [
          "Historique complet",
          "Consultez l'historique des prises et mesurez l'observance du traitement.",
        ],
        [
          "Mode hors-ligne",
          "L'application fonctionne même sans connexion internet.",
        ],
      ]
        .map(
          ([title, desc]) => `
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
      </tr>`,
        )
        .join("")}
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

// ─── Template, Demande de médicament (membre pharmacie) ───────────────────────
export function medSearchEmailTemplate(params: {
  pharmacyName: string;
  medicationName: string;
  note?: string;
  radiusKm: number;
  manageUrl: string;
}): { subject: string; html: string } {
  const { pharmacyName, medicationName, note, radiusKm, manageUrl } = params;

  const html = baseLayout(`
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background-color:#4f46e5;height:4px;"></td></tr>
    </table>

    <h1 style="margin:0 0 6px 0;color:#1c1917;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
      Demande de médicament
    </h1>
    <p style="margin:0 0 24px 0;color:#6366f1;font-size:14px;">
      Un patient recherche ce médicament près de <strong>${pharmacyName}</strong>
    </p>

    <hr style="border:none;border-top:1px solid #e0e7ff;margin:0 0 24px 0;" />

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px 0;color:#6366f1;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Médicament recherché</p>
          <p style="margin:0;color:#1c1917;font-size:20px;font-weight:700;">${medicationName}</p>
          ${note ? `<p style="margin:8px 0 0 0;color:#6b7280;font-size:13px;font-style:italic;">"${note}"</p>` : ""}
          <p style="margin:12px 0 0 0;color:#6b7280;font-size:12px;">Rayon de recherche : ${radiusKm} km</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px 0;color:#374151;font-size:14px;line-height:22px;">
      Ouvrez l'application pour confirmer rapidement si vous avez ce médicament en stock.
      Le patient sera notifié en temps réel.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${manageUrl}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
            Répondre dans l'application
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
      Vous recevez cet email car vous êtes membre de <strong>${pharmacyName}</strong> sur ${APP_NAME}.
    </p>
  `);

  return { subject: `Demande de médicament,${medicationName}`, html };
}

// ─── Template, Réinitialisation du mot de passe ───────────────────────────────
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
            Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email, votre compte reste sécurisé.
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

// ─── Petit utilitaire : barre + titre + CTA ───────────────────────────────────
function simpleTemplate(opts: {
  title: string;
  subtitle?: string;
  body: string; // HTML autorisé
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px 0;">
          <tr><td align="center">
            <a href="${opts.ctaUrl}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;">${opts.ctaLabel}</a>
          </td></tr>
        </table>`
      : "";

  return baseLayout(`
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background-color:#4f46e5;height:4px;"></td></tr>
    </table>
    <h1 style="margin:0 0 8px 0;text-align:center;color:#1c1917;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
      ${opts.title}
    </h1>
    ${opts.subtitle ? `<p style="margin:0 0 28px 0;text-align:center;color:#6366f1;font-size:15px;">${opts.subtitle}</p>` : ""}
    <hr style="border:none;border-top:1px solid #e0e7ff;margin:0 0 28px 0;" />
    <div style="color:#374151;font-size:15px;line-height:24px;margin-bottom:24px;">${opts.body}</div>
    ${cta}
    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:22px;text-align:center;">L'équipe ${APP_NAME}</p>
  `);
}

// ─── Invitation à gérer une pharmacie ─────────────────────────────────────────
export function pharmacyInvitationEmailTemplate(opts: {
  pharmacyName: string;
  role: "admin" | "staff";
  acceptUrl: string;
}): { subject: string; html: string } {
  const roleLabel =
    opts.role === "admin" ? "administrateur" : "membre du staff";
  return {
    subject: `Invitation à gérer ${opts.pharmacyName} sur ${APP_NAME}`,
    html: simpleTemplate({
      title: "Invitation à gérer une pharmacie",
      subtitle: opts.pharmacyName,
      body: `Bonjour,<br/><br/>Vous avez été invité(e) à rejoindre <strong style="color:#4f46e5;">${opts.pharmacyName}</strong>
        en tant que <strong>${roleLabel}</strong> sur ${APP_NAME}.<br/><br/>
        Cliquez sur le bouton ci-dessous pour accepter l'invitation. Si vous n'avez pas encore de compte,
        vous pourrez en créer un avec cette adresse email.`,
      ctaLabel: "Accepter l'invitation",
      ctaUrl: opts.acceptUrl,
    }),
  };
}

// ─── Notification admin plateforme : nouvelle demande de pharmacie ────────────
export function newPharmacyRequestEmailTemplate(opts: {
  pharmacyName: string;
  submitterEmail: string;
  wantsToManage: boolean;
  reviewUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Nouvelle demande de pharmacie : ${opts.pharmacyName}`,
    html: simpleTemplate({
      title: "Nouvelle demande de pharmacie",
      subtitle: opts.pharmacyName,
      body: `Une nouvelle pharmacie a été soumise par <strong>${opts.submitterEmail}</strong>.<br/><br/>
        ${opts.wantsToManage ? "⚠️ Le demandeur souhaite <strong>gérer cette pharmacie</strong> (justificatifs joints à vérifier)." : "Le demandeur ne demande pas la gestion."}
        <br/><br/>Connectez-vous au backoffice pour examiner et approuver/refuser la demande.`,
      ctaLabel: "Examiner la demande",
      ctaUrl: opts.reviewUrl,
    }),
  };
}

// ─── Notification au soumetteur : décision sur sa demande ─────────────────────
export function pharmacyRequestDecisionEmailTemplate(opts: {
  pharmacyName: string;
  approved: boolean;
  managementApproved?: boolean;
  reason?: string;
}): { subject: string; html: string } {
  const body = opts.approved
    ? `Bonne nouvelle ! Votre pharmacie <strong style="color:#4f46e5;">${opts.pharmacyName}</strong>
       a été <strong>approuvée</strong> et est désormais visible sur ${APP_NAME}.<br/><br/>
       ${
         opts.managementApproved
           ? "Votre demande de gestion a également été acceptée : vous pouvez maintenant gérer cette pharmacie depuis la section « Ma pharmacie »."
           : "Votre demande de gestion n'a pas été retenue, mais la pharmacie est bien publiée."
       }`
    : `Votre demande concernant <strong>${opts.pharmacyName}</strong> a été <strong>refusée</strong>.<br/><br/>
       ${opts.reason ? `Motif : ${opts.reason}` : "N'hésitez pas à nous contacter pour plus d'informations."}`;

  return {
    subject: opts.approved
      ? `Votre pharmacie ${opts.pharmacyName} a été approuvée`
      : `Votre demande de pharmacie a été refusée`,
    html: simpleTemplate({
      title: opts.approved ? "Demande approuvée 🎉" : "Demande refusée",
      subtitle: opts.pharmacyName,
      body,
    }),
  };
}

// ─── Notification admin plateforme : nouvelle réclamation de pharmacie ─────────
export function newPharmacyClaimEmailTemplate(opts: {
  pharmacyName: string;
  submitterEmail: string;
  reviewUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Nouvelle réclamation de pharmacie : ${opts.pharmacyName}`,
    html: simpleTemplate({
      title: "Nouvelle réclamation de pharmacie",
      subtitle: opts.pharmacyName,
      body: `Un utilisateur (<strong>${opts.submitterEmail}</strong>) affirme être le gérant de
        <strong style="color:#4f46e5;">${opts.pharmacyName}</strong>.<br/><br/>
        Des pièces justificatives et un contact ont été fournis. Connectez-vous au backoffice pour examiner et approuver/refuser la réclamation.`,
      ctaLabel: "Examiner la réclamation",
      ctaUrl: opts.reviewUrl,
    }),
  };
}

// ─── Notification au réclamant : décision sur sa réclamation ──────────────────
export function pharmacyClaimDecisionEmailTemplate(opts: {
  pharmacyName: string;
  approved: boolean;
  reason?: string;
}): { subject: string; html: string } {
  const body = opts.approved
    ? `Bonne nouvelle ! Votre réclamation concernant <strong style="color:#4f46e5;">${opts.pharmacyName}</strong>
       a été <strong>approuvée</strong>.<br/><br/>
       Vous êtes maintenant gérant de cette pharmacie et pouvez la gérer depuis la section « Ma pharmacie ».`
    : `Votre réclamation concernant <strong>${opts.pharmacyName}</strong> a été <strong>refusée</strong>.<br/><br/>
       ${opts.reason ? `Motif : ${opts.reason}` : "N'hésitez pas à nous contacter pour plus d'informations."}`;

  return {
    subject: opts.approved
      ? `Votre réclamation pour ${opts.pharmacyName} a été approuvée`
      : `Votre réclamation pour ${opts.pharmacyName} a été refusée`,
    html: simpleTemplate({
      title: opts.approved ? "Réclamation approuvée 🎉" : "Réclamation refusée",
      subtitle: opts.pharmacyName,
      body,
    }),
  };
}
