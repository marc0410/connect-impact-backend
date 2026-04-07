export interface MembershipConfirmationParams {
  firstName: string;
  email: string;
  frontendUrl: string;
}

export function getMembershipConfirmationTemplate(
  params: MembershipConfirmationParams,
) {
  const { firstName, email, frontendUrl } = params;

  return {
    subject: '✅ Votre demande d\'adhésion a été reçue',
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
              margin: 25px 0 15px 0;
              font-size: 16px;
              color: #7B2FBE;
            }
            .content ul {
              margin: 15px 0 15px 20px;
              font-size: 15px;
            }
            .content ul li {
              margin: 8px 0;
            }
            .info-box {
              background-color: #F0E6FF;
              border-left: 4px solid #7B2FBE;
              padding: 20px;
              margin: 20px 0;
              border-radius: 6px;
              font-size: 15px;
            }
            .footer {
              padding: 20px 30px;
              margin-top: 20px;
              font-size: 12px;
              color: #999;
              text-align: center;
              border-top: 1px solid #f0f0f0;
            }
            a {
              color: #7B2FBE;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CI</div>
              <h1>Demande reçue ✅</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${firstName}</strong>,</p>

              <p>Merci d'avoir soumis votre demande d'adhésion à <strong>Connect Impact</strong> ! 🙌</p>

              <div class="info-box">
                📋 <strong>Votre demande a bien été enregistrée.</strong><br><br>
                Notre équipe l'examinera dans les meilleurs délais et vous recontacterons par email.
              </div>

              <h3>Récapitulatif de votre candidature</h3>
              <ul>
                <li><strong>Email :</strong> ${email}</li>
                <li><strong>Statut :</strong> En attente de validation</li>
                <li><strong>Délai :</strong> Réponse prévue sous 5-7 jours</li>
              </ul>

              <p>En attendant, vous pouvez explorer notre site et découvrir nos actualités et opportunités.</p>

              <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@connectimpact.fr">contact@connectimpact.fr</a></p>

              <p>À bientôt !<br><strong>L'équipe Connect Impact</strong></p>
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
