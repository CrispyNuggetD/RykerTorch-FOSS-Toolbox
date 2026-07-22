# `timestamp_daily_organiser.sh`

A clipboard-driven POSIX shell daily organiser for two related tasks:

1. creating compact elapsed-time strings suitable for filenames; and
2. maintaining a human-readable sequence of planned events, actual durations, overshoot, goals, notes, and reflections.

The script treats the **clipboard text itself as the event state**. It does not require Python, a database, a hidden metadata file, or a persistent background process.

> **Project status:** Experimental and actively tested, especially in a-Shell on iOS/iPadOS. Please report bugs and platform-specific behaviour.

[Back to the repository overview](../../README.md)

## Why might this be useful?

Many time trackers store information in an application-specific database. That is convenient, but it can make the record harder to inspect, edit, copy into notes, or preserve independently of the original application.

This script takes a deliberately different approach:

- the state is plain text;
- the current event template is visible;
- the user may manually edit goals, plans, notes, and reflections;
- the next invocation reads the edited text from the clipboard;
- the completed event is summarised;
- the event counter is incremented;
- signed overshoot is calculated; and
- the next template is printed and copied back to the clipboard.

This can be useful for:

- timeboxing work or study sessions;
- executive-function support;
- logging transitions between activities;
- comparing planned and actual durations;
- maintaining a lightweight daily work narrative;
- creating copy-pasteable records for journals or project notes;
- recording why an event took longer or finished earlier;
- generating filenames that visibly contain start time, end time, timezone, and elapsed duration.

## Design philosophy

The script aims to keep its state:

- **human-readable** rather than encoded;
- **manually editable** rather than locked behind a UI;
- **portable** rather than tied to Python or a large runtime;
- **ephemeral** rather than dependent on a hidden state file; and
- **easy to archive** by pasting completed entries into any text file or notes application.

The fixed field labels are effectively the script's interface. The prose beneath them remains yours to edit.

## Requirements

### Common commands

The script uses standard shell utilities such as:

```text
sh
awk
date
grep
sed
tr
uname
printf
```

It is written for POSIX-style `/bin/sh`.

### a-Shell on iOS or iPadOS

