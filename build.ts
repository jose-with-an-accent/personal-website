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
import { Project, WorkExperience, YAMLResume } from "./src/contents.d.ts";
import { Link } from "./src/contents.d.ts";
import { FoundationExperience } from "./src/contents.d.ts";

function injectContent<T>(
  tag: string,
  content: Array<T>,
  callback: (item: T) => string,
) {
  const TAG = `<!--${tag}-->`;
  const locationOfWrapper = htmlSkeleton.indexOf(TAG);
  let injectedContent = "";
  injectedContent += content.map(callback).join("");
  htmlSkeleton = htmlSkeleton.slice(0, locationOfWrapper) +
    injectedContent + htmlSkeleton.slice(locationOfWrapper + TAG.length);
}

// in the future, build PDF from YAML too.
let htmlSkeleton = readFileSync("src/index.skeleton.html").toString();
let publicDirectory = readdirSync("public/");
let srcDirectory = readdirSync("src/");
let file = readFileSync("src/resume.yaml");
let parsed: YAMLResume = parse(file.toString());

const injectProjects = () =>
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

const injectWorkExperience = () =>
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
  const injectFoundationExperience = () =>
    injectContent<FoundationExperience>(
      "FOUNDATION_EXPERIENCE",
      parsed.foundation_experience,
      ({ name, description, roles }) => {
        return `
                     <h4>${name}</h4>
                     <p class='italics'>${description}</p>
                     <p>${roles}</p>
                 `;
      },
    );
const injectLinks = () =>
  injectContent<Link>("LINKS", parsed.links, ({ name, href }) => (
    `<li id="resume_button"><a href="${href}">${name}</a></li>`
  ));

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
  injectLinks();
  injectFoundationExperience();
  finalizeBuild();
}

async function watch() {
  const watcher = Deno.watchFs("./src");
  console.log("%cwatching /src", "color: yellow");
  for await (const event of watcher) {
    if (event.paths[0].includes(".")) { // check if is file
      console.log(`%c${event.paths[0]} updated!`, "color: green");
      // update files
      htmlSkeleton = readFileSync("src/index.skeleton.html").toString();
      publicDirectory = readdirSync("public/");
      srcDirectory = readdirSync("src/");
      file = readFileSync("src/resume.yaml");
      parsed = parse(file.toString());

      injectProjects();
      injectWorkExperience();
      injectLinks();
      injectFoundationExperience();
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
  console.info("%cBuilt site!", "color: green");
}
