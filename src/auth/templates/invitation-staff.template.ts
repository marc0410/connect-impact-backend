export interface InvitationStaffTemplateParams {
  firstName: string;
  role: string;
  token: string;
  email: string;
  frontendUrl: string;
}

export function getInvitationStaffTemplate(params: InvitationStaffTemplateParams) {
  const { firstName, role, token, email, frontendUrl } = params;
  const activationLink = `${frontendUrl}/activate?token=${token}&email=${encodeURIComponent(email)}`;

  return {
    subject: 'Votre invitation Connect Impact',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            }
            .header {
              background: linear-gradient(135deg, #7B2FBE, #E63C50, #F97316);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: 900;
              margin-bottom: 15px;
              background: linear-gradient(90deg, #7B2FBE, #E63C50);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 600;
              margin: 10px 0 0 0;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin-bottom: 15px;
              font-size: 15px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #7B2FBE, #E63C50);
              color: white;
              padding: 14px 40px;
              text-decoration: none;
              border-radius: 8px;
              margin: 25px 0;
              font-weight: 600;
              font-size: 15px;
              transition: transform 150ms ease, box-shadow 150ms ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 16px rgba(123, 47, 190, 0.3);
            }
            .alert {
              background-color: #FFE6E6;
              border: 1px solid #FFD4D4;
              border-left: 4px solid #E63C50;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              font-size: 14px;
            }
            .footer {
              padding: 20px 30px;
              margin-top: 20px;
              font-size: 12px;
              color: #999;
              text-align: center;
              border-top: 1px solid #f0f0f0;
            }
            .center { text-align: center; }
            strong { color: #7B2FBE; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CI</div>
              <h1>Bienvenue sur Connect Impact</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${firstName}</strong>,</p>

              <p>🎉 Votre compte <strong>${role}</strong> a été créé sur <strong>Connect Impact</strong>.</p>

              <p>Cliquez sur le bouton ci-dessous pour activer votre compte et définir votre code de connexion à 6 chiffres personnel :</p>

              <div class="center">
                <a href="${activationLink}" class="button">Activer mon compte</a>
              </div>

              <div class="alert">
                ⏰ <strong>Important :</strong> Ce lien d'activation expire dans 48 heures. Passé ce délai, vous devrez demander une nouvelle invitation.
              </div>

              <p>Une fois votre compte activé, vous pourrez :</p>
              <ul style="margin: 15px 0 15px 20px; font-size: 15px;">
                <li>Accéder à votre espace personnel</li>
                <li>Gérer les ressources de la plateforme</li>
                <li>Collaborer avec l'équipe Connect Impact</li>
              </ul>

              <p>Si vous avez besoin d'aide lors de l'activation, contactez-nous à <a href="mailto:contact@connectimpact.fr" style="color: #7B2FBE; text-decoration: none;">contact@connectimpact.fr</a></p>

              <p>À bientôt sur Connect Impact !<br><strong>L'équipe Connect Impact</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Connect Impact. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
