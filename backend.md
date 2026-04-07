# 🚀 Connect Impact — Série de Prompts Backend NestJS (v3 — Prisma)

> **Mode d'emploi** : Envoie chaque prompt dans l'ordre à ton IA (Cursor, ChatGPT, Claude…).
> Attends la génération complète avant de passer au suivant.

---

## 🗺️ Vue d'ensemble du projet

```
Connect Impact est le site officiel d'UNE seule association.
Il n'y a pas plusieurs associations — c'est l'API et le backend
de l'association elle-même.

4 types d'utilisateurs :
  - member        → adhérent validé de l'association
  - responsable   → responsable interne de l'association
  - blog_manager  → gère le contenu du blog
  - admin         → accès total, gère tout depuis le backoffice

ORM : Prisma (pas TypeORM)
BDD : PostgreSQL
```

---

## PROMPT 0 — Initialisation & Configuration du projet

```
Tu es un expert NestJS. Initialise un projet backend NestJS pour une association
appelée "Connect Impact".

Stack technique :
- NestJS (dernière version stable)
- Prisma ORM avec PostgreSQL (PAS TypeORM)
- PassportJS pour l'authentification
- class-validator + class-transformer pour la validation des DTOs
- @nestjs/config pour les variables d'environnement
- @nestjs/jwt pour les tokens JWT
- @nestjs/swagger pour la documentation API
- bcrypt pour le hachage des mots de passe et tokens
- @nestjs-modules/mailer + nodemailer pour les emails

═══════════════════════════════════════════════
  SETUP PRISMA
═══════════════════════════════════════════════

Installe et configure Prisma :
  npm install prisma @prisma/client
  npx prisma init

Crée un PrismaService (src/prisma/prisma.service.ts) :
- Étend PrismaClient
- Implémente OnModuleInit → appelle this.$connect()
- Implémente OnModuleDestroy → appelle this.$disconnect()
- Exporte en tant que provider global

Crée un PrismaModule (src/prisma/prisma.module.ts) :
- Déclare et exporte PrismaService
- @Global() — disponible dans tous les modules sans import

═══════════════════════════════════════════════
  FICHIERS À GÉNÉRER
═══════════════════════════════════════════════

1. `package.json` avec toutes les dépendances

2. `.env.example` :
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
   JWT_SECRET=
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=
   JWT_REFRESH_EXPIRES_IN=7d
   MAIL_HOST=
   MAIL_PORT=
   MAIL_USER=
   MAIL_PASS=
   MAIL_FROM=
   APP_PORT=3000
   NODE_ENV=development
   FRONTEND_URL=

3. `prisma/schema.prisma` :
   - provider = "postgresql"
   - Charge DATABASE_URL depuis .env
   - Déclare tous les modèles (voir Prompt 1 à 5 pour les modèles détaillés)
   - Pour l'instant, laisse un modèle vide User en placeholder

4. `src/app.module.ts` :
   - ConfigModule (global: true, envFilePath: '.env')
   - PrismaModule (global)
   - MailerModule (config async via ConfigService)
   - Les modules : AuthModule, MembershipModule, ProfileModule, BlogModule, OpportunitiesModule

5. `src/main.ts` :
   - Swagger sur /api/docs
   - ValidationPipe global (whitelist: true, transform: true, forbidNonWhitelisted: true)
   - CORS activé (origin: process.env.FRONTEND_URL)
   - Prefix global /api/v1

═══════════════════════════════════════════════
  STRUCTURE DES DOSSIERS
═══════════════════════════════════════════════

src/
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── auth/
│   ├── dto/
│   ├── guards/
│   ├── strategies/
│   ├── templates/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── membership/
│   ├── dto/
│   ├── membership.controller.ts
│   ├── membership.service.ts
│   └── membership.module.ts
├── profile/
│   ├── dto/
│   ├── profile.controller.ts
│   ├── profile.service.ts
│   └── profile.module.ts
├── blog/
│   ├── dto/
│   ├── blog.controller.ts
│   ├── blog.service.ts
│   └── blog.module.ts
├── opportunities/
│   ├── dto/
│   ├── opportunities.controller.ts
│   ├── opportunities.service.ts
│   └── opportunities.module.ts
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── interceptors/
│   ├── filters/
│   └── utils/
├── config/
├── seeds/
├── app.module.ts
└── main.ts

prisma/
├── schema.prisma
└── migrations/

IMPORTANT : Avec Prisma, il n'y a plus de fichiers entities/.
Les modèles sont définis UNIQUEMENT dans prisma/schema.prisma.
Les services injectent PrismaService directement.
```

---

## PROMPT 1 — Schéma Prisma complet + Module Auth

