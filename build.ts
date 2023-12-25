// NOTE: this is very badly done, but it's a quick and easy way to generate 

import { parse } from 'yaml'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import type {YAMLResume} from './contents';

let htmlSkeleton = readFileSync("src/index.skeleton.html").toString();
const publicDirectory = readdirSync("public/");
const srcDirectory = readdirSync("src/");
const file = readFileSync("resume.yaml");
const parsed: YAMLResume = parse(file.toString());

function injectProjects() {
    const TAG = '<!--PROJECTS-->';
    const locationOfWrapper = htmlSkeleton.indexOf(TAG);
    let injectedContent = ''
    parsed.projects.forEach(({name, description, languages_and_tools}) => {
        injectedContent += `
            <h4>${name}</h4>
            <p>${description}</p>
            <h5>Languages&Tools</h5>
            <p>${languages_and_tools}</p>
            <span class="viewOnGithub"><a href="//github.com">View on GitHub</a></span>

        `
    })
    htmlSkeleton = htmlSkeleton.slice(0, locationOfWrapper) + injectedContent + htmlSkeleton.slice(locationOfWrapper+TAG.length);
}
function injectWorkExperience() {
    const TAG = '<!--WORK_EXPERIENCE-->';
    const locationOfWrapper = htmlSkeleton.indexOf(TAG);
    let injectedContent = ''
    parsed.work_experience.forEach(({company, company_description, description}) => {
        injectedContent += `
            <h4>${company}</h4>
            <p class='italics'>${company_description}</p>
            <p>${description}</p>
        `
         htmlSkeleton = htmlSkeleton.slice(0, locationOfWrapper) + injectedContent + htmlSkeleton.slice(locationOfWrapper+TAG.length);
    })
}
// inject text into html skeleton
injectProjects();
injectWorkExperience();

// finalize build and move necessary assets
if (!existsSync("build")) mkdirSync("build");
writeFileSync("build/index.html", htmlSkeleton);
publicDirectory.forEach(dir => {
    copyFileSync(`public/${dir}`, `build/${dir}`)
})
srcDirectory.forEach(file => {
    if (!file.includes(".skeleton.html")) copyFileSync(`src/${file}`, `build/${file}`)
})

// in the future, build PDF from YAML too.