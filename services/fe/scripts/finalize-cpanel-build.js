const fs = require("fs");
const path = require("path");

const publicHtaccessPath = path.resolve(process.cwd(), "public", ".htaccess");
const buildHtaccessPath = path.resolve(process.cwd(), "build", ".htaccess");
const buildRuntimeConfigPath = path.resolve(process.cwd(), "build", "runtime-config.js");

if (fs.existsSync(publicHtaccessPath)) {
    fs.copyFileSync(publicHtaccessPath, buildHtaccessPath);
    console.log(`copied ${publicHtaccessPath} to ${buildHtaccessPath}`);
} else {
    console.log("public/.htaccess not found, skipping copy");
}

const {spawnSync} = require("child_process");
const result = spawnSync(process.execPath, [
    path.resolve(process.cwd(), "scripts", "write-runtime-config.js"),
    buildRuntimeConfigPath
], {stdio: "inherit"});

if (result.status !== 0) {
    process.exit(result.status || 1);
}
