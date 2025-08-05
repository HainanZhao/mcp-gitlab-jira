import { ParsedHunk } from './utils.js';

/**
 * Shared types for GitLab integration
 */

export interface GitLabConfig {
  url: string;
  accessToken: string;
}

export interface GitLabPosition {
  base_sha: string;
  start_sha: string;
  head_sha: string;
  position_type: 'text';
  old_path: string;
  new_path: string;
  new_line?: number;
  old_line?: number;
}

export interface FileDiff {
  old_path: string;
  new_path: string;
  new_file: boolean;
  deleted_file: boolean;
  renamed_file: boolean;
  diff: string;
}

export enum Severity {
  Critical = 'Critical',
  Warning = 'Warning',
  Suggestion = 'Suggestion',
  Info = 'Info',
}

export interface ReviewFeedback {
  id: string;
  lineNumber: number;
  filePath: string;
  severity: Severity;
  title: string;
  description: string;
  lineContent: string;
  position: GitLabPosition | null;
  status: 'pending' | 'submitted' | 'submitting' | 'error';
  isExisting?: boolean;
  isEditing?: boolean;
  isIgnored?: boolean;
  isNewlyAdded?: boolean;
  submissionError?: string;
}

export interface ParsedFileDiff {
  filePath: string;
  oldPath: string;
  isNew: boolean;
  isDeleted: boolean;
  isRenamed: boolean;
  hunks: ParsedHunk[];
}

export interface GitLabNote {
  id: number;
  body: string;
  author: {
    name?: string;
    username: string;
  };
  system: boolean;
  position?: GitLabPosition;
}

export interface GitLabDiscussion {
  id: string;
  notes: GitLabNote[];
  // Custom field to track how the comment was posted (inline vs general fallback)
  postedAsInline?: boolean;
}

export interface GitLabMRDetails {
  projectPath: string;
  mrIid: string;
  projectId: number;
  title: string;
  authorName: string;
  webUrl: string;
  sourceBranch: string;
  targetBranch: string;
  base_sha: string;
  start_sha: string;
  head_sha: string;
  fileDiffs: FileDiff[];
  diffForPrompt: string;
  parsedDiffs: ParsedFileDiff[];
  fileContents: Map<string, { oldContent?: string[]; newContent?: string[] }>;
  discussions: GitLabDiscussion[];
  existingFeedback: ReviewFeedback[];
  approvals?: {
    approved_by: Array<{ user: { name: string; username: string } }>;
    approvals_left: number;
    approvals_required: number;
  };
}

export interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path_with_namespace: string;
  last_activity_at: string;
  ssh_url_to_repo?: string;
  http_url_to_repo?: string;
  web_url?: string;
  readme_url?: string;
  issue_branch_template?: string;
  statistics?: any;
  _links?: any;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  author: {
    name: string;
    username: string;
  };
  updated_at: string;
  web_url: string;
  project_name?: string;
}

export interface GitLabRelease {
  tag_name: string;
  name: string;
  description: string;
  created_at: string;
  released_at: string;
  // Add other relevant fields as needed
}

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  state: string;
  avatar_url: string;
  web_url: string;
}

export function parseGitLabMergeRequestUrl(url: string): {
  projectPath: string;
  mrIid: number;
} {
  try {
    const parsedUrl = new URL(url);
    // Example: https://gitlab.com/group/subgroup/project/-/merge_requests/123
    // Pathname: /group/subgroup/project/-/merge_requests/123
    const pathParts = parsedUrl.pathname.split('/');
    // Find the index of '-/merge_requests'
    const mrIndex = pathParts.indexOf('-') + 1; // Should be index of 'merge_requests'
    if (mrIndex === -1 || pathParts[mrIndex] !== 'merge_requests') {
      throw new Error('Invalid GitLab MR URL format: merge_requests segment not found');
    }

    // Project path is everything before '-/merge_requests' joined by '/'
    const projectPath = pathParts.slice(1, mrIndex - 1).join('/');
    const mrIid = parseInt(pathParts[mrIndex + 1], 10);

    if (isNaN(mrIid)) {
      throw new Error(`Could not parse MR IID from URL: ${url}`);
    }

    return { projectPath, mrIid };
  } catch (error) {
    throw new Error(
      `Failed to parse GitLab MR URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