```
Dans le projet NestJS Connect Impact avec Prisma, génère :
1. Le schéma Prisma complet (prisma/schema.prisma)
2. Le module Auth complet

═══════════════════════════════════════════════
  SCHÉMA PRISMA COMPLET
═══════════════════════════════════════════════

Fichier : prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

── ENUMS ──────────────────────────────────────

enum Role {
  admin
  responsable
  blog_manager
  member
}

enum AccountStatus {
  pending_invitation
  active
  suspended
  inactive
}

enum MembershipStatus {
  pending
  approved
  rejected
  suspended
}

enum MembershipType {
  actif
  bienfaiteur
  honoraire
  sympathisant
}

enum Gender {
  homme
  femme
  non_binaire
  prefere_ne_pas_dire
}

enum EducationLevel {
  college
  lycee
  bac
  bac_plus_2
  bac_plus_3
  bac_plus_5
  doctorat
  autre
}

enum EmploymentStatus {
  etudiant
  employe
  independant
  demandeur_emploi
  retraite
  autre
}

enum Availability {
  temps_plein
  mi_temps
  weekends
  ponctuel
}

enum ArticleCategory {
  actualite
  guide
  temoignage
  partenariat
  evenement
  rapport
}

enum ArticleStatus {
  draft
  published
  archived
}

enum OpportunityType {
  stage
  emploi
  formation
  benevolat
  freelance
  volontariat
}

enum ContractType {
  cdi
  cdd
  stage
  freelance
  benevole
  volontaire
}

enum OpportunityStatus {
  draft
  published
  closed
  expired
}

enum Sector {
  education
  environnement
  sante
  culture
  numerique
  humanitaire
  sport
  autre
}

enum ApplicationStatus {
  submitted
  viewed
  shortlisted
  rejected
  accepted
}

── MODÈLES ────────────────────────────────────

model User {
  id                       String        @id @default(uuid())
  email                    String        @unique
  username                 String?       @unique
  password                 String
  role                     Role          @default(member)
  accountStatus            AccountStatus @default(pending_invitation)
  invitationToken          String?
  invitationTokenExpiresAt DateTime?
  isFirstLogin             Boolean       @default(true)
  lastLoginAt              DateTime?
  refreshToken             String?
  createdById              String?
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt

  createdBy        User?         @relation("UserCreatedBy", fields: [createdById], references: [id])
  createdUsers     User[]        @relation("UserCreatedBy")
  memberProfile    MemberProfile?
  membership       Membership?   @relation("MemberUser")
  reviewedMemberships Membership[] @relation("ReviewedBy")
  articles         Article[]
  comments         Comment[]
  opportunities    Opportunity[]
  applications     Application[]
}

model Membership {
  id                    String           @id @default(uuid())
  firstName             String
  lastName              String
  email                 String
  phone                 String?
  dateOfBirth           DateTime
  gender                Gender?
  nationality           String?
  address               Json
  profession            String?
  educationLevel        EducationLevel?
  currentEmploymentStatus EmploymentStatus?
  motivationLetter      String
  skills                String[]
  availability          Availability
  hoursPerWeek          Int?
  hasVolunteeredBefore  Boolean          @default(false)
  previousExperience    String?
  agreesToStatutes      Boolean
  agreesToPrivacyPolicy Boolean
  agreesToCodeOfConduct Boolean
  status                MembershipStatus @default(pending)
  membershipNumber      String?          @unique
  membershipType        MembershipType   @default(actif)
  membershipStartDate   DateTime?
  membershipEndDate     DateTime?
  reviewedById          String?
  reviewedAt            DateTime?
  rejectionReason       String?
  internalNotes         String?
  userId                String?          @unique
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  reviewedBy    User?          @relation("ReviewedBy", fields: [reviewedById], references: [id])
  user          User?          @relation("MemberUser", fields: [userId], references: [id])
  memberProfile MemberProfile?
}

model MemberProfile {
  id                String         @id @default(uuid())
  userId            String         @unique
  membershipId      String         @unique
  membershipNumber  String
  firstName         String
  lastName          String
  avatarUrl         String?
  bio               String?
  phone             String?
  city              String?
  country           String?
  skills            String[]
  languages         String[]
  interests         String[]
  linkedinUrl       String?
  membershipType    MembershipType
  memberSince       DateTime
  membershipEndDate DateTime?
  membershipStatus  String         @default("active")
  isProfileComplete Boolean        @default(false)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user       User       @relation(fields: [userId], references: [id])
  membership Membership @relation(fields: [membershipId], references: [id])
}

model Article {
  id                 String          @id @default(uuid())
  title              String
  slug               String          @unique
  excerpt            String
  content            String
  coverImageUrl      String?
  authorId           String
  category           ArticleCategory
  tags               String[]
  status             ArticleStatus   @default(draft)
  isFeatured         Boolean         @default(false)
  publishedAt        DateTime?
  readingTimeMinutes Int?
  viewsCount         Int             @default(0)
  metaTitle          String?
  metaDescription    String?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  author   User      @relation(fields: [authorId], references: [id])
  comments Comment[]
}

model Comment {
  id         String   @id @default(uuid())
  articleId  String
  authorId   String
  content    String
  isApproved Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  author  User    @relation(fields: [authorId], references: [id])
}

model Opportunity {
  id                     String            @id @default(uuid())
  publisherId            String
  type                   OpportunityType
  title                  String
  organizationName       String
  organizationLogoUrl    String?
  location               Json
  description            String
  missions               String[]
  profileRequired        String
  contractType           ContractType?
  duration               String?
  startDate              DateTime?
  applicationDeadline    DateTime?
  salary                 Json?
  workingHours           String?
  benefits               String[]
  requiredSkills         String[]
  preferredSkills        String[]
  educationLevel         EducationLevel?
  experienceLevel        String?
  languages              String[]
  status                 OpportunityStatus @default(draft)
  isUrgent               Boolean           @default(false)
  isFeatured             Boolean           @default(false)
  tags                   String[]
  sector                 Sector
  applicationUrl         String?
  applicationEmail       String?
  applicationInstructions String?
  viewsCount             Int               @default(0)
  applicationsCount      Int               @default(0)
  publishedAt            DateTime?
  createdAt              DateTime          @default(now())
  updatedAt              DateTime          @updatedAt

  publisher    User          @relation(fields: [publisherId], references: [id])
  applications Application[]
}

model Application {
  id            String            @id @default(uuid())
  opportunityId String
  applicantId   String
  coverLetter   String?
  resumeUrl     String?
  linkedinUrl   String?
  status        ApplicationStatus @default(submitted)
  notes         String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  opportunity Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  applicant   User        @relation(fields: [applicantId], references: [id])

  @@unique([opportunityId, applicantId])
}

═══════════════════════════════════════════════
  RÈGLES MÉTIER AUTH
═══════════════════════════════════════════════

1. Les comptes MEMBER sont créés automatiquement par le système
   lors de la VALIDATION d'une demande d'adhésion (pas d'auto-inscription).

2. Les comptes RESPONSABLE, BLOG_MANAGER, ADMIN sont créés
   UNIQUEMENT par un admin depuis le backoffice (invitation).

3. La CONNEXION est identique pour tous les rôles :
   email OU username + mot de passe à 6 chiffres.

4. Les mots de passe à 6 chiffres sont toujours générés
   automatiquement par le système.

═══════════════════════════════════════════════
  DTOs AUTH
═══════════════════════════════════════════════

LoginDto : {
  identifier: string   // @IsString() — email OU username
  password: string     // @IsString() @Length(6,6)
}

CreateStaffAccountDto : {
  email: string        // @IsEmail()
  username: string     // @IsString() @MinLength(3)
  role: 'responsable' | 'blog_manager' | 'admin'  // @IsEnum()
  firstName: string    // @IsString()
  lastName: string     // @IsString()
}

ActivateAccountDto : {
  token: string        // @IsString()
  email: string        // @IsEmail()
}

RefreshTokenDto : {
  refreshToken: string // @IsString()
}

ChangePasswordDto : {
  currentPassword: string  // @IsString()
  newPassword: string      // @IsNumberString() @Length(6,6)
}

═══════════════════════════════════════════════
  SERVICE AUTH (auth.service.ts)
═══════════════════════════════════════════════

Injecte PrismaService (pas de Repository TypeORM).
Utilise this.prisma.user.findUnique(), this.prisma.user.create(), etc.

1. login(dto: LoginDto)
   - this.prisma.user.findFirst({ where: { OR: [{ email: dto.identifier }, { username: dto.identifier }] } })
   - Vérifie accountStatus === 'active' → UnauthorizedException sinon
   - bcrypt.compare(dto.password, user.password) → UnauthorizedException si invalide
   - this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date(), refreshToken: hashedRefresh } })
   - Génère accessToken (JWT 15min) + refreshToken (JWT 7j)
   - Retourne : { accessToken, refreshToken, user: { id, email, username, role } }

2. createMemberAccount(data: { email, username, membershipId })
   - Méthode interne appelée par MembershipService
   - Génère mot de passe 6 chiffres → this.generateSixDigitPassword()
   - Hache avec bcrypt
   - this.prisma.user.create({ data: { email, username, password: hashed, role: 'member', accountStatus: 'active' } })
   - Retourne { user, plainPassword }

3. createStaffAccount(creatorId: string, dto: CreateStaffAccountDto)
   - Vérifie que l'email n'existe pas déjà
   - Génère invitationToken (uuid v4), hache-le, set expiry +48h
   - this.prisma.user.create({ data: { ...dto, role, accountStatus: 'pending_invitation', invitationToken: hashed, invitationTokenExpiresAt, createdById: creatorId } })
   - Envoie email d'invitation
   - Retourne { message: 'Invitation envoyée' }

4. activateAccount(dto: ActivateAccountDto)
   - this.prisma.user.findFirst({ where: { email: dto.email } })
   - Vérifie invitationToken (bcrypt) + expiry → BadRequestException si invalide
   - Génère mot de passe 6 chiffres, hache
   - this.prisma.user.update({ where: { id }, data: { password: hashed, accountStatus: 'active', invitationToken: null, invitationTokenExpiresAt: null } })
   - Envoie email avec mot de passe
   - Génère et retourne JWT

5. refreshAccessToken(dto: RefreshTokenDto)
   - Vérifie et renouvelle l'accessToken

6. logout(userId: string)
   - this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } })

7. changePassword(userId: string, dto: ChangePasswordDto)
   - Vérifie ancien mot de passe, hache le nouveau, sauvegarde

8. private generateSixDigitPassword(): string
   - return Math.floor(100000 + Math.random() * 900000).toString()

═══════════════════════════════════════════════
  CONTROLLER AUTH (auth.controller.ts)
═══════════════════════════════════════════════

Routes publiques (@Public()) :
- POST /auth/login           → login(dto)
- POST /auth/activate        → activateAccount(dto)
- POST /auth/refresh         → refreshAccessToken(dto)

Routes protégées (JwtAuthGuard global) :
- POST  /auth/logout         → logout(@CurrentUser() user)
- PATCH /auth/change-password → changePassword(user.id, dto)
- GET   /auth/me             → retourne user connecté (sans password/refreshToken)

Routes admin (@Roles('admin')) :
- POST   /auth/staff                  → createStaffAccount(user.id, dto)
- GET    /auth/users                  → liste users paginée (query: page, limit, role, status)
- PATCH  /auth/users/:id/suspend      → suspend un compte
- PATCH  /auth/users/:id/reactivate   → réactive un compte
- DELETE /auth/users/:id              → supprime un compte

═══════════════════════════════════════════════
  GUARDS & STRATÉGIES
═══════════════════════════════════════════════

JwtStrategy (src/auth/strategies/jwt.strategy.ts) :
- extFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
- secretOrKey: JWT_SECRET
- validate(payload) retourne { id: payload.sub, email, username, role }

JwtAuthGuard (src/auth/guards/jwt-auth.guard.ts) :
- Étend AuthGuard('jwt')
- canActivate() : si route @Public() → return true, sinon super.canActivate()

═══════════════════════════════════════════════
  EMAIL TEMPLATES (src/auth/templates/)
═══════════════════════════════════════════════

invitation-staff.template.ts — email d'invitation staff :
Objet : "Votre invitation Connect Impact"
Corps HTML :
  Bonjour {firstName},
  Votre compte ({role}) a été créé sur Connect Impact.
  Cliquez sur ce bouton pour activer votre compte (lien valable 48h) :
  [Activer mon compte] → {FRONTEND_URL}/activate?token={token}&email={email}

account-activated.template.ts — confirmation activation :
Objet : "✅ Votre compte Connect Impact est activé"
Corps HTML :
  Votre compte est maintenant actif.
  ─────────────────────────────────
  Email    : {email}
  Mot de passe : {password}
  ─────────────────────────────────
  [Se connecter] → {FRONTEND_URL}/login
  Conservez bien ces informations.

Swagger complet (@ApiTags('Auth'), @ApiOperation, @ApiResponse, @ApiBearerAuth).

Après génération, exécute :
  npx prisma migrate dev --name init
```

