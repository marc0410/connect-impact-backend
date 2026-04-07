export interface MembershipRejectedParams {
  firstName: string;
  email: string;
  rejectionReason?: string;
  frontendUrl: string;
}

export function getMembershipRejectedTemplate(
  params: MembershipRejectedParams,
) {
  const { firstName, email, rejectionReason, frontendUrl } = params;

  return {
    subject: 'Suite à votre demande d\'adhésion',
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
              background: linear-gradient(135deg, #7B2FBE, #E63C50);
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
              background-color: #FFF3CD;
              border-left: 4px solid #F97316;
              padding: 20px;
              margin: 20px 0;
              border-radius: 6px;
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
            .footer {
              padding: 20px 30px;
              margin-top: 20px;
              font-size: 12px;
              color: #999;
              text-align: center;
              border-top: 1px solid #f0f0f0;
            }
            .center { text-align: center; }
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
              <h1>Suite à votre demande d'adhésion</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${firstName}</strong>,</p>

              <div class="info-box">
                Merci d'avoir manifesté votre intérêt pour rejoindre <strong>Connect Impact</strong>. Nous apprécions sincèrement votre engagement pour l'impact social.
              </div>

              <p>Malheureusement, votre demande d'adhésion n'a pas pu être acceptée à cette occasion.</p>

              ${rejectionReason ? `
                <h3>Raison de cette décision</h3>
                <p>${rejectionReason}</p>
              ` : ''}

              <h3>Et maintenant ?</h3>
              <ul>
                <li>📚 Consultez nos <a href="${frontendUrl}/faq">questions fréquentes</a> pour plus d'informations sur nos critères</li>
                <li>💬 Contactez-nous pour discuter de votre situation : <a href="mailto:contact@connectimpact.fr">contact@connectimpact.fr</a></li>
                <li>🔄 Vous pourrez renouveler votre demande dans 6 mois si votre situation a changé</li>
              </ul>

              <p>Nous encourageons les futurs porteurs de projets comme vous à rester en contact avec notre communauté. N'hésitez pas à suivre nos actualités et nos événements !</p>

              <div class="center">
                <a href="${frontendUrl}" class="button">Retourner au site</a>
              </div>

              <p>Nous restons à votre écoute et nous vous souhaitons le meilleur dans vos futurs projets d'impact.</p>

              <p>Cordialement,<br><strong>L'équipe Connect Impact</strong></p>
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
