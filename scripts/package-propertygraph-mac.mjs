import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(new URL("..", import.meta.url).pathname);
const webRoot = join(root, "apps", "web");
const webPackageJson = JSON.parse(readFileSync(join(webRoot, "package.json"), "utf8"));
const version = process.env.PROPERTYGRAPH_PACKAGE_VERSION || webPackageJson.version || "0.1.0";
const buildRoot = join(root, "build");
const downloads = join(buildRoot, "downloads");
const dmgStage = join(buildRoot, "propertygraph-dmg-stage");
const appName = "PropertyGraph";
const appRoot = join(downloads, `${appName}.app`);
const contents = join(appRoot, "Contents");
const macos = join(contents, "MacOS");
const resources = join(contents, "Resources");
const payload = join(resources, "propertygraph");
const nodeDir = join(resources, "node", "bin");
const nodeBinary = process.execPath;
const dmgPath = join(downloads, `PropertyGraph-Mac-${version}.dmg`);
const zipPath = join(downloads, `PropertyGraph-Mac-${version}.zip`);

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: "inherit", cwd: root, ...options });
}

function writeExecutable(path, body) {
  writeFileSync(path, body, { mode: 0o755 });
}

function assertExists(path, message) {
  if (!existsSync(path)) {
    throw new Error(`${message}: ${path}`);
  }
}

rmSync(downloads, { recursive: true, force: true });
rmSync(dmgStage, { recursive: true, force: true });
mkdirSync(macos, { recursive: true });
mkdirSync(payload, { recursive: true });
mkdirSync(nodeDir, { recursive: true });

run("npm", ["run", "build"]);

const standaloneRoot = join(webRoot, ".next", "standalone");
assertExists(standaloneRoot, "Next standalone output missing. Check apps/web/next.config.js");

const serverCandidates = [
  join(standaloneRoot, "apps", "web", "server.js"),
  join(standaloneRoot, "server.js")
];
const serverEntry = serverCandidates.find((candidate) => existsSync(candidate));
if (!serverEntry) {
  throw new Error(`Could not find standalone server.js in ${standaloneRoot}`);
}

const standaloneRuntimeRoot = dirname(serverEntry);
const runtimeRelativePath = relative(standaloneRoot, standaloneRuntimeRoot);
const runtimeShellPath = runtimeRelativePath ? `standalone/${runtimeRelativePath}` : "standalone";
const bundledStandalone = join(payload, "standalone");
const bundledRuntimeRoot = join(bundledStandalone, runtimeRelativePath);

copyFileSync(nodeBinary, join(nodeDir, basename(nodeBinary)));
cpSync(standaloneRoot, bundledStandalone, { recursive: true });

mkdirSync(join(bundledRuntimeRoot, ".next"), { recursive: true });
cpSync(join(webRoot, ".next", "static"), join(bundledRuntimeRoot, ".next", "static"), {
  recursive: true
});
if (existsSync(join(webRoot, "public"))) {
  cpSync(join(webRoot, "public"), join(bundledRuntimeRoot, "public"), { recursive: true });
}
copyFileSync(join(root, "README.md"), join(payload, "README.md"));
copyFileSync(join(root, "package.json"), join(payload, "package.json"));
copyFileSync(join(webRoot, "package.json"), join(payload, "web-package.json"));