---

## PROMPT 2 — Module Membership (Adhésion à l'association)

```
Dans le projet NestJS Connect Impact avec Prisma, génère le module Membership complet.

CONTEXTE :
- Une seule association (Connect Impact)
- N'importe qui (sans être connecté) peut soumettre une demande
- Quand l'admin valide → système crée automatiquement un compte User
  et envoie un email de bienvenue avec les identifiants

Utilise PrismaService pour toutes les opérations BDD.
Le modèle Membership est déjà défini dans prisma/schema.prisma (voir Prompt 1).

═══════════════════════════════════════════════
  DTOs
═══════════════════════════════════════════════

SubmitMembershipDto : {
  // Informations personnelles
  firstName: string            // @IsString() @IsNotEmpty()
  lastName: string             // @IsString() @IsNotEmpty()
  email: string                // @IsEmail()
  phone?: string               // @IsOptional() @IsString()
  dateOfBirth: string          // @IsDateString()
  gender?: Gender              // @IsOptional() @IsEnum(Gender)
  nationality?: string         // @IsOptional()
  address: {                   // @ValidateNested() @Type(() => AddressDto)
    street: string
    city: string
    postalCode: string
    country: string
  }

  // Informations professionnelles
  profession?: string
  educationLevel?: EducationLevel
  currentEmploymentStatus?: EmploymentStatus

  // Motivation & engagement
  motivationLetter: string     // @IsString() @MinLength(100) @MaxLength(2000)
  skills?: string[]            // @IsOptional() @IsArray()
  availability: Availability   // @IsEnum(Availability)
  hoursPerWeek?: number        // @IsOptional() @Min(1) @Max(40)
  hasVolunteeredBefore?: boolean
  previousExperience?: string

  // Consentements obligatoires
  agreesToStatutes: boolean    // @IsBoolean() — doit être true
  agreesToPrivacyPolicy: boolean
  agreesToCodeOfConduct: boolean
}

ReviewMembershipDto : {
  status: 'approved' | 'rejected' | 'suspended'
  membershipType?: MembershipType
  rejectionReason?: string     // obligatoire si status = 'rejected'
  internalNotes?: string
}

FilterMembershipDto : {
  status?: MembershipStatus
  membershipType?: MembershipType
  search?: string              // recherche nom/prénom/email
  page?: number                // @IsOptional() @Min(1) default: 1
  limit?: number               // @IsOptional() @Min(1) @Max(50) default: 10
}

═══════════════════════════════════════════════
  SERVICE (membership.service.ts)
═══════════════════════════════════════════════

Injecte PrismaService et AuthService.

1. submitApplication(dto: SubmitMembershipDto)
   - Vérifie qu'aucune demande pending/approved n'existe pour cet email :
     this.prisma.membership.findFirst({ where: { email: dto.email, status: { in: ['pending', 'approved'] } } })
   - Si existe → BadRequestException('Une demande est déjà en cours pour cet email')
   - Valide que agreesToStatutes, agreesToPrivacyPolicy, agreesToCodeOfConduct sont tous true
   - this.prisma.membership.create({ data: { ...dto, status: 'pending' } })
   - Envoie email de confirmation de réception
   - Retourne { message: 'Votre demande a bien été reçue. Nous vous répondrons dans les meilleurs délais.', id }

2. findAll(filters: FilterMembershipDto)
   - where = {}
   - Si filters.status → where.status = filters.status
   - Si filters.search → where.OR = [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: ... }, { email: ... }]
   - const [data, total] = await this.prisma.$transaction([
       this.prisma.membership.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { id, accountStatus } } } }),
       this.prisma.membership.count({ where })
     ])
   - Retourne paginateResponse(data, total, page, limit)

3. findById(id: string)
   - this.prisma.membership.findUnique({ where: { id }, include: { user: true, reviewedBy: { select: { id, email, username } } } })
   - NotFoundException si non trouvé

4. approveMembership(id: string, reviewerId: string, dto: ReviewMembershipDto)
   - Vérifie status === 'pending' → BadRequestException sinon
   - Génère membershipNumber :
     const year = new Date().getFullYear()
     const count = await this.prisma.membership.count({ where: { status: 'approved', membershipStartDate: { gte: new Date(`${year}-01-01`) } } })
     const membershipNumber = `CI-${year}-${String(count + 1).padStart(5, '0')}`
   - Set membershipStartDate = now, membershipEndDate = +1 an
   - this.prisma.membership.update({ where: { id }, data: { status: 'approved', membershipNumber, membershipType: dto.membershipType ?? 'actif', membershipStartDate, membershipEndDate, reviewedById: reviewerId, reviewedAt: new Date(), internalNotes: dto.internalNotes } })
   - Appelle this.authService.createMemberAccount({ email: membership.email, username: membershipNumber, membershipId: id })
   - this.prisma.membership.update({ where: { id }, data: { userId: newUser.id } })
   - Envoie email de bienvenue avec identifiants
   - Retourne { message: 'Adhésion validée', membershipNumber }

5. rejectMembership(id: string, reviewerId: string, dto: ReviewMembershipDto)
   - dto.rejectionReason obligatoire → BadRequestException sinon
   - this.prisma.membership.update({ where: { id }, data: { status: 'rejected', rejectionReason: dto.rejectionReason, reviewedById: reviewerId, reviewedAt: new Date() } })
   - Envoie email de refus au candidat
   - Retourne { message: 'Demande refusée' }

6. suspendMembership(id: string, reviewerId: string, dto: ReviewMembershipDto)
   - this.prisma.membership.update(status → 'suspended')
   - Si userId existe → this.prisma.user.update({ where: { id: userId }, data: { accountStatus: 'suspended' } })

7. getMyMembership(userId: string)
   - this.prisma.membership.findFirst({ where: { userId } })

8. getStats()
   - const [total, pending, approved, rejected, suspended, thisMonth] = await this.prisma.$transaction([
       this.prisma.membership.count(),
       this.prisma.membership.count({ where: { status: 'pending' } }),
       this.prisma.membership.count({ where: { status: 'approved' } }),
       this.prisma.membership.count({ where: { status: 'rejected' } }),
       this.prisma.membership.count({ where: { status: 'suspended' } }),
       this.prisma.membership.count({ where: { createdAt: { gte: startOfMonth } } })
     ])
   - Retourne { total, pending, approved, rejected, suspended, thisMonth }

═══════════════════════════════════════════════
  CONTROLLER (membership.controller.ts)
═══════════════════════════════════════════════

Routes PUBLIQUES (@Public()) :
- POST /membership/apply              → submitApplication(dto)

Routes membres (@Roles('member')) :
- GET  /membership/my-profile         → getMyMembership(user.id)

Routes admin + responsable (@Roles('admin', 'responsable')) :
- GET  /membership                    → findAll(filters)
- GET  /membership/stats              → getStats()
- GET  /membership/:id                → findById(id)
- PATCH /membership/:id/approve       → approveMembership(id, user.id, dto)
- PATCH /membership/:id/reject        → rejectMembership(id, user.id, dto)
- PATCH /membership/:id/suspend       → suspendMembership(id, user.id, dto)

═══════════════════════════════════════════════
  EMAIL TEMPLATES
═══════════════════════════════════════════════

application-received.template.ts :
Objet : "📬 Nous avons bien reçu votre demande d'adhésion"
Corps : Bonjour {firstName}, votre demande est en cours d'examen.
Nous vous répondrons dans les meilleurs délais. Merci pour votre intérêt !

membership-approved.template.ts :
Objet : "🎉 Bienvenue chez Connect Impact !"
Corps HTML :
  Félicitations {firstName} !
  Votre adhésion à Connect Impact a été validée.

  Numéro de membre : {membershipNumber}
  Type d'adhésion  : {membershipType}

  Vos identifiants de connexion :
  ────────────────────────────────
  Email        : {email}
  Mot de passe : {password}
  ────────────────────────────────
  [Accéder à mon espace] → {FRONTEND_URL}/login

  Conservez précieusement ce mot de passe.
  Bienvenue dans notre communauté ! 🌟

membership-rejected.template.ts :
Objet : "Réponse à votre demande d'adhésion Connect Impact"
Corps : Bonjour {firstName}, après examen de votre dossier, nous ne sommes
pas en mesure de donner une suite favorable à votre demande.
Motif : {rejectionReason}
N'hésitez pas à nous contacter pour plus d'informations.

Swagger complet sur toutes les routes.
```

