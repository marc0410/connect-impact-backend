-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'responsable', 'blog_manager', 'member');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('pending_invitation', 'active', 'suspended', 'inactive');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('actif', 'bienfaiteur', 'honoraire', 'sympathisant');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('homme', 'femme', 'non_binaire', 'prefere_ne_pas_dire');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('college', 'lycee', 'bac', 'bac_plus_2', 'bac_plus_3', 'bac_plus_5', 'doctorat', 'autre');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('etudiant', 'employe', 'independant', 'demandeur_emploi', 'retraite', 'autre');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('temps_plein', 'mi_temps', 'weekends', 'ponctuel');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('actualite', 'guide', 'temoignage', 'partenariat', 'evenement', 'rapport');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('stage', 'emploi', 'formation', 'benevolat', 'freelance', 'volontariat');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('cdi', 'cdd', 'stage', 'freelance', 'benevole', 'volontaire');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('draft', 'published', 'closed', 'expired');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('education', 'environnement', 'sante', 'culture', 'numerique', 'humanitaire', 'sport', 'autre');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('submitted', 'viewed', 'shortlisted', 'rejected', 'accepted');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'member',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'pending_invitation',
    "invitationToken" TEXT,
    "invitationTokenExpiresAt" TIMESTAMP(3),
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender",
    "nationality" TEXT,
    "address" JSONB NOT NULL,
    "profession" TEXT,
    "educationLevel" "EducationLevel",
    "currentEmploymentStatus" "EmploymentStatus",
    "motivationLetter" TEXT NOT NULL,
    "skills" TEXT[],
    "availability" "Availability" NOT NULL,
    "hoursPerWeek" INTEGER,
    "hasVolunteeredBefore" BOOLEAN NOT NULL DEFAULT false,
    "previousExperience" TEXT,
    "agreesToStatutes" BOOLEAN NOT NULL,
    "agreesToPrivacyPolicy" BOOLEAN NOT NULL,
    "agreesToCodeOfConduct" BOOLEAN NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'pending',
    "membershipNumber" TEXT,
    "membershipType" "MembershipType" NOT NULL DEFAULT 'actif',
    "membershipStartDate" TIMESTAMP(3),
    "membershipEndDate" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "internalNotes" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "membershipNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "country" TEXT,
    "skills" TEXT[],
    "languages" TEXT[],
    "interests" TEXT[],
    "linkedinUrl" TEXT,
    "membershipType" "MembershipType" NOT NULL,
    "memberSince" TIMESTAMP(3) NOT NULL,
    "membershipEndDate" TIMESTAMP(3),
    "membershipStatus" TEXT NOT NULL DEFAULT 'active',
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "tags" TEXT[],
    "status" "ArticleStatus" NOT NULL DEFAULT 'draft',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "readingTimeMinutes" INTEGER,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "organizationLogoUrl" TEXT,
    "location" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "missions" TEXT[],
    "profileRequired" TEXT NOT NULL,
    "contractType" "ContractType",
    "duration" TEXT,
    "startDate" TIMESTAMP(3),
    "applicationDeadline" TIMESTAMP(3),
    "salary" JSONB,
    "workingHours" TEXT,
    "benefits" TEXT[],
    "requiredSkills" TEXT[],
    "preferredSkills" TEXT[],
    "educationLevel" "EducationLevel",
    "experienceLevel" TEXT,
    "languages" TEXT[],
    "status" "OpportunityStatus" NOT NULL DEFAULT 'draft',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "sector" "Sector" NOT NULL,
    "applicationUrl" TEXT,
    "applicationEmail" TEXT,
    "applicationInstructions" TEXT,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "applicationsCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "resumeUrl" TEXT,
    "linkedinUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'submitted',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_membershipNumber_key" ON "memberships"("membershipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_key" ON "memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_userId_key" ON "member_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_membershipId_key" ON "member_profiles"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "applications_opportunityId_applicantId_key" ON "applications"("opportunityId", "applicantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
