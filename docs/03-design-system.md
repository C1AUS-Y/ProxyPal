# Design system

## How it's built

I used Tailwind CSS. The five colours are set in `client/src/styles.css` and every screen uses them by name, so changing a colour in that one file changes it everywhere. The reusable pieces are in `client/src/components/`.

## Colors

I specifically chose a monochrome-themed app since it wasn't too aggressive and overwhelming for me in the eyes.

| Name | What it's for | Light mode | Dark mode |
| --- | --- | --- | --- |
| primary | labels, links, inactive tabs | #606060 | #a0a0a0 |
| accent | soft highlights and dividers | #e0e0e0 | #3a3a3a |
| bg | page background | #efefef | #000000 |
| surface | cards and panels | #ffffff | #1c1c1c |
| text | body text and main buttons | #222222 | #f5f5f5 |

Dark mode turns on by itself if the phone or computer is set to dark mode. This was based on user feedback.

**Is the text readable?** The text is readable since I focused on contrast and sizes to prevent anything from blending with each other.

## Type

The font family is Inter.

| Name | Size | Used for |
| --- | --- | --- |
| Heading | 30px, bold | the title of each screen |
| Subheading | 19px, bold | section titles |
| Body | 16px | normal text, buttons, inputs |
| Small | 13px | captions and labels |

In my plan the heading was 24px and the subheading was 18px. I made them a little bigger in the app since it showed up a little too small in actual code.

## Spacing

- **8px** between things that belong together
- **24px** between sections
- **16px** at the edge of the screen

## Components

| Piece | What it is | Where it shows up |
| --- | --- | --- |
| Button | main, light and text-only styles | everywhere |
| Input | a labelled field | add/edit order, payments, login |
| Status badge | ordered, shipped, in transit, delivered | orders list, order detail |
| Item row | one item with its price and quantity | order detail, add/edit order |
| Payment row | one payment | order detail, payments |
| Order card | a short summary of one order | dashboard, orders |
| Search bar | search box | orders, payments |
| Tab bar | the main menu: Home, Orders, Payments, More | every screen |

I added two pieces after the plan: a switch (for filters) and a top bar with the logo and account button.

**Status badges, darkest to lightest:** delivered (dark, with a check mark), in transit (medium grey, with a pulsing dot), shipped (light grey), ordered (outline only).

**What buttons and fields do:**
- **Hover:** they get a little darker or lighter.
- **Focus:** a clear dark outline shows where you are when using the keyboard. I never removed it.
- **Disabled:** the button fades out and can't be clicked.
- **Loading:** the payment button is disabled and says "Saving..." until it's done.

## Phone and computer

On a phone the tab bar sits at the bottom. From 768px wide it moves to the left side. At the same point, the lists of orders and payments switch from stacked cards to rows.

## Loading, empty and error screens

- **Loading:** grey boxes that shimmer, and the words "Loading your orders...". If the server is slow to start, it says that can take up to a minute.
- **Empty:** one short sentence that says what to do next, like "No orders yet. Log the first one to start tracking what you owe."
- **Error:** one line saying what went wrong, for example "Could not save the payment" and the reason.
- **Data:** the normal screen.
