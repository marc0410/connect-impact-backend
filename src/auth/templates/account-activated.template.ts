export interface AccountActivatedTemplateParams {
  firstName: string;
  email: string;
  frontendUrl: string;
}

export function getAccountActivatedTemplate(params: AccountActivatedTemplateParams) {
  const { firstName, email, frontendUrl } = params;
  const loginLink = `${frontendUrl}/login`;

  return {
    subject: '✅ Votre compte Connect Impact est activé',
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
            .content h3 {
              margin: 30px 0 15px 0;
              font-size: 16px;
              color: #7B2FBE;
            }
            .credentials {
              background-color: #f9f9f9;
              padding: 20px;
              border-left: 4px solid #7B2FBE;
              margin: 20px 0;
              border-radius: 6px;
              font-family: 'Courier New', monospace;
            }
            .credentials-item {
              margin: 12px 0;
              font-size: 14px;
            }
            .label {
              font-weight: 600;
              color: #7B2FBE;
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
            .warning {
              background-color: #FFF3CD;
              border: 1px solid #FFE69C;
              border-left: 4px solid #F97316;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              font-size: 14px;
              color: #333;
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CI</div>
              <h1>✅ Compte activé</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${firstName}</strong>,</p>

              <p>Votre compte Connect Impact est maintenant <strong>actif</strong> et prêt à être utilisé ! 🎉</p>

              <h3>Votre identifiant :</h3>
              <div class="credentials">
                <div class="credentials-item">
                  <span class="label">Email :</span> ${email}
                </div>
              </div>

              <div class="warning">
                ⚠️ <strong>Sécurité :</strong> Ne partagez jamais votre code de connexion avec quiconque. Si vous pensez qu'il a été compromis, changez-le immédiatement.
              </div>

              <div class="center">
                <a href="${loginLink}" class="button">Se connecter</a>
              </div>

              <p>Si vous avez besoin d'aide, n'hésitez pas à nous contacter à <a href="mailto:contact@connectimpact.fr" style="color: #7B2FBE; text-decoration: none;">contact@connectimpact.fr</a></p>

              <p>Bienvenue dans la communauté Connect Impact !<br><strong>L'équipe Connect Impact</strong></p>
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
