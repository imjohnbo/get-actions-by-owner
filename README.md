# Get Actions By Owner
> Get public actions of a given GitHub owner (user or organization)

## About

This action reports the public actions owned by `owner`. 🌟

## Usage

The [magically available `GITHUB_TOKEN`](https://docs.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token) will "just work", but for a higher rate limit, you might consider passing in another authentication `token` like a Personal Access Token or [GitHub App](https://github.com/tibdex/github-app-token).

```yaml
- uses: imjohnbo/get-actions-by-owner@v1
  with:
    owner: octocat
    token: ${{ secrets.GITHUB_TOKEN }}
```

## License

[MIT](LICENSE)