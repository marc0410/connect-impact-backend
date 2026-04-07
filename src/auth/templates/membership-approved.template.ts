export interface MembershipApprovedParams {
  firstName: string;
  lastName: string;
  email: string;
  membershipNumber: string;
  frontendUrl: string;
}

export function getMembershipApprovedTemplate(
  params: MembershipApprovedParams,
) {
  const { firstName, lastName, email, membershipNumber, frontendUrl } = params;
  const loginLink = `${frontendUrl}/login`;

  return {
    subject: '🎉 Bienvenue ! Votre adhésion est acceptée',
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
            .welcome-box {
              background: linear-gradient(135deg, #F0E6FF, #FFE6E6);
              border-left: 4px solid #7B2FBE;
              padding: 20px;
              margin: 20px 0;
              border-radius: 6px;
              font-size: 15px;
            }
            .credentials {
              background-color: #f9f9f9;
              padding: 20px;
              border-left: 4px solid #F97316;
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CI</div>
              <h1>🎉 Bienvenue ${firstName} !</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>

              <div class="welcome-box">
                <strong>Excellente nouvelle !</strong> 🎊 Votre demande d'adhésion à <strong>Connect Impact</strong> a été <strong>acceptée</strong> !
              </div>

              <p>Nous sommes ravi(e) de vous accueillir parmi nos membres. Vous pouvez maintenant accéder à tous les bénéfices de votre adhésion et rejoindre notre communauté d'entrepreneurs sociaux.</p>

              <h3>Vos identifiants de connexion :</h3>
              <div class="credentials">
                <div class="credentials-item">
                  <span class="label">Numéro d'adhésion :</span> ${membershipNumber}
                </div>
                <div class="credentials-item">
                  <span class="label">Email :</span> ${email}
                </div>
              </div>

              <h3>Accès à votre compte</h3>
              <p>Connectez-vous à votre espace personnel pour :</p>
              <ul>
                <li>✨ Compléter votre profil</li>
                <li>🚀 Découvrir les opportunités d'emploi et bénévolat</li>
                <li>📰 Consulter les actualités et événements</li>
                <li>🎓 Accéder à nos masterclass et ressources</li>
              </ul>

              <div class="center">
                <a href="${loginLink}" class="button">Accéder à mon compte</a>
              </div>

              <p><strong>💡 Conseil :</strong> Utilisez le code à 6 chiffres que vous avez choisi lors de votre candidature pour vous connecter. Si vous l'avez oublié, utilisez le parcours de récupération disponible sur la page de connexion.</p>

              <p>Pour toute question, n'hésitez pas à nous contacter à <a href="mailto:contact@connectimpact.fr">contact@connectimpact.fr</a></p>

              <p>Bienvenue dans la communauté !<br><strong>L'équipe Connect Impact</strong></p>
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
