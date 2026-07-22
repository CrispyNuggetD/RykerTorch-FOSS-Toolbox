# RykerTorch FOSS Toolbox

A growing collection of useful open-source tools, experiments, learning materials, and reusable resources.

This repository is built around a **FOSS mindset**: solve practical problems, explain how the solution works, make the result inspectable, and let other people learn from it, improve it, or adapt it for their own needs.

## What belongs here?

The repository may contain:

- **Shell scripts** for automation, productivity, file handling, development workflows, and everyday computing.
- **Web apps and small interactive tools** that are useful without requiring a large platform or proprietary service.
- **Open-source experiments and prototypes** that may later grow into larger projects.
- **Lectures, tutorials, and technical write-ups** that explain concepts or document things I have learned.
- **Pictures, diagrams, and visual resources** released for reuse where licensing permits.
- **Reference material and curated resources** that may help other learners, developers, researchers, or FOSS contributors.

The goal is not merely to collect files. Each substantial project should have enough documentation for an interested person to understand:

1. what it does;
2. why it exists;
3. how to use it;
4. how it works;
5. what its limitations are; and
6. how to contribute.

## Repository structure

```text
.
├── README.md
├── shell-scripts/
│   └── timestamp-daily-organiser/
│       ├── README.md
│       └── timestamp_daily_organiser.sh
├── web-apps/
├── open-source-projects/
├── lectures/
├── tutorials/
├── resources/
└── visuals/
```

The structure can grow over time. Smaller projects should stay easy to browse, while larger projects can receive their own directory, documentation, examples, tests, and licence information.

## Projects

### Shell scripts

| Project | Description | Status |
|---|---|---|
| [`timestamp_daily_organiser.sh`](./shell-scripts/timestamp-daily-organiser/README.md) | A clipboard-driven POSIX shell daily organiser for structured event tracking, planned durations, elapsed-time filenames, overshoot tracking, goals, notes, and reflections. It records event start times, planned durations, planned end times, signed overshoot, cumulative daily overshoot, goals, notes, and reflections without requiring a database or hidden state file. | Experimental / actively tested |

More scripts will be added here with a short summary. Each script's directory contains its full documentation, examples, platform notes, and known limitations.

### Web apps

Small browser-based utilities and experiments will be listed here as they are added.

### Lectures and tutorials

Educational material will be organised by subject, with source files and references included where practical.

### Resources and visuals

Reusable diagrams, images, templates, notes, and curated materials will include clear attribution and licensing information whenever required.

## FOSS principles

Projects in this repository aim to follow a few practical principles:

- **Readable before clever:** code should be understandable by the people expected to maintain or learn from it.
- **Human control:** tools should expose their state and behaviour rather than hiding everything behind an opaque service.
- **Portability where practical:** avoid unnecessary dependencies and document platform-specific behaviour honestly.
- **Useful documentation:** explain the purpose and workflow, not only the command syntax.
- **Open improvement:** bug reports, patches, alternative implementations, tests, documentation fixes, and design discussion are welcome.
- **Honest limitations:** experimental software should say what has and has not been tested.

## Bugs and feedback

Found a bug, confusing behaviour, incorrect documentation, or a platform incompatibility?

Please open an issue in this repository or contact me through the profile hosting it. Include:

- the relevant script or resource;
- your operating system and shell;
- the command you ran;
- the output or error;
- what you expected to happen; and
- any manual edits you made before the problem occurred.

Small reproducible examples are extremely helpful.

## Contributions

Contributions are welcome, including:

- bug fixes;
- portability improvements;
- tests;
- documentation corrections;
- accessibility improvements;
- translations;
- feature proposals;
- examples and tutorials; and
- constructive code review.

Before making a large change, open an issue or discussion so the intended behaviour can be agreed upon first.

## FOSS commissioning

I am also available for **commissioned FOSS work**.

That can include custom shell utilities, automation, small web tools, prototypes, documentation, tutorials, educational resources, or improvements to an existing open-source project. A FOSS commission means development is funded for a specific need while the resulting work is released under an agreed open-source licence whenever the project permits it.

Contact me through the profile associated with this repository with:

- the problem to solve;
- the intended users and platforms;
- required features;
- preferred licence;
- expected timeline; and
- whether the result should become part of this repository or live in its own project.

## Licensing

This repository is intended for open-source release, but each project or resource should clearly state its applicable licence.

Before publishing the repository, add a top-level `LICENSE` file and ensure that third-party images, code, data, quotations, and other resources are compatible with that licence. Individual subprojects may use a different licence when clearly documented.

## Project status

This is a growing workshop rather than a finished product catalogue. Some items may be polished and stable; others may be experiments, learning projects, or early prototypes. Check each project's README for its current status and known limitations.
