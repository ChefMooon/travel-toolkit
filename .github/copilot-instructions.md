# GitHub Copilot Instructions

## Release Versioning

When the `update-changelog` skill saves a dated release entry, run these project
skills in order as part of the same release workflow. Do not ask whether to run
them:

1. Run `.github/skills/update-package-version/SKILL.md` to synchronize
   `package.json` and `package-lock.json` with the saved changelog entry. Wait
   for this skill to complete before continuing. If it reports an error or
   needs the user's input, resolve that first.
2. Run `.github/skills/changelog-to-blog/SKILL.md` to create the release blog
   post from the saved changelog entry. Follow its instructions, including
   asking for any required publication details.

Run neither follow-up if the changelog entry was not saved. Do not skip either
follow-up after a successful save.
