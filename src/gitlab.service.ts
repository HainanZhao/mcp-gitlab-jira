import { Gitlab } from '@gitbeaker/node';
import {
  GitLabConfig,
  GitLabMRDetails,
  GitLabProject,
  GitLabMergeRequest,
  GitLabPosition,
  parseGitLabMergeRequestUrl,
} from './gitlab.js';
import { parseDiff, ParsedHunk } from './utils.js';

export class GitLabService {
  private readonly config: GitLabConfig;
  private readonly api: InstanceType<typeof Gitlab>;
  private projectCache: { data: GitLabProject[]; timestamp: number } | null =
    null;
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(config: GitLabConfig) {
    this.config = config;
    this.api = new Gitlab({
      host: this.config.url,
      token: this.config.accessToken,
    });
  }

  // Phase 2: Basic Features Implementation will go here
  // 1. Fetch Merge Request Details
  async getMergeRequestDetails(
    projectPath: string,
    mrIid: number,
  ): Promise<GitLabMRDetails> {
    const project = await this.api.Projects.show(projectPath);
    const mrDetails = await this.api.MergeRequests.show(project.id, mrIid);
    const mrChanges = await this.api.MergeRequests.changes(project.id, mrIid);

    // Safely handle changes with null check
    const changes = mrChanges.changes || [];
    
    // Map file diffs
    const fileDiffs = changes.map((change: any) => ({
      old_path: change.old_path,
      new_path: change.new_path,
      new_file: change.new_file,
      deleted_file: change.deleted_file,
      renamed_file: change.renamed_file,
      diff: change.diff,
    }));

    const parsedDiffs = fileDiffs.map((diff: any) => ({
      filePath: diff.new_path,
      oldPath: diff.old_path,
      isNew: diff.new_file,
      isDeleted: diff.deleted_file,
      isRenamed: diff.renamed_file,
      hunks: parseDiff(diff.diff),
    }));

    // Type assertions for GitBeaker response
    const mrData = mrDetails as any;
    const diffRefs = mrData.diff_refs as any;
    const author = mrData.author as any;

    return {
      projectPath: mrData.path_with_namespace as string,
      mrIid: mrData.iid.toString(),
      projectId: mrData.project_id as number,
      title: mrData.title as string,
      authorName: author.name as string,
      webUrl: mrData.web_url as string,
      sourceBranch: mrData.source_branch as string,
      targetBranch: mrData.target_branch as string,
      base_sha: diffRefs.base_sha as string,
      start_sha: diffRefs.start_sha as string,
      head_sha: diffRefs.head_sha as string,
      fileDiffs: fileDiffs,
      diffForPrompt: fileDiffs.map((diff: any) => diff.diff).join('\n'),
      parsedDiffs: parsedDiffs,
      fileContents: new Map(), // fileContents will be populated by a separate tool
      discussions: [], // Discussions will be fetched by a separate tool
      existingFeedback: [], // Existing feedback will be derived from discussions
    };
  }

  // Convenience method to get MR details from URL
  async getMergeRequestDetailsFromUrl(mrUrl: string): Promise<GitLabMRDetails> {
    const { projectPath, mrIid } = parseGitLabMergeRequestUrl(mrUrl);
    return this.getMergeRequestDetails(projectPath, mrIid);
  }

  // New tool: Get Merge Request Discussions
  async getMergeRequestDiscussions(
    projectPath: string,
    mrIid: number,
  ): Promise<any[]> {
    const project = await this.api.Projects.show(projectPath);
    const mrDiscussions = await this.api.MergeRequestDiscussions.all(
      project.id,
      mrIid,
    );

    // Map discussions
    const discussions = mrDiscussions.map((discussion: any) => ({
      id: discussion.id,
      notes: discussion.notes.map((note: any) => ({
        id: note.id,
        body: note.body,
        author: {
          name: note.author.name,
          username: note.author.username,
        },
        system: note.system,
        position: note.position
          ? {
              base_sha: note.position.base_sha,
              start_sha: note.position.start_sha,
              head_sha: note.position.head_sha,
              position_type: note.position.position_type,
              old_path: note.position.old_path,
              new_path: note.position.new_path,
              new_line: note.position.new_line,
              old_line: note.position.old_line,
            }
          : undefined,
      })),
      postedAsInline: discussion.individual_note, // Assuming individual_note means inline
    }));
    return discussions;
  }

