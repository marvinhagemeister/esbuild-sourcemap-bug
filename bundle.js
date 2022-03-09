const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const assert = require("assert");

async function run() {
  await esbuild.build({
    entryPoints: ["src/index.js"],
    sourcemap: true,
    bundle: true,
    absWorkingDir: process.cwd(),
    outdir: "dist",
    plugins: [
      {
        name: "alias-plugin",
        setup(build) {
          const alias = {
            "my-lib": path.join(__dirname, "src", "lib.js"),
          };

          build.onResolve({ filter: /^my-lib.*/ }, (args) => {
            const pkg = alias[args.path];
            return {
              path: pkg,
              namespace: "my-lib",
            };
          });

          build.onLoad({ filter: /\.[mc]?js$/ }, async (args) => {
            const contents = await fs.promises.readFile(args.path, "utf-8");

            return {
              contents,
              resolveDir: path.dirname(args.path),
              loader: "js",
            };
          });
        },
      },
    ],
  });

  const rawMap = await fs.promises.readFile(
    path.join(__dirname, "dist", "index.js.map"),
    "utf-8"
  );
  const map = JSON.parse(rawMap);

  assert.strict.deepEqual(map.sources, [
    "../src/lib.js",
    "../src/other/other.js",
    "../src/index.js",
  ]);
}

run();
