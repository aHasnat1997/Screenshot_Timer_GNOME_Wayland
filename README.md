# Screenshot Timer

Automatically save desktop screenshots on a schedule in a GNOME Wayland session.

The tool captures the screen through the GNOME desktop portal, so it works with
Wayland's screen-capture permissions rather than relying on X11-only tools.

## Requirements

- Linux with a GNOME Wayland desktop session
- [Bun](https://bun.sh/)
- GJS (`gjs`), normally included with GNOME
- A running `xdg-desktop-portal` service

Run the command from a terminal opened inside your graphical GNOME session.
It will not work from SSH, a TTY, or a session without desktop access.

## Install

```bash
bun install
```

## Usage

```bash
bun run index.ts <interval_minutes> <total_duration_minutes>
```

For example, capture every minute for three minutes:

```bash
bun run index.ts 1 3
```

The included shortcut runs every two minutes for three minutes:

```bash
bun run shot
```

Both values may be decimal numbers. For example, `0.5 5` captures every
30 seconds for five minutes.

## Capture timing

A screenshot is taken immediately when the program starts, at each interval
strictly before the end time, and once more at the exact end of the duration.

For `bun run index.ts 1 3`, screenshots are captured at approximately:

| Time      | Capture                                  |
| --------- | ---------------------------------------- |
| 0 minutes | Initial screenshot                       |
| 1 minute  | Interval screenshot                      |
| 2 minutes | Interval screenshot                      |
| 3 minutes | Final screenshot, then the program stops |

Screenshots are queued so a delayed portal request cannot overlap a later one.

## Output

Images are PNG files saved in:

```text
screen-short/
```

The directory is created automatically in the directory where you run the
command. File names include a sequence number and UTC timestamp, for example:

```text
screen-short-1-2026-10-10T03-58-59-138Z.png
```

## Validation

Check the TypeScript project configuration with:

```bash
bun run typecheck
```

## Troubleshooting

### `Timed out waiting for the desktop portal response`

Make sure you launched the command from your logged-in GNOME desktop terminal.
Do not run it over SSH or with `sudo`, because those environments do not have
access to your graphical session's D-Bus portal.

### `gjs: command not found`

Install the GJS package using your distribution's package manager, then run the
command again.

Debian or Ubuntu:

```bash
sudo apt install gjs
```

Fedora:

```bash
sudo dnf install gjs
```

Arch Linux:

```bash
sudo pacman -S gjs
```

### Stop early

Press `Ctrl+C` in the terminal to stop the timer before its planned end time.
