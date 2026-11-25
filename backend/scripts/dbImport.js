// Import JSON files made by dbExport.js into the local database.
// Each collection found in the backup folder is REPLACED.
//
// Usage:  npm run db:import -- --yes            -> reads backend/db-backup/
//         npm run db:import -- --yes <folder>

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");

const args = process.argv.slice(2);
const confirmed = args.includes("--yes");
const folderArg = args.find((arg) => arg !== "--yes");
const inDir = path.resolve(folderArg || path.join(__dirname, "..", "db-backup"));

const run = async () => {
  if (!fs.existsSync(inDir)) {
    throw new Error(`Backup folder not found: ${inDir}`);
  }

  const files = fs.readdirSync(inDir).filter((file) => file.endsWith(".json"));

  if (files.length === 0) {
    throw new Error(`No .json files in ${inDir}`);
  }

  if (!confirmed) {
    console.log(
      `This will REPLACE these collections with the backup in ${inDir}:\n  ` +
        files.map((file) => path.basename(file, ".json")).join(", ") +
        "\n\nRun again with --yes to continue:  npm run db:import -- --yes"
    );
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  for (const file of files) {
    const name = path.basename(file, ".json");
    const docs = EJSON.parse(fs.readFileSync(path.join(inDir, file), "utf8"), {
      relaxed: false,
    });

    const collection = db.collection(name);
    await collection.deleteMany({});
    if (docs.length > 0) {
      await collection.insertMany(docs);
    }

    console.log(`  ${name}: ${docs.length} documents`);
  }

  console.log(`\nImported into database "${db.databaseName}"`);
};

run()
  .catch((error) => {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
