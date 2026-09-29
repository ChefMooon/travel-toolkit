---
name: update-package-version
description: 'Update Travel Toolkit package.json and package-lock.json to match the newest dated release in CHANGELOG.md. Use immediately after the update-changelog skill has saved a release entry, or when asked to synchronize the package version with the changelog.'
---

# Update Package Version

Synchronize the root npm package version with the newest dated release entry
after the changelog has been updated.

## When to Use

Run this skill immediately after the `update-changelog` skill confirms that it
has saved the changelog. Do not update package metadata before the changelog
write is complete.

## Workflow

1. Confirm that `CHANGELOG.md` exists at the repository root and contains a
   newly saved release entry. Read the newest dated version heading matching
   `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`; ignore any `Unreleased` section.
   Validate that the version is valid `MAJOR.MINOR.PATCH` SemVer. If the
   changelog is missing, has no dated release, or has an invalid version, stop
   and ask for clarification rather than guessing.
2. Read the root `package.json` and `package-lock.json`. Confirm that the
   package name in both files is `travel-toolkit` and that the lockfile has a
   root package entry at `packages[""]`. Treat the changelog release version
   as the target; do not calculate another bump or infer a version from Git.
3. Compare the target with the current `package.json` version:
   - If they match, make no changes and report that the package is already in
     sync.
   - If the target is lower than the current version, stop and ask whether to
     proceed; do not silently downgrade.
   - Otherwise, update the package version to the exact changelog version.
4. Use npm's version command to keep the manifest and lockfile synchronized
   without creating a Git tag or running lifecycle scripts:

   ```sh
   npm version MAJOR.MINOR.PATCH --no-git-tag-version --ignore-scripts
   ```

   Replace `MAJOR.MINOR.PATCH` with the validated changelog version. Do not
   commit the changes.
5. Verify that `package.json` has the target `version`, `package-lock.json`
   has the target top-level `version`, and `package-lock.json` has the target
   `packages[""].version`. If any value does not match or npm reports an
   error, report the failure explicitly and do not claim success.
6. Report the version synchronized and list the manifest and lockfile updated.

## Scope

Only synchronize the npm package version from the newest saved release entry.
Do not edit the changelog, create a release entry, update blog posts, or alter
dependencies.
