@echo off
setlocal enabledelayedexpansion

:: Translate --long-flags to -short-flags for PowerShell.
:: PowerShell reserves --verbose as a common parameter, so it must become -v here.
set "PSARGS="
:arg_loop
if "%~1"=="" goto arg_done
set "ARG=%~1"
if /i "!ARG!"=="--verbose" ( set "PSARGS=!PSARGS! -v"       ) else ^
if /i "!ARG!"=="--down"    ( set "PSARGS=!PSARGS! -d"       ) else ^
if /i "!ARG!"=="--wipe"    ( set "PSARGS=!PSARGS! -w"       ) else ^
if /i "!ARG!"=="--yes"     ( set "PSARGS=!PSARGS! -y"       ) else ^
if /i "!ARG!"=="--help"    ( set "PSARGS=!PSARGS! -h"       ) else ^
if /i "!ARG!"=="--page"    ( set "PSARGS=!PSARGS! -p"       ) else ^
if /i "!ARG!"=="--orgname" ( set "PSARGS=!PSARGS! -n"       ) else ^
if /i "!ARG!"=="--remote"  ( set "PSARGS=!PSARGS! -r"       ) else ^
if /i "!ARG!"=="--email"   ( set "PSARGS=!PSARGS! -e"       ) else ^
                             ( set "PSARGS=!PSARGS! !ARG!" )
shift
goto arg_loop
:arg_done

where /q pwsh.exe
if %errorlevel% equ 0 (
  pwsh.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools.ps1" !PSARGS!
) else (
  powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools.ps1" !PSARGS!
)
