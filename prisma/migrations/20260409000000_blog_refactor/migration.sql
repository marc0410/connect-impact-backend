-- ============================================================
-- Blog refactor: Article, Comment, BlogImage, BlogLike
-- ============================================================

-- 1. Drop FK that will be modified
ALTER TABLE "comments" DROP CONSTRAINT "comments_authorId_fkey";

-- 2. articles: category enum → text
ALTER TABLE "articles" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;

-- 3. articles: content text → jsonb (reset to empty array for dev data)
UPDATE "articles" SET "content" = '[]' WHERE "content" IS NULL OR "content" = '';
ALTER TABLE "articles" ALTER COLUMN "content" TYPE JSONB USING "content"::JSONB;

-- 4. articles: drop old columns
ALTER TABLE "articles" DROP COLUMN IF EXISTS "coverImageUrl";
ALTER TABLE "articles" DROP COLUMN IF EXISTS "readingTimeMinutes";

-- 5. articles: rename viewsCount → views
ALTER TABLE "articles" RENAME COLUMN "viewsCount" TO "views";

-- 6. articles: add new columns
ALTER TABLE "articles" ADD COLUMN "coverImageId" TEXT;
ALTER TABLE "articles" ADD COLUMN "readTime"     TEXT;
ALTER TABLE "articles" ADD COLUMN "likes"        INTEGER NOT NULL DEFAULT 0;

-- 7. comments: make authorId nullable, drop isApproved, add new fields
ALTER TABLE "comments" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "comments" DROP COLUMN IF EXISTS "isApproved";
ALTER TABLE "comments" ADD COLUMN "authorName"  TEXT NOT NULL DEFAULT '';
ALTER TABLE "comments" ADD COLUMN "authorEmail" TEXT;
ALTER TABLE "comments" ADD COLUMN "likes"       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "comments" ADD COLUMN "parentId"    TEXT;

-- 8. Restore comments.authorId FK (nullable, SET NULL on delete)
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 9. comments.parentId → self-referencing FK
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Create blog_images table
CREATE TABLE "blog_images" (
    "id"        TEXT        NOT NULL,
    "url"       TEXT        NOT NULL,
    "publicId"  TEXT        NOT NULL,
    "alt"       TEXT        NOT NULL,
    "caption"   TEXT,
    "width"     INTEGER     NOT NULL,
    "height"    INTEGER     NOT NULL,
    "size"      INTEGER     NOT NULL,
    "mimeType"  TEXT        NOT NULL,
    "order"     INTEGER     NOT NULL DEFAULT 0,
    "articleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_images_pkey" PRIMARY KEY ("id")
);

-- 11. Create blog_likes table
CREATE TABLE "blog_likes" (
    "id"        TEXT        NOT NULL,
    "articleId" TEXT        NOT NULL,
    "userId"    TEXT        NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_likes_pkey" PRIMARY KEY ("id")
);

-- 12. Unique indexes
CREATE UNIQUE INDEX "articles_coverImageId_key" ON "articles"("coverImageId");
CREATE UNIQUE INDEX "blog_likes_articleId_userId_key" ON "blog_likes"("articleId", "userId");

-- 13. FK: articles.coverImageId → blog_images.id
ALTER TABLE "articles" ADD CONSTRAINT "articles_coverImageId_fkey"
  FOREIGN KEY ("coverImageId") REFERENCES "blog_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 14. FK: blog_images.articleId → articles.id
ALTER TABLE "blog_images" ADD CONSTRAINT "blog_images_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 15. FK: blog_likes → articles & users
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 16. Drop ArticleCategory enum (no longer used)
DROP TYPE IF EXISTS "ArticleCategory";
