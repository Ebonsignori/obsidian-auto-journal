---
mode: agent
---
This project is an Obsidian plugin that runs on the Obsidian Application.

It is written in TypeScript and uses the Obsidian API.

The reference for the Obsidian API can be found in the `reference` directory of this repository.

The most useful references will be the `TypeScript API` in the `reference` directory.

## Projet overview

The core [Daily notes](https://help.obsidian.md/Plugins/Daily+notes) plugin for [Obsidian](https://obsidian.md/) doesn't backfill notes for the days when Obsidian wasn't opened. This plugin does.

It uses an opinionated folder structure that isn't configurable:

-   **Daily Notes**: `ROOT / YEAR / MONTH / DAY -`
-   **Monthly Notes**: `ROOT / YEAR / {custom-name} / MONTH -`

You can customize the date format of `YEAR`, `MONTH`, `DAY`, or set/remove the `ROOT`, but this plugin depends on organizing the filesystem by `YEAR`/`MONTH`/`DAY`.

The base of the filename in each folder should not be changed, e.g. `DAY -` for Daily Notes or `MONTH -` for Monthly Notes.

For instance, by default Daily Notes will be created like so,

`Journal/2023/August/11 -`

You can add whatever you'd like after the title,

`Journal/2023/August/11 - Work, Dog Park, Climb with Friends & Grab Dinner`

But make sure not to change the day part of the title, `11 -`

## Backfilling

When enabled, backfilling will create notes for previous days of the month/year when you didn't open the plugin.

For Daily Notes:

-   `For year` backfill will create a folder for each month before today and a note with the day prefix, e.g. `11 -` for each day of the month before today
-   `For month` backfill will create a note with the day prefix, e.g. `11 -` for each day of the month before today

For Monthly Notes:

-   `For year` backfill will a note each month before today month prefix, e.g. `January -` for each month of the year before this month

## Templating

You can include a configurable token (default `{{auto-journal-date}}`) in a template to be replaced by the date that the file would have been created in a backfill rather than the date it was actually created on.

By default, all variables from the [core Templates](https://help.obsidian.md/Plugins/Templates) plugin are supported using the settings from the core Templates plugin for date formatting e.g. `{{title}}`, `{{date}}`, `{{time}}`

However, `{{date}}` and `{{time}}` will use the day that you opened Obsidian and Auto Journal ran to create note files on, rather than the date that a backfilled note would have if it was created on the date the note represents. 

## Commands

Opening:
- Today's daily/monthly note 
- The next/previous from today (if running a command from a non-note file)
- The next/previous from the current note (if running a command from a note file)

can be done via the command prompt with the following `Auto Journal: ` commands:

-   `Open today's daily note`
-   `Open next daily note`
-   `Open previous daily note`
-   `Open today's monthly note`
-   `Open next monthly note`
-   `Open previous monthly note`

You can assign hotkeys to any of these commands in the native Obsidian `Settings` -> `Hotkeys` tab.

## Navigation buttons

You can add buttons to navigate to the next, previous or today's daily/monthly note via an `auto-journal-navigation` code block.

Inside the codeblock include the `type` of the button followed by a colon (`:`) and the button text you want it to display, like `today-daily: Today's note`.

For previous and next buttons in your daily notes, you could add the following code block:

````
```auto-journal-navigation
previous-daily: Previous Note
next-daily: Next note
```
````

and they'd look something like this,

![](./docs/assets/prev-next-buttons.png)

The following button `type`s are supported:

-   `today-daily`
-   `previous-daily`
-   `next-daily`
-   `today-monthly`
-   `previous-monthly`
-   `next-monthly`

You can add CSS to the following classes to change the styling and/or positions of the buttons,

-   `auto-journal-navigation-container` for the containing `<div>`
-   `auto-journal-navigation-button` for all the `<button>`s
-   `auto-journal-daily` for all the `daily` type buttons
-   `auto-journal-monthly` for all the `monthly` type buttons
-   `auto-journal-today` for all the `today` type buttons
-   `auto-journal-next` for all the `next` type buttons
-   `auto-journal-previous` for all the `previous` type buttons

Or you can adjust the CSS of a specific button using the button's `id` which is the same as its type. For instance a `next-daily` button has the id that can be accessed in CSS via `#next-daily`