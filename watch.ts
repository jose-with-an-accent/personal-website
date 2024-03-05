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
import { YAMLResume } from "./contents.d.ts";
// in the future, build PDF from YAML too.
let htmlSkeleton = readFileSync("src/index.skeleton.html").toString();
let publicDirectory = readdirSync("public/");
let srcDirectory = readdirSync("src/");
let file = readFileSync("resume.yaml");
let parsed: YAMLResume = parse(file.toString());

function injectProjects() {
  const TAG = "<!--PROJECTS-->";
  const locationOfWrapper = htmlSkeleton.indexOf(TAG);
  let injectedContent = "";
  parsed.projects.forEach(({ name, description, languages_and_tools }) => {
    injectedContent += `
            <h4>${name}</h4>
            <p>${description}</p>
            <h5>Languages&Tools</h5>
            <p>${languages_and_tools}</p>
            <span class="viewOnGithub"><a href="//github.com">View on GitHub</a></span>

        `;
  });
  htmlSkeleton = htmlSkeleton.slice(0, locationOfWrapper) + injectedContent +
    htmlSkeleton.slice(locationOfWrapper + TAG.length);
}
function injectWorkExperience() {
  const TAG = "<!--WORK_EXPERIENCE-->";
  const locationOfWrapper = htmlSkeleton.indexOf(TAG);
  let injectedContent = "";
  parsed.work_experience.forEach(
    ({ company, company_description, description }) => {
      injectedContent += `
            <h4>${company}</h4>
            <p class='italics'>${company_description}</p>
            <p>${description}</p>
        `;
      htmlSkeleton = htmlSkeleton.slice(0, locationOfWrapper) +
        injectedContent + htmlSkeleton.slice(locationOfWrapper + TAG.length);
    },
  );
}

if (Deno.args.includes("-w")) {
  watch();
} else if (Deno.args.includes("-h")) {
  console.log(`build.ts usage:
  - run without arguments to build once
  - run with '-w' to watch src directory
  `)
} else {
  injectProjects();
  injectWorkExperience();
  finalizeBuild();
}

async function watch() {
  let watcher = Deno.watchFs("./src");
  console.log("watching /src");
  for await (const event of watcher) {
    if (event.paths[0].includes(".")) { // check if is file
      console.log(`changed ${event.paths[0]}`)
      // update files
      htmlSkeleton = readFileSync("src/index.skeleton.html").toString();
      publicDirectory = readdirSync("public/");
      srcDirectory = readdirSync("src/");
      file = readFileSync("resume.yaml");
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
