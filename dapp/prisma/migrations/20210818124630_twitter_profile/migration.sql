-- CreateTable
CREATE TABLE "TwitterProfile" (
    "id" INTEGER NOT NULL,
    "screen_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "followers_count" INTEGER NOT NULL,
    "friends_count" INTEGER NOT NULL,
    "favourites_count" INTEGER NOT NULL,
    "statuses_count" INTEGER NOT NULL,
    "profile_image_url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwitterProfile_userId_unique" ON "TwitterProfile"("userId");

-- AddForeignKey
ALTER TABLE "TwitterProfile" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
