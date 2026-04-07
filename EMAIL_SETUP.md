# 📧 Configuration des Emails - Connect Impact

## 🚀 Quick Start (Développement)

### Option 1 : Mailtrap (RECOMMANDÉ pour DEV) ✅
Parfait pour tester les emails sans les envoyer vraiment.

**1. Crée un compte gratuit :**
- Va sur https://mailtrap.io
- Inscris-toi gratuitement
- Crée une inbox (ex: "Connect Impact Dev")

**2. Récupère tes credentials :**
- Dans le dashboard Mailtrap, clique sur "Sending Domain"
- Tu verras les paramètres SMTP

**3. Configure ton `.env.docker` :**
```bash
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=465
MAIL_USER=votre_username_mailtrap
MAIL_PASS=votre_password_mailtrap
MAIL_FROM=noreply@connectimpact.fr
FRONTEND_URL=http://localhost:3001
```

**4. Redémarre Docker :**
```bash
make docker-down
docker-compose --env-file .env.docker up -d
```

**5. Teste :**
```bash
# Soumets une demande d'adhésion - tu recevras un email dans Mailtrap
curl -X POST http://localhost:3000/api/v1/membership/apply \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Jean",
    "lastName":"Dupont",
    "email":"jean@example.com",
    ...
  }'
```

**Avantages :**
- ✅ Gratuit et simple
- ✅ Pas de spam réel envoyé
- ✅ Tous les emails capturés dans une inbox
- ✅ Parfait pour le développement
- ✅ Interface web pour visualiser les emails

---

### Option 2 : Gmail (Simple)
Si tu veux utiliser un compte Gmail.

**1. Génère un mot de passe d'application :**
- Va sur https://myaccount.google.com
- Sécurité → Mots de passe d'application
- Sélectionne "Mail" et "Windows Computer" → génère
- Copie le password généré (16 caractères)

**2. Configure `.env.docker` :**
```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=ton_email@gmail.com
MAIL_PASS=le_mot_de_passe_genere_16_caracteres
MAIL_FROM=ton_email@gmail.com
FRONTEND_URL=http://localhost:3001
```

**⚠️ Important :** Utilise le mot de passe d'application, pas ton password Gmail normal !

---

### Option 3 : SendGrid (Production)
Pour la production, SendGrid est professionnel et fiable.

**1. Crée un compte :**
- https://sendgrid.com
- Inscris-toi (gratuit pour 100 emails/jour)

**2. Récupère ta clé API :**
- Paramètres → API Keys → Create API Key

**3. Configure `.env.docker` :**
```bash
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=SG.xxxxxxxxxxxxxxxxxxxxx
MAIL_FROM=noreply@connectimpact.fr
FRONTEND_URL=https://connectimpact.fr
```

---

## 📋 Emails envoyés automatiquement

### **1. Adhésion**
```
/api/v1/membership/apply (POST)
↓
Email de confirmation : "Votre demande d'adhésion a été reçue"
```

### **2. Acceptation d'adhésion**
```
/api/v1/membership/:id/approve (PATCH)
↓
Email de bienvenue avec identifiants :
- Numéro d'adhésion
- Email
- Mot de passe 6 chiffres
```

### **3. Refus d'adhésion**
```
/api/v1/membership/:id/reject (PATCH)
↓
Email de refus avec raison (optionnel)
```

### **4. Création de compte staff**
```
/api/v1/auth/staff (POST) - Admin only
↓
Email d'invitation avec lien activation (48h)
```

### **5. Activation de compte**
```
/api/v1/auth/activate (POST)
↓
Email de confirmation avec credentials
```

---

## 🧪 Test des emails

### Via Swagger (Recommandé)
```
1. Va sur http://localhost:3000/api/docs
2. Ouvre la section "Membership"
3. Clique sur POST /membership/apply
4. Remplis le formulaire et envoie
5. Vérifie ton email dans Mailtrap/Gmail
```

### Via cURL
```bash
curl -X POST http://localhost:3000/api/v1/membership/apply \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+33612345678",
    "dateOfBirth": "1990-01-15",
    "gender": "homme",
    "address": {
      "street": "123 Rue de Paris",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    },
    "profession": "Développeur",
    "motivationLetter": "Je souhaite rejoindre cette belle association pour contribuer au changement social...",
    "availability": "weekends",
    "agreesToStatutes": true,
    "agreesToPrivacyPolicy": true,
    "agreesToCodeOfConduct": true
  }'
```

---

## 🐛 Troubleshooting

### ❌ "Email failed to send"
**Solution :**
- Vérifie MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS
- Teste tes credentials dans Mailtrap/Gmail
- Utilise un mot de passe d'application pour Gmail (pas le password normal)

### ❌ "Connection timeout"
**Solution :**
- Si tu es en VPN, désactive-le
- Mailtrap/Gmail peuvent bloquer les connexions en masse
- Attends quelques secondes entre les tests

### ❌ Emails ne s'envoient pas depuis Docker
**Solution :**
```bash
# Redémarre les containers
make docker-reset
make docker-up

# Ou regarde les logs
docker-compose logs api | grep -i email
```

### ✅ Comment vérifier que ça marche ?
1. Envoie une demande d'adhésion
2. Va dans Mailtrap/Gmail pour voir l'email
3. Clique sur l'email pour voir le rendu HTML complet

---

## 📚 Emails disponibles

### AuthService
- `sendInvitation()` - Invitation staff
- `sendAccountActivated()` - Bienvenue après activation

### MembershipService
- `sendMembershipConfirmation()` - Confirmation soumission
- `sendMembershipApproved()` - Acceptation + identifiants
- `sendMembershipRejected()` - Refus + raison

---

## 🔒 Production

Pour la production, utilise **SendGrid** ou un service email professionnel :

```bash
# .env produit
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=SG.xxxxxxxxxxxxx
MAIL_FROM=noreply@connectimpact.fr
FRONTEND_URL=https://connectimpact.fr
NODE_ENV=production
```

**Avantages SendGrid :**
- ✅ Gratuit pour 100 emails/jour
- ✅ Scalable à des millions d'emails
- ✅ Suivi de délivrabilité
- ✅ Logs détaillés
- ✅ Pas de risque de spam

---

## 📞 Support

Besoin d'aide pour configurer les emails ?
- Mailtrap : https://mailtrap.io/docs
- Gmail : https://support.google.com/accounts/answer/185833
- SendGrid : https://sendgrid.com/docs
