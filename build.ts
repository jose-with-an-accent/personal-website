// NOTE: this is very badly done, but it's a quick and easy way to generate

import { parse } from "yaml";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { Project, WorkExperience, YAMLResume } from "./contents.d.ts";
// in the future, build PDF from YAML too.
let htmlSkeleton = readFileSync("src/index.skeleton.html").toString();
let publicDirectory = readdirSync("public/");
let srcDirectory = readdirSync("src/");
let file = readFileSync("src/resume.yaml");
let parsed: YAMLResume = parse(file.toString());

function injectProjects() {
  injectContent<Project>(
    "PROJECTS",
    parsed.projects,
    ({ name, description, languages_and_tools }) => (`
             <h4>${name}</h4>
             <p>${description}</p>
             <h5>Languages&Tools</h5>
             <p>${languages_and_tools}</p>
             <span class="viewOnGithub"><a href="//github.com">View on GitHub</a></span>
         `),
  );
}
function injectContent<T>(
  tag: string,
  content: Array<T>,
  callback: (item: T) => string,
) {
  const TAG = `<!--${tag}-->`;
  const locationOfWrapper = htmlSkeleton.indexOf(TAG);
  let injectedContent = "";
  injectedContent += content.map(callback);
  htmlSkeleton = htmlSkeleton.slice(0, locationOfWrapper) +
    injectedContent + htmlSkeleton.slice(locationOfWrapper + TAG.length);
}
function injectWorkExperience() {
  injectContent<WorkExperience>(
    "WORK_EXPERIENCE",
    parsed.work_experience,
    ({ company, company_description, description }) => {
      return `
                   <h4>${company}</h4>
                   <p class='italics'>${company_description}</p>
                   <p>${description}</p>
               `;
    },
  );
}


if (Deno.args.includes("-w")) {
  watch();
} else if (Deno.args.includes("-h")) {
  console.log(`build.ts usage:
  - run without arguments to build once
  - run with '-w' to watch src directory
  `);
} else {
  injectProjects();
  injectWorkExperience();
  finalizeBuild();
}

async function watch() {
  const watcher = Deno.watchFs("./src");
  console.log("watching /src");
  for await (const event of watcher) {
    if (event.paths[0].includes(".")) { // check if is file
      console.log(`${event.paths[0]} updated!`);
      // update files
      htmlSkeleton = readFileSync("src/index.skeleton.html").toString();
      publicDirectory = readdirSync("public/");
      srcDirectory = readdirSync("src/");
      file = readFileSync("src/resume.yaml");
      parsed = parse(file.toString());

      injectProjects();
      injectWorkExperience();

      finalizeBuild();
    }
  }
}

function finalizeBuild() {
  if (!existsSync("build")) mkdirSync("build");
  writeFileSync("build/index.html", htmlSkeleton);
  publicDirectory.forEach((dir: any) => {
    copyFileSync(`public/${dir}`, `build/${dir}`);
  });
  srcDirectory.forEach((file: any) => {
    if (!file.includes(".skeleton.html")) {
      copyFileSync(`src/${file}`, `build/${file}`);
    }
  });
  console.info("Built site!");
}
