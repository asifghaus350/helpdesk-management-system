// Export every collection of the local database to JSON files,
// so the data can be copied to another laptop.
//
// Usage:  npm run db:export            -> writes to backend/db-backup/
//         npm run db:export -- <folder>

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = mongoose.mongo.BSON;

const outDir = path.resolve(process.argv[2] || path.join(__dirname, "..", "db-backup"));

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  fs.mkdirSync(outDir, { recursive: true });

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();

  for (const { name } of collections) {
    if (name.startsWith("system.")) continue;

    const docs = await db.collection(name).find({}).toArray();

    // Canonical EJSON keeps ObjectIds and Dates intact on import.
    fs.writeFileSync(
      path.join(outDir, `${name}.json`),
      EJSON.stringify(docs, null, 2, { relaxed: false })
    );

    console.log(`  ${name}: ${docs.length} documents`);
  }

  console.log(`\nExported database "${db.databaseName}" to ${outDir}`);
};

run()
  .catch((error) => {
    console.error("Export failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
