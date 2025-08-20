# MCP GitLab Jira Server
[![Trust Score](https://archestra.ai/mcp-catalog/api/badge/quality/HainanZhao/mcp-gitlab-jira)](https://archestra.ai/mcp-catalog/hainanzhao__mcp-gitlab-jira)

A Model Context Protocol (MCP) server for GitLab and Jira integration. This server allows AI agents like gemini-cli to interact with your GitLab and Jira instances.

## Features

### GitLab
- **Projects**: List all accessible projects or filter them by name.
- **Merge Requests**: List merge requests for a project, get detailed information (including diffs), add comments, and assign reviewers.
- **Pipeline/CI/CD**: Get pipeline status, trigger/retry/cancel pipelines, get job details and logs.
- **Branch Management**: List, create, delete branches and get branch details.
- **Issue Management**: Create, list, update, close issues and manage comments.
- **Files**: Get the content of a specific file at a given SHA.
- **Releases**: List all releases for a project or filter them since a specific version.
- **Users**: List project members, get a user's ID by username, and get user activities.

### Jira
- **Tickets**: Get detailed information about a ticket, get comments, add comments, search for tickets using JQL, create new tickets, get available transitions, update tickets, and transition tickets to a new status.
- **Project Management**: Get all projects, project details, components, and versions.

## Setup

### Prerequisites

- Node.js 18+
- GitLab Personal Access Token with API access
- Jira API Token
- Access to a GitLab instance (on-premise or GitLab.com)
- Access to a Jira instance

### Installation

1. **Install the package globally:**
   ```bash
   npm i -g mcp-gitlab-jira
   ```

2. **Set up environment variables:**
   ```bash
   # GitLab
   export GITLAB_URL="https://your-gitlab-instance.com"
   export GITLAB_ACCESS_TOKEN="your-personal-access-token"

   # Jira
   export ATLASSIAN_SITE_NAME="your-atlassian-site-name"
   export ATLASSIAN_USER_EMAIL="your-email@example.com"
   export ATLASSIAN_API_TOKEN="your-jira-api-token"
   ```

3. **Test the server manually**:
   ```bash
   # Test that the server starts without errors
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | mcp-gitlab-jira
   ```
   The server should start and log "GitLab/Jira MCP server started" to stderr.

### Using with MCP Clients

#### Configuration for gemini-cli or other MCP clients

Create or update your MCP configuration file (usually `~/.mcp/config.json` or similar):

```json
{
  "mcpServers": {
    "gitlab-jira-mcp": {
      "command": "mcp-gitlab-jira",
      "env": {
        "GITLAB_URL": "https://your-gitlab-instance.com",
        "GITLAB_ACCESS_TOKEN": "your-personal-access-token",
        "ATLASSIAN_SITE_NAME": "your-atlassian-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-jira-api-token"
      }
    }
  }
}
```

## Running with Docker

You can also run this MCP server in a Docker container using the pre-built image from Docker Hub.

### Available Docker Images

The Docker images are automatically built and published to Docker Hub for each release:
- **Latest release**: `hainanzhao/mcp-gitlab-jira:latest`
- **Specific versions**: `hainanzhao/mcp-gitlab-jira:v0.1.2`, `hainanzhao/mcp-gitlab-jira:v0.1.1`, etc.
- **View all available tags**: [Docker Hub - mcp-gitlab-jira](https://hub.docker.com/r/hainanzhao/mcp-gitlab-jira/tags)

The images are built for multiple architectures: `linux/amd64` and `linux/arm64` (Apple Silicon compatible).

### Usage

1.  **Pull and run the Docker container:**
    ```bash
    docker run -d --name mcp-gitlab-jira-container \
      -e GITLAB_URL="https://your-gitlab-instance.com" \
      -e GITLAB_ACCESS_TOKEN="your-personal-access-token" \
      -e ATLASSIAN_SITE_NAME="your-atlassian-site-name" \
      -e ATLASSIAN_USER_EMAIL="your-email@example.com" \
      -e ATLASSIAN_API_TOKEN="your-jira-api-token" \
      hainanzhao/mcp-gitlab-jira:latest
    ```

2.  **Alternative: Run without persistent container (one-time execution):**
    ```bash
    docker run --rm -i \
      -e GITLAB_URL="https://your-gitlab-instance.com" \
      -e GITLAB_ACCESS_TOKEN="your-personal-access-token" \
      -e ATLASSIAN_SITE_NAME="your-atlassian-site-name" \
      -e ATLASSIAN_USER_EMAIL="your-email@example.com" \
      -e ATLASSIAN_API_TOKEN="your-jira-api-token" \
      hainanzhao/mcp-gitlab-jira:latest
    ```

### Using with MCP Clients (Docker)

You have two options for using the Docker container with MCP clients:

#### Option 1: Using a persistent container (recommended)

First, start the container as shown above, then update your MCP configuration file. The `env` block is empty because the necessary environment variables are passed directly to the container using the `-e` flag in the `docker run` command.

```json
{
  "mcpServers": {
    "gitlab-jira-mcp": {
      "command": "docker",
      "args": ["exec", "-i", "mcp-gitlab-jira-container", "npm", "start"],
      "env": {}
    }
  }
}
```

#### Option 2: Using one-time execution

This runs a new container for each MCP session:

```json
{
  "mcpServers": {
    "gitlab-jira-mcp": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "GITLAB_URL=https://your-gitlab-instance.com",
        "-e", "GITLAB_ACCESS_TOKEN=your-personal-access-token",
        "-e", "ATLASSIAN_SITE_NAME=your-atlassian-site-name",
        "-e", "ATLASSIAN_USER_EMAIL=your-email@example.com",
        "-e", "ATLASSIAN_API_TOKEN=your-jira-api-token",
        "hainanzhao/mcp-gitlab-jira:latest"
      ],
      "env": {}
    }
  }
}
```


## Available Tools

### GitLab Tools

#### Core GitLab Tools
- `gitlab_get_merge_request_details`: Fetches detailed information about a GitLab Merge Request, including file diffs.
- `gitlab_get_file_content`: Fetches the content of a specific file at a given SHA in a GitLab project.
- `gitlab_add_comment_to_merge_request`: Adds a comment to a GitLab Merge Request. Can be a general comment, a reply to an existing discussion, or an inline comment on a specific line.
- `gitlab_list_merge_requests`: Lists merge requests for a given GitLab project.
- `gitlab_assign_reviewers_to_merge_request`: Assigns reviewers to a GitLab Merge Request.
- `gitlab_list_project_members`: Lists all members (contributors) of a given GitLab project.
- `gitlab_list_project_members_by_project_name`: Lists all members (contributors) of a given GitLab project by project name.
- `gitlab_list_projects_by_name`: Filters GitLab projects by name using a fuzzy, case-insensitive match.
- `gitlab_list_all_projects`: Lists all accessible GitLab projects.
- `gitlab_list_all_releases`: Fetches releases for a given GitLab project.
- `gitlab_list_releases_since_version`: Filters releases for a given GitLab project since a specific version.
- `gitlab_get_user_id_by_username`: Retrieves the GitLab user ID for a given username.
- `gitlab_get_user_activities`: Fetches activities for a given GitLab user by their username, optionally filtered by date.

#### GitLab Pipeline/CI/CD Tools
- `gitlab_get_project_pipelines`: Gets pipelines for a GitLab project, optionally filtered by branch/ref.
- `gitlab_get_merge_request_pipelines`: Gets pipelines for a specific GitLab Merge Request.
- `gitlab_get_pipeline_details`: Gets detailed information about a specific pipeline.
- `gitlab_get_pipeline_jobs`: Gets jobs for a specific pipeline.
- `gitlab_get_job_logs`: Gets logs for a specific job.
- `gitlab_trigger_pipeline`: Triggers a new pipeline for a specific branch/ref.
- `gitlab_retry_pipeline`: Retries a failed pipeline.
- `gitlab_cancel_pipeline`: Cancels a running pipeline.

#### GitLab Branch Management Tools
- `gitlab_list_branches`: Lists all branches in a GitLab project.
- `gitlab_create_branch`: Creates a new branch in a GitLab project.
- `gitlab_delete_branch`: Deletes a branch from a GitLab project.
- `gitlab_get_branch_details`: Gets detailed information about a specific branch.

#### GitLab Issue Management Tools
- `gitlab_list_project_issues`: Lists issues in a GitLab project.
- `gitlab_get_issue_details`: Gets detailed information about a specific GitLab issue.
- `gitlab_create_issue`: Creates a new issue in a GitLab project.
- `gitlab_update_issue`: Updates an existing GitLab issue.
- `gitlab_close_issue`: Closes a GitLab issue.
- `gitlab_add_comment_to_issue`: Adds a comment to a GitLab issue.
- `gitlab_get_issue_comments`: Gets comments for a GitLab issue.

### Jira Tools

#### Core Jira Tools
- `jira_get_jira_ticket_details`: Fetches detailed information about a Jira ticket.
- `jira_get_jira_ticket_comments`: Fetches comments for a Jira ticket.
- `jira_add_comment_to_ticket`: Adds a comment to a Jira ticket.
- `jira_search_tickets_by_jql`: Searches for Jira tickets using a JQL (Jira Query Language) string.
- `jira_create_ticket`: Creates a new Jira ticket with given fields.
- `jira_get_available_transitions`: Fetches available transitions for a Jira ticket.
- `jira_update_ticket`: Updates a Jira ticket summary, description, labels.
- `jira_update_custom_fields`: Updates custom fields on a Jira ticket.
- `jira_transition_ticket`: Transitions a Jira ticket to a new status.
- `jira_get_all_fields`: Fetches the list of all fields from Jira.

#### Jira Project Management Tools
- `jira_get_all_projects`: Gets all accessible Jira projects.
- `jira_get_project_details`: Gets detailed information about a specific Jira project.
- `jira_get_project_components`: Gets components for a Jira project.
- `jira_get_project_versions`: Gets versions for a Jira project.

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: If you are developing locally, make sure you've run `npm install` and `npm run build`.
2. **Authentication errors**: Verify your `GITLAB_ACCESS_TOKEN`, `ATLASSIAN_USER_EMAIL`, and `ATLASSIAN_API_TOKEN` have the necessary permissions.
3. **Connection errors**: Ensure your `GITLAB_URL` and `ATLASSIAN_SITE_NAME` are correct and accessible.
4. **Server not responding**: Check that the MCP server process is running and the path in your config is correct.

### Debug Mode

To see detailed logs, you can run the server directly:

```bash
export GITLAB_URL="your-url"
export GITLAB_ACCESS_TOKEN="your-token"
export ATLASSIAN_SITE_NAME="your-atlassian-site-name"
export ATLASSIAN_USER_EMAIL="your-email@example.com"
export ATLASSIAN_API_TOKEN="your-jira-api-token"
mcp-gitlab-jira
```

## Development

For development, clone the repository and install the dependencies.

```bash
npm install
npm run build
```

### Local Docker Development

To test the Docker build locally before pushing:

```bash
# Build and test the Docker image locally
./scripts/build-docker-local.sh
```

This script will build the Docker image and run basic tests to ensure it works correctly.

> **For maintainers**: See [Docker Setup Guide](docs/DOCKER_SETUP.md) for information about setting up automated Docker Hub publishing.

### Project Structure

- `src/index.ts`: Main MCP server implementation
- `src/gitlab.service.ts`: GitLab API client
- `src/gitlab.ts`: GitLab type definitions
- `src/jira.service.ts`: Jira API client
- `src/jira.ts`: Jira type definitions
- `dist/`: Compiled JavaScript output

### Adding New Features

1. Add new methods to the `GitLabService` or `JiraService` class.
2. Define new tools in the `allTools` array in `index.ts`.
3. Add a corresponding case in the tool handler in `index.ts`.
4. Rebuild with `npm run build`.

## License

ISC