---

## PROMPT 3 — Module Profile (Profil Membre)

```
Dans le projet NestJS Connect Impact avec Prisma, génère le module Profile.
Utilise PrismaService pour toutes les opérations.
Le modèle MemberProfile est défini dans prisma/schema.prisma.

═══════════════════════════════════════════════
  DTOs
═══════════════════════════════════════════════

UpdateMemberProfileDto : {
  avatarUrl?: string       // @IsOptional() @IsUrl()
  bio?: string             // @IsOptional() @MaxLength(500)
  phone?: string           // @IsOptional()
  city?: string            // @IsOptional()
  country?: string         // @IsOptional()
  skills?: string[]        // @IsOptional() @IsArray()
  languages?: string[]     // @IsOptional() @IsArray()
  interests?: string[]     // @IsOptional() @IsArray()
  linkedinUrl?: string     // @IsOptional() @IsUrl()
}

═══════════════════════════════════════════════
  SERVICE (profile.service.ts)
═══════════════════════════════════════════════

1. createProfile(userId, membershipData)
   - Méthode interne appelée par MembershipService après validation
   - this.prisma.memberProfile.create({ data: { userId, membershipId: membershipData.id, membershipNumber: membershipData.membershipNumber, firstName: membershipData.firstName, lastName: membershipData.lastName, membershipType: membershipData.membershipType, memberSince: membershipData.membershipStartDate, membershipEndDate: membershipData.membershipEndDate } })

2. getMyProfile(userId: string)
   - this.prisma.memberProfile.findUnique({ where: { userId }, include: { membership: { select: { status, membershipNumber, membershipStartDate } } } })
   - NotFoundException si non trouvé

3. updateProfile(userId: string, dto: UpdateMemberProfileDto)
   - this.prisma.memberProfile.update({ where: { userId }, data: { ...dto, isProfileComplete: this.checkProfileComplete(dto) } })

4. private checkProfileComplete(profile): boolean
   - Retourne true si bio, city, skills.length > 0 et languages.length > 0

5. getMembersList(filters?, pagination?)
   - this.prisma.memberProfile.findMany({ where, skip, take, select: { id, firstName, lastName, membershipNumber, membershipType, memberSince, city, avatarUrl, membershipStatus } })

6. getMemberByNumber(membershipNumber: string)
   - this.prisma.memberProfile.findFirst({ where: { membershipNumber }, include: { user: { select: { email, lastLoginAt, accountStatus } } } })

═══════════════════════════════════════════════
  CONTROLLER (profile.controller.ts)
═══════════════════════════════════════════════

Routes membres (@Roles('member')) :
- GET   /profile/me    → getMyProfile(user.id)
- PATCH /profile/me    → updateProfile(user.id, dto)

Routes admin + responsable (@Roles('admin', 'responsable')) :
- GET /profile/members                        → getMembersList(filters, pagination)
- GET /profile/members/:membershipNumber      → getMemberByNumber(membershipNumber)

Swagger complet.
```

