#Requires AutoHotkey v2.0
CoordMode("Mouse", "Window")  ; Sets the mouse coordinates relative to the active window

x := A_Args[1]  ; Takes the first argument as the x-coordinate
y := A_Args[2]  ; Takes the second argument as the y-coordinate

MouseMove x, y, 50  ; 50 is speed
Click  ;

ExitApp  ;