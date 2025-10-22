/*
  Warnings:

  - You are about to drop the `event_result_files` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "event_result_files";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "EventResultFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    CONSTRAINT "EventResultFile_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventResultFile_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tournament_result_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "description" TEXT,
    "tournamentName" TEXT,
    "tournamentDate" DATETIME,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_result_files_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tournament_result_files" ("coachId", "createdAt", "description", "fileSize", "filename", "filepath", "id", "isPublic", "mimeType", "originalName", "tournamentDate", "tournamentName", "updatedAt", "uploadDate") SELECT "coachId", "createdAt", "description", "fileSize", "filename", "filepath", "id", "isPublic", "mimeType", "originalName", "tournamentDate", "tournamentName", "updatedAt", "uploadDate" FROM "tournament_result_files";
DROP TABLE "tournament_result_files";
ALTER TABLE "new_tournament_result_files" RENAME TO "tournament_result_files";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
