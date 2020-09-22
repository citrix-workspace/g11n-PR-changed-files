const gh = require('@actions/github');
const {Octokit} = require("@octokit/action");
const core = require('@actions/core');

async function doIt() {
  const paths = core.getInput('paths').split(' ').map(_ => new RegExp(_));
  const octokit = new Octokit();
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

  const {number} = gh.context.payload;
  const pull_number = number;

  if (!pull_number) {
    console.log('This action was initiated by something other than a pull_request defaulting to false');
    core.setOutput("matched", false);
    process.exit(0);
  }

  console.log(`Getting commits for pull_number: ${pull_number}`);
  console.log(`Searching for: ${paths}`);

  const files = await octokit.pulls.listFiles({owner, repo, pull_number});
  
  
  for(let file of files.data){
    console.log(file.filename);
  }
  
  const matched = files.data
    .map(_ => _.filename)
    .some(filename =>
      paths.some(path => path.test(filename))
    );

  console.log(`Matched: ${matched}`);

  core.setOutput("matched", matched);
  core.setOutput("pull_number", pull_number);

  process.exit(0);
}


doIt();

