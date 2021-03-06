const gh = require('@actions/github');
const {Octokit} = require("@octokit/action");
const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

async function run() {
  const paths = core.getInput('paths').split(' ').map(_ => new RegExp(_));
  const octokit = new Octokit();
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

  const {number} = gh.context.payload;
  const pull_number = number;
  var matched = false;

  if (!pull_number) {
    console.log('This action was initiated by something other than a pull_request defaulting to false');
    core.setOutput("matched", false);
    process.exit(0);
  }

  console.log(`Getting commits for pull_number: ${pull_number}`);
  console.log(`Searching for: ${paths}`);

  const files = await octokit.pulls.listFiles({owner, repo, pull_number});
  const project =  process.cwd();
  
  for(let file of files.data){
    try {
//       console.log(file.filename);
      if (paths.some(path => path.test(file.filename))){
        let resource_file = file.filename;
        let releted_metadata_path = resource_file.replace(/i18n[\s\S]*\.json/g,"metadata.json")
        const metadata_path = path.resolve(project, releted_metadata_path );
        const data = await fs.promises.readFile(metadata_path);
        var json = JSON.parse(data);

        if (!(json.hasOwnProperty("categories"))){
          matched = true;
          console.log("changed resource file in this PR:"+file.filename);
        }else{
          if(json["categories"].includes("WEB_SERVICES") || json["categories"].includes("PREVIEW")){
            matched = true;
            console.log("changed resource file in this PR:"+file.filename);
          }
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  }
  
//   const matched = files.data
//     .map(_ => _.filename)
//     .some(filename =>
//       paths.some(path => path.test(filename))
//     );

  console.log(`Matched: ${matched}`);

  core.setOutput("matched", matched);
  core.setOutput("pull_number", pull_number);

  process.exit(0);
}


run();


