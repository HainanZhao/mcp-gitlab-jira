# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-08-01

### Fixed
- Corrected a module resolution issue by adding the `.js` extension to the import statement in `src/jira.service.ts`.
- Addressed an issue where JQL queries were not returning responses.
- Resolved a problem with the transition logic in Jira.

### Added
- Implemented functionality to update standard and custom fields in Jira tickets.
- Expanded the available Jira tools with more options.
- Added more detailed information to the README.


## [0.1.1] - 2025-08-01

### Added
- Implemented some basic functions for gitlab and jira. e.g. get request details, add comments to MR. get ticket details, add comment etc.