---

## PROMPT 4 — Module Blog

```
Dans le projet NestJS Connect Impact avec Prisma, génère le module Blog complet.
Utilise PrismaService. Les modèles Article et Comment sont dans schema.prisma.

═══════════════════════════════════════════════
  DTOs
═══════════════════════════════════════════════

CreateArticleDto : {
  title: string              // @IsString() @IsNotEmpty()
  excerpt: string            // @IsString() @MaxLength(300)
  content: string            // @IsString()
  coverImageUrl?: string     // @IsOptional() @IsUrl()
  category: ArticleCategory  // @IsEnum(ArticleCategory)
  tags?: string[]            // @IsOptional() @IsArray()
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string   // @IsOptional() @MaxLength(160)
}

UpdateArticleDto = PartialType(CreateArticleDto)

CreateCommentDto : {
  articleId: string          // @IsUUID()
  content: string            // @IsString() @MinLength(10) @MaxLength(1000)
}

FilterArticleDto : {
  category?: ArticleCategory
  tag?: string
  search?: string
  page?: number
  limit?: number
}

═══════════════════════════════════════════════
  SERVICE (blog.service.ts)
═══════════════════════════════════════════════

1. createArticle(authorId, dto)
   - Génère slug : generateSlug(dto.title) depuis src/common/utils/slug.util.ts
   - Vérifie unicité du slug → ajoute suffixe aléatoire si conflit
   - Calcule readingTimeMinutes : Math.ceil(wordCount / 200)
   - this.prisma.article.create({ data: { ...dto, slug, authorId, readingTimeMinutes } })

2. findAllPublished(filters: FilterArticleDto)
   - where = { status: 'published' }
   - Ajoute filtres category, tag (tags: { has: tag }), search (title contains)
   - this.prisma.article.findMany({ where, skip, take, orderBy: { publishedAt: 'desc' }, select: { id, title, slug, excerpt, coverImageUrl, category, tags, publishedAt, readingTimeMinutes, viewsCount, isFeatured, author: { select: { username } } } })

3. findFeatured()
   - this.prisma.article.findMany({ where: { status: 'published', isFeatured: true }, orderBy: { publishedAt: 'desc' }, take: 6 })

4. findBySlug(slug: string)
   - this.prisma.article.findUnique({ where: { slug }, include: { author: { select: { username, memberProfile: { select: { avatarUrl } } } } } })
   - NotFoundException si non trouvé ou non publié (pour public)
   - this.prisma.article.update({ where: { slug }, data: { viewsCount: { increment: 1 } } })

5. findAllForManagement(authorId, role, filters)
   - Si role = 'admin' → tous les articles
   - Sinon → where.authorId = authorId
   - Retourne tous statuts avec pagination

6. updateArticle(id, authorId, dto)
   - Vérifie ownership ou role admin
   - Régénère slug si title changé
   - this.prisma.article.update(...)

7. publishArticle(id, authorId)
   - this.prisma.article.update({ where: { id }, data: { status: 'published', publishedAt: new Date() } })

8. archiveArticle(id, authorId)
   - this.prisma.article.update({ data: { status: 'archived' } })

9. deleteArticle(id, authorId) — admin only
   - this.prisma.article.delete({ where: { id } })

10. addComment(userId, dto)
    - this.prisma.comment.create({ data: { articleId: dto.articleId, authorId: userId, content: dto.content } })

11. approveComment(commentId, adminId)
    - this.prisma.comment.update({ where: { id: commentId }, data: { isApproved: true } })

12. getApprovedComments(articleId)
    - this.prisma.comment.findMany({ where: { articleId, isApproved: true }, include: { author: { select: { username } } }, orderBy: { createdAt: 'asc' } })

═══════════════════════════════════════════════
  CONTROLLER (blog.controller.ts)
═══════════════════════════════════════════════

Routes publiques (@Public()) :
- GET /blog                        → findAllPublished(filters)
- GET /blog/featured               → findFeatured()
- GET /blog/:slug                  → findBySlug(slug)
- GET /blog/:slug/comments         → getApprovedComments

Routes membres :
- POST /blog/:id/comments          → addComment(user.id, dto)

Routes blog_manager + admin (@Roles('blog_manager', 'admin')) :
- POST   /blog                     → createArticle(user.id, dto)
- PATCH  /blog/:id                 → updateArticle(id, user.id, dto)
- PATCH  /blog/:id/publish         → publishArticle(id, user.id)
- PATCH  /blog/:id/archive         → archiveArticle(id, user.id)
- GET    /blog/manage/all          → findAllForManagement(user.id, user.role, filters)

Routes admin (@Roles('admin')) :
- DELETE /blog/:id                       → deleteArticle(id, user.id)
- PATCH  /blog/comments/:id/approve      → approveComment(id, user.id)
- PATCH  /blog/:id/feature               → toggle isFeatured

Swagger complet.
```

