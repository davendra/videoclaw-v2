# Deprecation Plan

This document defines the deprecation path from old `videoclaw` workflows to `vclaw-video-core`.

## Goal

Make `vclaw-video-core` the primary execution surface without pretending the legacy repo never existed.

## Current decision

Primary:

1. `vclaw-video-core`

Reference/fallback only:

1. `videoclaw`

## Deprecation boundaries

What should stop growing in the old repo:

1. new user-facing workflow surfaces
2. new canonical artifact contracts
3. new reporting layers
4. new migration-target state models

What can still be consulted in the old repo:

1. legacy scripts
2. older provider behaviors
3. reference patterns not yet ported

## Cutover criteria

The clean repo is considered the primary product surface once these are true:

1. provider status works
2. produce / execute-status works
3. clone-execute works
4. template and prompt-library surfaces exist
5. migration docs exist
6. core tests are green

Those conditions are now satisfied.

## Remaining non-blocking work

1. richer provider-specific options
2. better automatic prompt guidance during execution
3. operator education and release communication

## Operational policy

When a user asks to create or run video work:

1. prefer `vclaw-video-core`
2. use `videoclaw` only when the missing feature is clearly identified
3. track every such fallback as a porting task

## Suggested release language

Use this internal framing:

1. `vclaw-video-core` is now the recommended runtime
2. `omx` remains available only as a temporary CLI alias for `vclaw`
3. `videoclaw` remains available as a migration/reference source
4. old workflows should not be expanded further unless they are being ported

## Sunset rule

Do not archive or delete the old repo until:

1. migration of active operators is complete
2. no critical workflow depends exclusively on the old runtime
3. the clean repo has been stable through multiple real runs