The primary mobile target is [a-Shell](https://github.com/holzschu/a-shell), using its built-in:

```text
pbpaste
pbcopy
```

The script passes generated text directly to a-Shell's `pbcopy` command. This avoids a known blocking behaviour encountered when `pbcopy` reads multiline content from standard input inside a shell script.

### Linux

Linux requires one of:

```text
wl-paste
wl-copy
```

from `wl-clipboard`, or:

```text
xclip
```

for X11 clipboard access.

Examples:

```sh
sudo apt install wl-clipboard
```

or:

```sh
sudo apt install xclip
```

### Standard macOS Terminal

The current Darwin clipboard-writing path is optimised for **a-Shell**, whose `pbcopy` accepts text as command arguments.

Standard macOS `pbcopy` normally expects input through standard input, so native macOS Terminal compatibility is **not yet confirmed** for this version. A small platform-specific adjustment may be required. Please report successful tests or failures.

## Installation

Place the script somewhere convenient:

```sh
mv timestamp_daily_organiser.sh ~/Documents/
chmod +x ~/Documents/timestamp_daily_organiser.sh
```

Run it from that directory:

```sh
cd ~/Documents
./timestamp_daily_organiser.sh help
```

It may also be placed in a directory included in `PATH`.

## Command summary

```text
./timestamp_daily_organiser.sh
./timestamp_daily_organiser.sh [UTC_OFFSET]
./timestamp_daily_organiser.sh [UTC_OFFSET] "NEXT EVENT" [DURATION]
```

Help:

```sh
./timestamp_daily_organiser.sh help
./timestamp_daily_organiser.sh -h
./timestamp_daily_organiser.sh --help
```

## Mode 1: quick elapsed-time filename

Run the script without an event title:

```sh
./timestamp_daily_organiser.sh
```

When the clipboard does not contain a recognised start timestamp, the script prints and copies a value such as:

```text
20260722(Wed)124344+0800
```

Run the same command later:

```sh
./timestamp_daily_organiser.sh
```

The script reads that timestamp from the clipboard and produces:

```text
20260722(Wed)_124344-124353_+0800_[09S]
```

This string contains:

- date and weekday;
- start time;
- end time;
- UTC offset; and
- elapsed duration.

It can be pasted directly into a filename, note, screenshot name, experiment record, or work log.

### Cross-day intervals

When an interval crosses a date or timezone boundary, the output includes both full endpoints rather than pretending they occurred on the same day.

Elapsed durations are calculated from epoch seconds, so durations may exceed 24 hours.

## Mode 2: event tracking

Start an event by supplying a title:

```sh
./timestamp_daily_organiser.sh "Write documentation"
```

Add a planned duration:

```sh
./timestamp_daily_organiser.sh "Write documentation" 30
```

A bare integer means **minutes**, so `30` means 30 minutes.

The script prints and copies a template like:

```text
Events completed: 0
Previous event: N/A
Previous event planned duration: N/A
Previous event planned end time: N/A
Previous event overshoot: N/A
Cumulative overshoot today: 00S

=============================================================

Event Number: 1
Current event: Write documentation
Current event started at: 20260722(Wed)124344+0800
Current event planned duration: 30
Current event planned end time: 131344

A. Event to-do's/goals:

1.
2.
3.

B. Event planning/what or how to achieve goals:
-

C. Event notes:
-

D. Event summary/reflection:
-
```

You may paste this into a text editor, fill in the sections, and copy the complete edited template again before starting the next event.

Start the next event:

```sh
./timestamp_daily_organiser.sh "Review documentation" 20
```

The script then:

1. reads the current template from the clipboard;
2. calculates the actual duration of the previous event;
3. moves the previous title into the summary;
4. records its planned duration and planned end time;
5. calculates signed overshoot;
6. updates cumulative daily overshoot;
7. increments `Event Number`;
8. creates the next event template;
9. prints the result; and
10. copies the result to the clipboard.

## Duration input

Supported forms include:

```text
15
10m
1h30m
1h2m3s
45s
1H30M
```

Meaning:

| Input | Interpretation |
|---|---:|
| `15` | 15 minutes |
| `10m` | 10 minutes |
| `1h30m` | 1 hour 30 minutes |
| `1h2m3s` | 1 hour 2 minutes 3 seconds |
| `45s` | 45 seconds |
| `1H30M` | 1 hour 30 minutes |

Uppercase and lowercase unit letters are accepted.

Leading-zero values such as `09`, `09m`, and `01H09M08S` are normalised as decimal values rather than being interpreted as invalid octal numbers by the shell.

## Timezone selection

Omit a timezone argument to use the system's configured timezone:

```sh
./timestamp_daily_organiser.sh "Local event" 20
```

Supply an integer UTC offset before the event title:

```sh
./timestamp_daily_organiser.sh 8 "Singapore event" 20
./timestamp_daily_organiser.sh 0 "UTC event" 20
./timestamp_daily_organiser.sh -1 "UTC minus one event" 20
```

Accepted offsets range from `-14` to `14`.

The same optional offset may be used in quick-timer mode:

```sh
./timestamp_daily_organiser.sh 0
```

## Event titles and quotation marks

The shell normally requires quotation marks around titles containing spaces:

```sh
./timestamp_daily_organiser.sh "Write the README" 30
```

Those shell quotation marks are not part of the argument and therefore do not appear in the title.

The script also removes one matching pair of outer quotation marks when the title itself contains them, including:

```text
"Title"
'Title'
“Title”
‘Title’
```

Internal quotation marks remain unchanged.

## Planned duration and manually edited planned end time

The script supports two ways of determining the previous event's plan.

### Preferred: planned duration

```text
Current event planned duration: 30
Current event planned end time: 131344
```

When `Current event planned duration:` contains a valid duration, that value takes precedence.

### Fallback: planned end time

You may leave the duration blank and manually enter an end time:

```text
Current event started at: 20260722(Wed)073000+0800
Current event planned duration:
Current event planned end time: 120000
```

On the next invocation, the script derives a planned duration of 4 hours 30 minutes and calculates overshoot relative to noon.

A six-digit planned end time must use:

```text
HHMMSS
```

Examples:

```text
090000
120000
235959
```

When the planned end clock is earlier than the start clock, the script treats it as occurring on the following day.

## Overshoot

Overshoot is:

```text
actual duration - planned duration
```

A positive value means the event took longer than planned:

```text
Previous event overshoot: 12M08S
```

A negative value means the event finished earlier than planned:

```text
Previous event overshoot: -09M51S
```

For example:

```text
Planned: 10 minutes
Actual: 9 seconds
Overshoot: -09M51S
```

## Cumulative overshoot today

The script adds each signed overshoot to the prior cumulative value.

Example:

```text
Previous cumulative: -09M51S
New event overshoot: 04M00S
New cumulative: -05M51S
```

Negative and positive values therefore cancel naturally.

The carried cumulative total resets when the prior event's start date differs from the current date.

For the first completed event, the individual overshoot and cumulative overshoot will naturally be identical.

## Output duration format

Generated durations suppress unnecessary leading units:

```text
05S
03M06S
02H03M06S
-14M09S
```

Hours may exceed 24 for long-running intervals.

## Clipboard template contract

The script recognises these fixed labels:

```text
Event Number:
Current event:
Current event started at:
Current event planned duration:
Current event planned end time:
Cumulative overshoot today:
```

You may freely edit the content after each label and all text in sections A–D.

For reliable parsing:

- keep the fixed labels unchanged;
- keep each fixed field on one line;
- retain `Current event planned end time:` even when blank;
- copy the complete template before running the next event; and
- use the timestamp format generated by the script.

Changing or removing a fixed label may cause the clipboard to be treated as a new event sequence.

## Suggested workflow

1. Start an event:

   ```sh
   ./timestamp_daily_organiser.sh "Implement parser" 45
   ```

2. Paste the generated template into a text editor.

3. Fill in goals and planning.

4. During or after the event, add notes and a reflection.

5. Copy the complete edited template.

6. Start the next event:

   ```sh
   ./timestamp_daily_organiser.sh "Test parser" 20
   ```

7. Archive the completed output in a daily log, project journal, Git repository, or notes app.

## Example transition

Previous clipboard:

```text
Event Number: 1
Current event: Implement parser
Current event started at: 20260722(Wed)124344+0800
Current event planned duration: 10
Current event planned end time: 125344
Cumulative overshoot today: 00S
```

Next command:

```sh
./timestamp_daily_organiser.sh "Test parser" 1h10m
```

Possible output:

```text
20260722(Wed)_124344-124353_+0800_[09S]

Events completed: 1
Previous event: Implement parser [09S]
Previous event planned duration: 10
Previous event planned end time: 125344
Previous event overshoot: -09M51S
Cumulative overshoot today: -09M51S

=============================================================

Event Number: 2
Current event: Test parser
Current event started at: 20260722(Wed)124353+0800
Current event planned duration: 1h10m
Current event planned end time: 135353
```

## Human-readable state, not hidden metadata

The clipboard template is both:

- the user's editable event record; and
- the script's input state.

There are no hidden tags appended to the text and no sidecar state file. This makes the record portable, but it also means that the fixed labels must remain parseable.

## Privacy

The script does not intentionally send event data over the network. It reads and writes the system clipboard locally.

Clipboard contents may still be visible to:

- the operating system;
- clipboard-history software;
- synchronised clipboard services;
- other applications with clipboard access; or
- device-management systems.

Do not place sensitive information in the template unless that clipboard exposure is acceptable.

## Known limitations

- The project is experimental and has mainly been developed around a-Shell behaviour.
- Native macOS Terminal clipboard writing is not yet confirmed.
- Clipboard implementations differ between platforms.
- The parser depends on fixed English labels.
- It records only the most recent event summary in the active template; long-term history must be archived elsewhere.
- The clipboard is a single shared resource, so copying unrelated content replaces the active state.
- Daylight-saving transitions and unusual historical timezone changes require further testing.
- A planned end time contains only a clock value, so cross-day intent is inferred rather than explicitly dated.
- Concurrent invocations are not supported.
- Event titles containing newline characters are not supported.

## Troubleshooting

### The next event starts at Event 1 again

The clipboard probably does not contain the full prior template, or a required fixed label was edited or removed.

Check for:

```text
Event Number:
Current event:
Current event started at:
Current event planned end time:
```

### Overshoot is `N/A`

Provide either:

- a valid `Current event planned duration:`, or
- a valid six-digit `Current event planned end time:`.

### `Illegal number: 08` or `Illegal number: 09`

Use the latest version. It strips leading zeros before POSIX shell arithmetic.

### The script appears to hang in a-Shell

Use the latest version and report:

- whether output appeared before the hang;
- whether the clipboard was updated;
- whether the command was `help`, first event, or later event;
- the exact clipboard template; and
- your a-Shell and iOS/iPadOS versions.

### Linux reports a missing clipboard tool

Install either `wl-clipboard` or `xclip`.

## Bug reports

Please open an issue in the repository or contact me through the profile hosting it.

Include:

```text
Platform:
Operating-system version:
Shell:
Script version or commit:
Command:
Clipboard input:
Terminal output:
Expected behaviour:
Actual behaviour:
```

Remove personal or sensitive information before posting clipboard contents publicly.

## Contributions

Useful contributions include:

- a-Shell testing;
- standard macOS support;
- Linux desktop testing;
- BSD compatibility;
- automated shell tests;
- safer clipboard handling;
- localisation;
- parser improvements;
- documentation corrections; and
- alternative human-readable templates.

## FOSS commissioning

I am available for commissioned FOSS work, including adaptations of this script, related productivity tools, shell automation, documentation, or small open-source utilities.

A commission can fund development for a specific workflow while allowing the result to be released under an agreed open-source licence.

## Licence

This project is intended to be released as FOSS. Add a `LICENSE` file before public release and state the chosen licence here. Until then, the intended openness is clear, but legal reuse permissions are not yet formally specified.