---

## PROMPT 5 — Module Opportunities

```
Dans le projet NestJS Connect Impact avec Prisma, génère le module Opportunities complet.
Utilise PrismaService. Les modèles Opportunity et Application sont dans schema.prisma.

═══════════════════════════════════════════════
  DTOs
═══════════════════════════════════════════════

CreateOpportunityDto : {
  type: OpportunityType            // @IsEnum()
  title: string                    // @IsString()
  organizationName: string         // @IsString()
  organizationLogoUrl?: string
  location: {                      // @ValidateNested()
    city: string
    country: string
    isRemote: boolean
    isHybrid: boolean
  }
  description: string              // @IsString()
  missions: string[]               // @IsArray()
  profileRequired: string
  contractType?: ContractType
  duration?: string
  startDate?: string               // @IsOptional() @IsDateString()
  applicationDeadline?: string
  salary?: {
    amount?: number
    currency?: string
    period?: string
    isFree?: boolean
    label?: string
  }
  workingHours?: string
  benefits?: string[]
  requiredSkills: string[]
  preferredSkills?: string[]
  educationLevel?: EducationLevel
  experienceLevel?: string
  languages?: string[]
  isUrgent?: boolean
  tags?: string[]
  sector: Sector                   // @IsEnum()
  applicationUrl?: string
  applicationEmail?: string
  applicationInstructions?: string
}

UpdateOpportunityDto = PartialType(CreateOpportunityDto)

FilterOpportunityDto : {
  type?: OpportunityType
  sector?: Sector
  city?: string
  isRemote?: boolean
  isUrgent?: boolean
  search?: string
  page?: number
  limit?: number
}

CreateApplicationDto : {
  opportunityId: string   // @IsUUID()
  coverLetter?: string
  resumeUrl?: string
  linkedinUrl?: string
}

UpdateApplicationStatusDto : {
  status: ApplicationStatus  // @IsEnum()
  notes?: string
}

═══════════════════════════════════════════════
  SERVICE (opportunities.service.ts)
═══════════════════════════════════════════════

1. createOpportunity(publisherId, dto)
   - this.prisma.opportunity.create({ data: { ...dto, publisherId, status: 'draft' } })

2. findAllPublished(filters: FilterOpportunityDto)
   - where = { status: 'published' }
   - Ajoute filtres dynamiques : type, sector, location.city (JSON path), isUrgent, search
   - orderBy : [{ isFeatured: 'desc' }, { isUrgent: 'desc' }, { publishedAt: 'desc' }]
   - Pagination avec paginateResponse()

3. findFeatured()
   - this.prisma.opportunity.findMany({ where: { status: 'published', isFeatured: true }, take: 6 })

4. findById(id: string)
   - findUnique + increment viewsCount
   - include publisher info

5. updateOpportunity(id, publisherId, dto)
   - Vérifie ownership
   - this.prisma.opportunity.update(...)

6. publishOpportunity(id, publisherId)
   - this.prisma.opportunity.update({ data: { status: 'published', publishedAt: new Date() } })

7. closeOpportunity(id, publisherId)
   - this.prisma.opportunity.update({ data: { status: 'closed' } })

8. deleteOpportunity(id) — admin only
   - this.prisma.opportunity.delete({ where: { id } })

9. applyToOpportunity(applicantId, dto)
   - Vérifie que l'opportunité est publiée
   - Vérifie qu'une candidature n'existe pas déjà (contrainte unique)
   - this.prisma.application.create(...)
   - this.prisma.opportunity.update({ data: { applicationsCount: { increment: 1 } } })

10. getApplicationsByOpportunity(opportunityId, publisherId)
    - Vérifie ownership de l'opportunité
    - this.prisma.application.findMany({ where: { opportunityId }, include: { applicant: { select: { email, username, memberProfile: { select: { firstName, lastName, avatarUrl } } } } } })

11. getMyApplications(applicantId)
    - this.prisma.application.findMany({ where: { applicantId }, include: { opportunity: { select: { id, title, organizationName, type, status } } } })

12. updateApplicationStatus(applicationId, publisherId, dto)
    - Vérifie que le publisher est bien owner de l'opportunité liée
    - this.prisma.application.update({ data: { status: dto.status, notes: dto.notes } })

13. getStats(publisherId)
    - const [total, published, closed, totalApplications] = await this.prisma.$transaction([...])

═══════════════════════════════════════════════
  CONTROLLER (opportunities.controller.ts)
═══════════════════════════════════════════════

Routes publiques (@Public()) :
- GET /opportunities                          → findAllPublished(filters)
- GET /opportunities/featured                 → findFeatured()
- GET /opportunities/:id                      → findById(id)

Routes membres (@Roles('member')) :
- POST /opportunities/:id/apply               → applyToOpportunity(user.id, dto)
- GET  /opportunities/my-applications         → getMyApplications(user.id)

Routes responsable + admin (@Roles('responsable', 'admin')) :
- POST   /opportunities                       → createOpportunity(user.id, dto)
- PATCH  /opportunities/:id                   → updateOpportunity(id, user.id, dto)
- PATCH  /opportunities/:id/publish           → publishOpportunity(id, user.id)
- PATCH  /opportunities/:id/close             → closeOpportunity(id, user.id)
- GET    /opportunities/my-posts              → liste mes offres
- GET    /opportunities/:id/applications      → candidatures reçues
- PATCH  /opportunities/applications/:id/status → updateApplicationStatus
- GET    /opportunities/stats                 → getStats(user.id)

Routes admin (@Roles('admin')) :
- DELETE /opportunities/:id                   → deleteOpportunity(id)
- PATCH  /opportunities/:id/feature           → toggle isFeatured

Format réponse paginée : { data, total, page, lastPage }
Swagger complet.
```

