const core = require('@actions/core');
const github = require('@actions/github');
const token = core.getInput('token');
const octokit = github.getOctokit(token, {
    log: console,
});

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

        console.log(action);
    
        if (action && action.type === 'file' && action.size > 0) {
            url = repository.html_url;
        }

        if (url) {
            core.info(`${owner}/${repo} seems to be an action at url ${url}`);
        }
    
        return url;
    }
    catch (e) {
        return '';
    }
}

async function run() {
    try {
        const owner = core.getInput('owner');
        let actions = [];
        let reposByOwner;

        core.info(`Retrieving actions by: ${owner}`);

        for await (const response of octokit.paginate.iterator(octokit.repos.listForUser, { username: owner })) {
            reposByOwner = response.data; 
            const actionsInPage = (await Promise.all(reposByOwner.filter(r => r.size > 0).map(getUrlToAction)))
                .filter(a => a);
            actions = actions.concat(actionsInPage);
        }
        const results = JSON.stringify(actions);
        core.info(`Actions: ${results}`);
        core.setOutput(results);
        
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();