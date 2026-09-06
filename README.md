# JerOS

[https://jermybiju.github.io/JerOS/](https://jermybiju.github.io/JerOS/)

a web os i built for stardance. works in your browser, no install needed.

## what it does

it has a desktop with app icons, calculator with history sidebar that shows the full expression, file manager that opens folders, terminal with basic commands, notes that save to localStorage, drawing canvas, system tray with network battery volume. also dark/light mode and custom wallpaper upload.

## why i built this

honestly i just wanted to see if i could make a browser act like an os. started with terminal and notes then kept adding stuff. learned a lot about js and css along the way.

## stuff i wrote myself

calculator logic, file manager navigation, system tray with network,battery apis, terminal prompt color switching, most of the ui styling, dark/light mode fixes.

## annoying things i had to fix

calculator history kept showing duplicate headings, took me a while to figure out why. terminal prompt looked good in dark mode but vanished in light mode had to add separate colors. windows dragging and resizing was a pain. battery api doesnt work everywhere so had to add fallbacks.

## what i want to add next

window snapping, minimize animation, more terminal commands, maybe a music player if i have time.

## known issues

volume is fake, doesn't actually change system volume. drawings vanish on refresh because they're not saved. layout can get messy on small phone screens.

## credits

built by jermy biju