---

## PROMPT 6 — Guards, Interceptors & Finalisation

```
Dans le projet NestJS Connect Impact avec Prisma, génère tous les éléments transverses.

═══════════════════════════════════════════════
  GUARDS (src/common/guards/)
═══════════════════════════════════════════════

RolesGuard (src/common/guards/roles.guard.ts) :
- Implémente CanActivate
- Injecte Reflector
- Lit les métadonnées ROLES_KEY via reflector.getAllAndOverride()
- Si aucun rôle requis → return true
- Compare roles.includes(request.user?.role)
- Return false → 403 Forbidden

═══════════════════════════════════════════════
  DÉCORATEURS (src/common/decorators/)
═══════════════════════════════════════════════

roles.decorator.ts :
  export const ROLES_KEY = 'roles'
  export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

public.decorator.ts :
  export const IS_PUBLIC_KEY = 'isPublic'
  export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

current-user.decorator.ts :
  export const CurrentUser = createParamDecorator((data, ctx) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  })

═══════════════════════════════════════════════
  INTERCEPTORS (src/common/interceptors/)
═══════════════════════════════════════════════

transform.interceptor.ts :
  Enveloppe toutes les réponses :
  {
    success: true,
    data: <payload>,
    timestamp: new Date().toISOString(),
    path: request.url
  }

logging.interceptor.ts :
  - Log au format : [METHOD] /path - {duration}ms - userId: {id|anonymous}

═══════════════════════════════════════════════
  FILTRES (src/common/filters/)
═══════════════════════════════════════════════

http-exception.filter.ts :
  Format erreur :
  {
    success: false,
    error: {
      statusCode: number,
      message: string | string[],
      details?: any
    },
    timestamp: string,
    path: string
  }
  Console.error pour les status >= 500

═══════════════════════════════════════════════
  UTILITAIRES (src/common/utils/)
═══════════════════════════════════════════════

pagination.util.ts :
  export function paginateResponse<T>(data: T[], total: number, page: number, limit: number) {
    return { data, total, page, lastPage: Math.ceil(total / limit) }
  }
  export function getPaginationParams(page = 1, limit = 10) {
    return { skip: (page - 1) * limit, take: limit }
  }

slug.util.ts :
  export function generateSlug(title: string): string
  - Convertit en minuscules
  - Remplace les accents (normalize NFD + replace diacritics)
  - Remplace espaces et caractères spéciaux par '-'
  - Supprime les '-' en début/fin
  - Ex: "Mon Article Génial !" → "mon-article-genial"

password.util.ts :
  export function generateSixDigitPassword(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

membership-number.util.ts :
  export function generateMembershipNumber(year: number, count: number): string {
    return `CI-${year}-${String(count).padStart(5, '0')}`
  }

═══════════════════════════════════════════════
  CONFIGURATION (src/config/)
═══════════════════════════════════════════════

jwt.config.ts :
  export const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  }

mail.config.ts :
  Configuration async MailerModule avec ConfigService :
  transport: { host, port, auth: { user, pass } }
  defaults: { from: MAIL_FROM }

═══════════════════════════════════════════════
  SEED ADMIN (src/seeds/admin.seed.ts)
═══════════════════════════════════════════════

Script exécutable indépendamment (pas via NestJS bootstrap) :
  import { PrismaClient } from '@prisma/client'
  import * as bcrypt from 'bcrypt'

  async function seedAdmin() {
    const prisma = new PrismaClient()
    const existing = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (existing) {
      console.log('✅ Un admin existe déjà')
      return
    }
    const password = generateSixDigitPassword()
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        email: 'admin@connectimpact.org',
        username: 'admin',
        password: hashed,
        role: 'admin',
        accountStatus: 'active',
        isFirstLogin: true
      }
    })
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Compte admin créé avec succès !')
    console.log('Email    : admin@connectimpact.org')
    console.log(`Mot de passe : ${password}`)
    console.log('⚠️  Notez ce mot de passe — il ne sera plus affiché')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await prisma.$disconnect()
  }

  seedAdmin()

Dans package.json ajoute :
  "seed:admin": "ts-node src/seeds/admin.seed.ts"

═══════════════════════════════════════════════
  APP.MODULE.TS — FINAL
═══════════════════════════════════════════════

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,       // global, fournit PrismaService partout
    MailerModule.forRootAsync(...),
    AuthModule,
    MembershipModule,
    ProfileModule,
    BlogModule,
    OpportunitiesModule,
  ]
})

Dans main.ts, applique globalement :
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

Dans AuthModule, applique les guards globaux via providers :
  { provide: APP_GUARD, useClass: JwtAuthGuard }
  { provide: APP_GUARD, useClass: RolesGuard }

═══════════════════════════════════════════════
  COMMANDES PRISMA À AJOUTER DANS package.json
═══════════════════════════════════════════════

"prisma:migrate": "prisma migrate dev"
"prisma:migrate:prod": "prisma migrate deploy"
"prisma:generate": "prisma generate"
"prisma:studio": "prisma studio"
"prisma:reset": "prisma migrate reset"
"seed:admin": "ts-node src/seeds/admin.seed.ts"

═══════════════════════════════════════════════
  README.md
═══════════════════════════════════════════════

Génère un README.md complet avec :
- Description du projet Connect Impact
- Stack technique (NestJS, Prisma, PostgreSQL)
- Prérequis (Node 18+, PostgreSQL)
- Installation :
    git clone ...
    npm install
    cp .env.example .env  (remplir les variables)
    npx prisma migrate dev
    npm run seed:admin
    npm run start:dev
- Tous les endpoints groupés par module
- Tableau des rôles et permissions
- Format des réponses succès et erreur
```

---

## ✅ Checklist de validation finale

- [ ] `npm install` sans erreur
- [ ] `npx prisma migrate dev --name init` → migrations OK
- [ ] `npm run seed:admin` → admin créé, mot de passe affiché dans la console
- [ ] `npm run start:dev` démarre sans erreur
- [ ] Swagger sur `http://localhost:3000/api/docs`
- [ ] `POST /api/v1/auth/login` → JWT retourné
- [ ] `POST /api/v1/membership/apply` sans token → 201 (route publique)
- [ ] `PATCH /api/v1/membership/:id/approve` → compte membre créé + email envoyé
- [ ] Connexion du nouveau membre → accès espace membre
- [ ] Route protégée sans token → 401
- [ ] Route admin avec token membre → 403
- [ ] Format réponse `{ success: true, data, timestamp, path }`
- [ ] Format erreur `{ success: false, error: { statusCode, message } }`
- [ ] `npx prisma studio` → visualiser les données en BDD

---

> 💡 **Tip** : Si ton IA perd le contexte entre les prompts, rappelle-lui :
> *"On travaille sur le backend NestJS de Connect Impact (association unique).
> Stack : NestJS + Prisma + PostgreSQL. Modules déjà générés : [liste]."*