writeFileSync(join(contents, "Info.plist"), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>PropertyGraph</string>
  <key>CFBundleExecutable</key>
  <string>propertygraph-launcher</string>
  <key>CFBundleIdentifier</key>
  <string>com.jourdanlabs.propertygraph</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>PropertyGraph</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleVersion</key>
  <string>${version}</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`);

writeExecutable(join(macos, "propertygraph-launcher"), `#!/bin/zsh
set -euo pipefail

CONTENTS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
NODE="$RESOURCES_DIR/node/bin/node"
APP_CODE="$RESOURCES_DIR/propertygraph/${runtimeShellPath}"
DATA_DIR="$HOME/Library/Application Support/JourdanLabs/PropertyGraph"
LOG_DIR="$HOME/Library/Logs/JourdanLabs"
ENV_FILE="\${PROPERTYGRAPH_ENV_FILE:-$DATA_DIR/propertygraph.env}"
PORT="\${PROPERTYGRAPH_APP_PORT:-3025}"

mkdir -p "$DATA_DIR" "$LOG_DIR"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

find_free_port() {
  local candidate="$1"
  while lsof -ti :"$candidate" >/dev/null 2>&1; do
    candidate=$((candidate + 1))
  done
  echo "$candidate"
}

PORT="$(find_free_port "$PORT")"
export HOSTNAME="127.0.0.1"
export PORT="$PORT"
export NEXT_PUBLIC_APP_URL="http://127.0.0.1:$PORT"
export PROPERTYGRAPH_DATA_DIR="$DATA_DIR"

cd "$APP_CODE"
nohup "$NODE" server.js >> "$LOG_DIR/propertygraph.log" 2>&1 &
echo "$!" > "$DATA_DIR/propertygraph.pid"

sleep 1
open "http://127.0.0.1:$PORT/"

osascript -e 'display notification "PropertyGraph is running in your browser." with title "JourdanLabs PropertyGraph"' >/dev/null 2>&1 || true
`);

const readme = `PropertyGraph for Mac ${version}

Double-click PropertyGraph.app to start the local PropertyGraph workbench.

What it does:
- Starts a local PropertyGraph server on 127.0.0.1.
- Opens the live property graph interface in your browser.
- Stores runtime files in:
  ~/Library/Application Support/JourdanLabs/PropertyGraph
- Writes logs to:
  ~/Library/Logs/JourdanLabs/propertygraph.log

Runtime data:
This app expects a local env file at:
  ~/Library/Application Support/JourdanLabs/PropertyGraph/propertygraph.env

Useful keys for live Supabase data:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY

Secrets are intentionally not embedded in this app bundle.

Security note:
This build is unsigned. macOS may require right-click -> Open the first time.
`;

writeFileSync(join(downloads, "README-PropertyGraph-Mac.txt"), readme);
writeExecutable(join(downloads, "Stop PropertyGraph.command"), `#!/bin/zsh
DATA_DIR="$HOME/Library/Application Support/JourdanLabs/PropertyGraph"
PID_FILE="$DATA_DIR/propertygraph.pid"

if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"
  if [ -n "$PID" ]; then
    kill "$PID" >/dev/null 2>&1 || true
  fi
  rm -f "$PID_FILE"
fi

for PID in $(pgrep -x node); do
  NODE_CWD="$(lsof -a -p "$PID" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"
  if [[ "$NODE_CWD" == *"PropertyGraph.app/Contents/Resources/propertygraph"* ]]; then
    kill "$PID" >/dev/null 2>&1 || true
    sleep 0.2
    kill -9 "$PID" >/dev/null 2>&1 || true
  fi
done

echo "PropertyGraph stopped."
`);

mkdirSync(dmgStage, { recursive: true });
cpSync(appRoot, join(dmgStage, `${appName}.app`), { recursive: true });
copyFileSync(join(downloads, "README-PropertyGraph-Mac.txt"), join(dmgStage, "README-PropertyGraph-Mac.txt"));
copyFileSync(join(downloads, "Stop PropertyGraph.command"), join(dmgStage, "Stop PropertyGraph.command"));

run("ditto", ["-c", "-k", "--keepParent", `${appName}.app`, zipPath], { cwd: downloads });
run("hdiutil", [
  "create",
  "-volname",
  `PropertyGraph ${version}`,
  "-srcfolder",
  dmgStage,
  "-ov",
  "-format",
  "UDZO",
  dmgPath
]);

const checksum = execFileSync("shasum", ["-a", "256", dmgPath], {
  cwd: downloads,
  encoding: "utf8"
});
writeFileSync(`${dmgPath}.sha256.txt`, checksum);

console.log(JSON.stringify({
  status: "ok",
  version,
  app: appRoot,
  dmg: dmgPath,
  zip: zipPath,
  checksum: `${dmgPath}.sha256.txt`
}, null, 2));