  // Convenience method to get MR discussions from URL
  async getMergeRequestDiscussionsFromUrl(mrUrl: string): Promise<any[]> {
    const { projectPath, mrIid } = parseGitLabMergeRequestUrl(mrUrl);
    return this.getMergeRequestDiscussions(projectPath, mrIid);
  }

  // New tool: Get File Content
  async getFileContent(
    projectPath: string,
    filePath: string,
    sha: string,
  ): Promise<string> {
    const project = await this.api.Projects.show(projectPath);
    const content = await this.api.RepositoryFiles.showRaw(
      project.id,
      filePath,
      { ref: sha },
    );
    return content as string;
  }

  // Convenience method to get file content from MR URL and file path/SHA
  async getFileContentFromMrUrl(
    mrUrl: string,
    filePath: string,
    sha: string,
  ): Promise<string> {
    const { projectPath } = parseGitLabMergeRequestUrl(mrUrl);
    return this.getFileContent(projectPath, filePath, sha);
  }

  // 2. Add Comment to Merge Request
  async addCommentToMergeRequest(
    projectPath: string,
    mrIid: number,
    discussionId: string | undefined,
    commentBody: string,
    position: GitLabPosition | undefined,
  ): Promise<any> {
    const project = await this.api.Projects.show(projectPath);

    if (discussionId) {
      // Reply to an existing discussion - use Notes.create for adding to existing discussion
      return this.api.MergeRequestNotes.create(
        project.id,
        mrIid,
        commentBody,
        {
          discussion_id: discussionId,
        },
      );
    } else if (position) {
      // Add a new comment with a position (inline comment)
      return this.api.MergeRequestNotes.create(project.id, mrIid, commentBody, {
        position: {
          base_sha: position.base_sha,
          start_sha: position.start_sha,
          head_sha: position.head_sha,
          position_type: position.position_type,
          old_path: position.old_path,
          new_path: position.new_path,
          new_line: position.new_line,
          old_line: position.old_line,
        },
      });
    } else {
      // Add a general comment
      return this.api.MergeRequestNotes.create(project.id, mrIid, commentBody);
    }
  }

  // Convenience method to add comment from MR URL
  async addCommentToMergeRequestFromUrl(
    mrUrl: string,
    commentBody: string,
    discussionId?: string,
    position?: GitLabPosition,
  ): Promise<any> {
    const { projectPath, mrIid } = parseGitLabMergeRequestUrl(mrUrl);
    return this.addCommentToMergeRequest(
      projectPath,
      mrIid,
      discussionId,
      commentBody,
      position,
    );
  }

  // 3. List Projects
  async listProjects(): Promise<GitLabProject[]> {
    if (
      this.projectCache &&
      Date.now() - this.projectCache.timestamp < this.CACHE_DURATION_MS
    ) {
      return this.projectCache.data;
    }

    const projects = await this.api.Projects.all({
      membership: true,
      min_access_level: 30,
      order_by: 'last_activity_at',
      sort: 'desc',
      perPage: 100,
    });

    const simplifiedProjects: GitLabProject[] = projects.map((project) => ({
      id: project.id,
      name: project.name,
      name_with_namespace: project.name_with_namespace,
      path_with_namespace: project.path_with_namespace,
      last_activity_at: project.last_activity_at,
    }));

    this.projectCache = { data: simplifiedProjects, timestamp: Date.now() };
    return simplifiedProjects;
  }

