const core = require('@actions/core');
const github = require('@actions/github');
const artifact = require('@actions/artifact');
const owner = core.getInput('owner');
const token = core.getInput('token');
const artifactFile = `${owner}-actions.csv`;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const octokit = github.getOctokit(token, {
  log: console
});

const getActionsFromOwnerRepos = async (owner) => {
  let reposByOwner;
  let actions = [];

  core.info(`Retrieving actions by: ${owner}`);

  for await (const response of octokit.paginate.iterator(octokit.repos.listForUser, { username: owner })) {
    reposByOwner = response.data;
    const actionsInPage = (await Promise.all(reposByOwner.filter(r => r.size > 0).map(getUrlToAction))).filter(a => a.url);
    actions = actions.concat(actionsInPage);
  }

  return actions;
};

const getUrlToAction = async (repository) => {
  try {
    let url = '';
    const owner = repository.owner.login;
    const repo = repository.name;
    const path = 'action.yml';

    core.info(`Checking if ${owner}/${repo} is an action...`);

    const { data: action } = await octokit.repos.getContent({
      owner,
      repo,
      path
    });

    if (action && action.type === 'file' && action.size > 0) {
      url = repository.html_url;
    }

    if (url) {
      core.info(`${owner}/${repo} seems to be an action at url ${url}`);
    }

    return {
      url: url
    };
  } catch (e) {
    return '';
  }
};

const createCsvFromActions = async (actions) => {
  const csvWriter = createCsvWriter({
    path: artifactFile,
    header: [
      { id: 'url', title: 'URL' }
    ]
  });

  await csvWriter.writeRecords(actions);
};

const createArtifactFromCsv = async () => {
  const artifactClient = artifact.create();
  const artifactName = `${owner}-actions`;
  const files = [
    artifactFile
  ];
  const rootDirectory = '.';
  const options = {
    continueOnError: false
  };

  await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options);
};

const setOutput = (actions) => {
  const results = JSON.stringify(actions);
  core.info(`Actions: ${results}`);
  core.setOutput('actions', results);
};

async function run () {
  try {
    const actions = await getActionsFromOwnerRepos(owner);

    await createCsvFromActions(actions);

    await createArtifactFromCsv();

    setOutput(actions);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
