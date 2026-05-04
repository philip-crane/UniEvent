@echo off
setlocal enabledelayedexpansion

:: Translate --long-flags to -short-flags for PowerShell.
:: PowerShell reserves --verbose as a common parameter, so it must become -v here.
set "PSARGS="
:arg_loop
if "%~1"=="" goto arg_done
set "ARG=%~1"
set "HANDLED="
if /i "!ARG!"=="--verbose" ( set "PSARGS=!PSARGS! -v" & set "HANDLED=1" )
if /i "!ARG!"=="--down"    ( set "PSARGS=!PSARGS! -d" & set "HANDLED=1" )
if /i "!ARG!"=="--wipe"    ( set "PSARGS=!PSARGS! -w" & set "HANDLED=1" )
if /i "!ARG!"=="--yes"     ( set "PSARGS=!PSARGS! -y" & set "HANDLED=1" )
if /i "!ARG!"=="--help"    ( set "PSARGS=!PSARGS! -h" & set "HANDLED=1" )
if /i "!ARG!"=="--page"    ( set "PSARGS=!PSARGS! -p" & set "HANDLED=1" )
if /i "!ARG!"=="--orgname" ( set "PSARGS=!PSARGS! -n" & set "HANDLED=1" )
if /i "!ARG!"=="--remote"  ( set "PSARGS=!PSARGS! -Remote" & set "HANDLED=1" )
if /i "!ARG!"=="--rebuild" ( set "PSARGS=!PSARGS! -Rebuild" & set "HANDLED=1" )
if /i "!ARG!"=="--email"   ( set "PSARGS=!PSARGS! -e" & set "HANDLED=1" )
if not defined HANDLED ( set "PSARGS=!PSARGS! !ARG!" )
shift
goto arg_loop
:arg_done

:: Check if pwsh (PowerShell Core) is available, otherwise fallback to powershell.exe (Windows PowerShell).
where /q pwsh.exe
if %errorlevel% equ 0 (
  pwsh.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools.ps1" !PSARGS!
) else (
  powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools.ps1" !PSARGS!
)
