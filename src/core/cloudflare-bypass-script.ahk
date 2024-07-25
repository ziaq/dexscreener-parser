#Requires AutoHotkey v2.0
CoordMode("Mouse", "Screen")  ; Sets the mouse coordinates relative to the entire screen

x := 536  ; Manually calculated x coordinates (using the Window Spy utility for AHKv2, which comes bundled with Autohotkey)
y := 554  ; Manually calculated y coordinates (using the Window Spy utility for AHKv2, which comes bundled with Autohotkey)

MouseMove x, y, 50  ; 50 is speed
Click  ; Perform a click at the current mouse position

ExitApp  ; Exits the script after execution