  // 4. List Merge Requests for a Project
  async listMergeRequests(projectPath: string): Promise<GitLabMergeRequest[]> {
    const project = await this.api.Projects.show(projectPath);
    const mrs = await this.api.MergeRequests.all({ projectId: project.id });
    
    // Map to our interface
    return mrs.map((mr: any) => ({
      id: mr.id,
      iid: mr.iid,
      title: mr.title,
      author: {
        name: mr.author.name,
        username: mr.author.username,
      },
      updated_at: mr.updated_at,
      web_url: mr.web_url,
      project_name: mr.project_id,
    }));
  }

  // New tool: Assign Reviewers to Merge Request
  async assignReviewersToMergeRequest(
    projectPath: string,
    mrIid: number,
    reviewerIds: number[],
  ): Promise<any> {
    const project = await this.api.Projects.show(projectPath);
    return this.api.MergeRequests.edit(project.id, mrIid, {
      reviewer_ids: reviewerIds,
    });
  }

  // Convenience method to assign reviewers from MR URL
  async assignReviewersToMergeRequestFromUrl(
    mrUrl: string,
    reviewerIds: number[],
  ): Promise<any> {
    const { projectPath, mrIid } = parseGitLabMergeRequestUrl(mrUrl);
    return this.assignReviewersToMergeRequest(projectPath, mrIid, reviewerIds);
  }

  // New tool: List Project Members (Contributors)
  async listProjectMembers(projectPath: string): Promise<any[]> {
    const project = await this.api.Projects.show(projectPath);
    return this.api.ProjectMembers.all(project.id);
  }

  // Convenience method to list project members from MR URL
  // Convenience method to list project members from MR URL
  async listProjectMembersFromMrUrl(mrUrl: string): Promise<any[]> {
    const { projectPath } = parseGitLabMergeRequestUrl(mrUrl);
    return this.listProjectMembers(projectPath);
  }

  // New tool: List Project Members by Project Name
  async listProjectMembersByProjectName(projectName: string): Promise<any[]> {
    const projects = await this.listProjects();
    const project = projects.find((p) => p.name === projectName);
    if (!project) {
      throw new Error(`Project with name ${projectName} not found.`);
    }
    return this.listProjectMembers(project.path_with_namespace);
  }

  // New tool: Filter Projects by Name (fuzzy, case-insensitive)
  async filterProjectsByName(projectName: string): Promise<GitLabProject[]> {
    const allProjects = await this.listProjects();
    const lowerCaseProjectName = projectName.toLowerCase();

    return allProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(lowerCaseProjectName) ||
        project.name_with_namespace
          .toLowerCase()
          .includes(lowerCaseProjectName),
    );
  }

  // New tool: Get Releases for a Project
  async getReleases(projectPath: string): Promise<any[]> {
    const project = await this.api.Projects.show(projectPath);
    return this.api.Releases.all(project.id);
  }

  // New tool: Filter Releases Since a Specific Version
  async filterReleasesSinceVersion(
    projectPath: string,
    sinceVersion: string,
  ): Promise<any[]> {
    const allReleases = await this.getReleases(projectPath);
    const semver = await import('semver');

    return allReleases.filter((release) => {
      try {
        return semver.gte(release.tag_name, sinceVersion);
      } catch (error) {
        console.warn(
          `Could not parse version ${release.tag_name} or ${sinceVersion}: ${error}`,
        );
        return false;
      }
    });
  }

  // New tool: Get User ID by Username
  async getUserIdByUsername(username: string): Promise<number> {
    const users = await this.api.Users.all({
      username,
      perPage: 100,
    });

    if (users.length === 0) {
      throw new Error(`User with username '${username}' not found.`);
    }

    if (users.length > 1) {
      const userList = users
        .map((user) => `${user.username} (${user.name})`)
        .join(', ');
      throw new Error(
        `Multiple users found matching '${username}': ${userList}. Please be more specific.`,
      );
    }

    return users[0].id;
  }

  // New tool: Get User Activities
  async getUserActivities(userId: number, sinceDate?: Date): Promise<any[]> {
    return this.api.Users.events(userId, {
      after: sinceDate ? sinceDate.toISOString().split('T')[0] : undefined,
    });
  }
}
