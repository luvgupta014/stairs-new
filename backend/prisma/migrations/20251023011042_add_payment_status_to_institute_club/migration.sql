-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clubs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "location" TEXT,
    "city" TEXT,
    "state" TEXT,
    "established" TEXT,
    "facilities" TEXT,
    "membershipTypes" TEXT,
    "membersCount" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "clubs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_clubs" ("city", "createdAt", "established", "facilities", "id", "location", "membersCount", "membershipTypes", "name", "state", "type", "updatedAt", "userId") SELECT "city", "createdAt", "established", "facilities", "id", "location", "membersCount", "membershipTypes", "name", "state", "type", "updatedAt", "userId" FROM "clubs";
DROP TABLE "clubs";
ALTER TABLE "new_clubs" RENAME TO "clubs";
CREATE UNIQUE INDEX "clubs_userId_key" ON "clubs"("userId");
CREATE TABLE "new_institutes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "location" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "established" TEXT,
    "sportsOffered" TEXT,
    "studentsCount" INTEGER NOT NULL DEFAULT 0,
    "coachesCount" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "institutes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_institutes" ("city", "coachesCount", "createdAt", "established", "id", "location", "name", "pincode", "sportsOffered", "state", "studentsCount", "type", "updatedAt", "userId") SELECT "city", "coachesCount", "createdAt", "established", "id", "location", "name", "pincode", "sportsOffered", "state", "studentsCount", "type", "updatedAt", "userId" FROM "institutes";
DROP TABLE "institutes";
ALTER TABLE "new_institutes" RENAME TO "institutes";
CREATE UNIQUE INDEX "institutes_userId_key" ON "institutes"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
