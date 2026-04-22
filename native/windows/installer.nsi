Var newStartMenuLink
Var oldStartMenuLink
Var newDesktopLink
Var oldDesktopLink
Var oldShortcutName
Var oldMenuDirectory

!include "common.nsh"
!undef APP_EXECUTABLE_FILENAME
!define APP_EXECUTABLE_FILENAME "app.exe"

!include "MUI2.nsh"
!include "multiUser.nsh"
!include "allowOnlyOneInstallerInstance.nsh"
!include "installer.nsh"

!ifdef BUILD_UNINSTALLER
  !ifmacrodef customUnInstallSection
    !define MUI_COMPONENTSPAGE_NODESC
    !insertmacro MUI_UNPAGE_COMPONENTS
  !endif
!endif

!ifdef INSTALL_MODE_PER_ALL_USERS
  !ifdef BUILD_UNINSTALLER
    RequestExecutionLevel user
  !else
    RequestExecutionLevel admin
  !endif
!else
  RequestExecutionLevel user
!endif

!ifdef BUILD_UNINSTALLER
  SilentInstall silent
!else
  Var appExe
  Var launchLink
!endif

!ifdef ONE_CLICK
  !include "oneClick.nsh"
!else
  !include "assistedInstaller.nsh"
!endif

!insertmacro addLangs

!ifmacrodef customHeader
  !insertmacro customHeader
!endif

!macro installLayeredLauncher
  CreateDirectory "$INSTDIR\app"

  Push $R0
  Push $R1

  FindFirst $R0 $R1 "$INSTDIR\*.*"
  loop:
    StrCmp $R1 "" done
    StrCmp $R1 "." next
    StrCmp $R1 ".." next
    StrCmp $R1 "app" next
    StrCmp $R1 "${UNINSTALL_FILENAME}" next
    StrCmp $R1 "uninstallerIcon.ico" next

    Rename "$INSTDIR\$R1" "$INSTDIR\app\$R1"

    next:
      FindNext $R0 $R1
      Goto loop

  done:
    FindClose $R0

    Pop $R1
    Pop $R0

  File "/oname=app.exe" "${PROJECT_DIR}\.build\dotnet\windows-launcher\publish\app.exe"
  File "/oname=app.ico" "${BUILD_RESOURCES_DIR}\icon.ico"
!macroend

Function .onInit
  Call setInstallSectionSpaceRequired

  SetOutPath $INSTDIR
  ${LogSet} on

  !ifmacrodef preInit
    !insertmacro preInit
  !endif

  !ifdef DISPLAY_LANG_SELECTOR
    !insertmacro MUI_LANGDLL_DISPLAY
  !endif

  !ifdef BUILD_UNINSTALLER
    WriteUninstaller "${UNINSTALLER_OUT_FILE}"
    !insertmacro quitSuccess
  !else
    !insertmacro check64BitAndSetRegView

    !ifdef ONE_CLICK
      !insertmacro ALLOW_ONLY_ONE_INSTALLER_INSTANCE
    !else
      ${IfNot} ${UAC_IsInnerInstance}
        !insertmacro ALLOW_ONLY_ONE_INSTALLER_INSTANCE
      ${EndIf}
    !endif

    !insertmacro initMultiUser

    !ifmacrodef customInit
      !insertmacro customInit
    !endif

    !ifmacrodef addLicenseFiles
      InitPluginsDir
      !insertmacro addLicenseFiles
    !endif
  !endif
FunctionEnd

!ifndef BUILD_UNINSTALLER
  !include "installUtil.nsh"
!endif

Section "install" INSTALL_SECTION_ID
  !ifndef BUILD_UNINSTALLER
    !ifndef INSTALL_MODE_PER_ALL_USERS
      !ifndef ONE_CLICK
          ${if} $hasPerMachineInstallation == "1"
          ${andIf} ${Silent}
            ${ifNot} ${UAC_IsAdmin}
              ShowWindow $HWNDPARENT ${SW_HIDE}
              !insertmacro UAC_RunElevated
              ${Switch} $0
                ${Case} 0
                  ${Break}
                ${Case} 1223
                  ${Break}
                ${Default}
                  MessageBox mb_IconStop|mb_TopMost|mb_SetForeground "Unable to elevate, error $0"
                  ${Break}
              ${EndSwitch}
              Quit
            ${else}
              !insertmacro setInstallModePerAllUsers
            ${endIf}
          ${endIf}
      !endif
    !endif

    InitPluginsDir

    ${IfNot} ${Silent}
      SetDetailsPrint none
    ${endif}

    StrCpy $appExe "$INSTDIR\app.exe"

    !insertmacro setLinkVars

    !ifdef ONE_CLICK
      !ifdef HEADER_ICO
        File /oname=$PLUGINSDIR\installerHeaderico.ico "${HEADER_ICO}"
      !endif
      ${IfNot} ${Silent}
        !ifdef HEADER_ICO
          SpiderBanner::Show /MODERN /ICON "$PLUGINSDIR\installerHeaderico.ico"
        !else
          SpiderBanner::Show /MODERN
        !endif

        FindWindow $0 "#32770" "" $hwndparent
        FindWindow $0 "#32770" "" $hwndparent $0
        GetDlgItem $0 $0 1000
        SendMessage $0 ${WM_SETTEXT} 0 "STR:$(installing)"

        StrCpy $1 $hwndparent
        System::Call 'user32::ShutdownBlockReasonCreate(${SYSTYPE_PTR}r1, w "$(installing)")'
      ${endif}
      !insertmacro CHECK_APP_RUNNING
    !else
      ${ifNot} ${UAC_IsInnerInstance}
        !insertmacro CHECK_APP_RUNNING
      ${endif}
    !endif

    Var /GLOBAL keepShortcuts
    StrCpy $keepShortcuts "false"
    !insertmacro setIsTryToKeepShortcuts
    ${if} $isTryToKeepShortcuts == "true"
      ReadRegStr $R1 SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" KeepShortcuts

      ${if} $R1 == "true"
      ${andIf} ${FileExists} "$appExe"
        StrCpy $keepShortcuts "true"
      ${endIf}
    ${endif}

    !insertmacro uninstallOldVersion SHELL_CONTEXT
    !insertmacro handleUninstallResult SHELL_CONTEXT

    ${if} $installMode == "all"
      !insertmacro uninstallOldVersion HKEY_CURRENT_USER
      !insertmacro handleUninstallResult HKEY_CURRENT_USER
    ${endIf}

    SetOutPath $INSTDIR

    !ifdef UNINSTALLER_ICON
      File /oname=uninstallerIcon.ico "${UNINSTALLER_ICON}"
    !endif

    !insertmacro installApplicationFiles
    !insertmacro installLayeredLauncher
    !insertmacro registryAddInstallInfo
    !insertmacro addStartMenuLink $keepShortcuts
    !insertmacro addDesktopLink $keepShortcuts

    ${if} ${FileExists} "$newStartMenuLink"
      StrCpy $launchLink "$newStartMenuLink"
    ${else}
      StrCpy $launchLink "$appExe"
    ${endIf}

    !ifmacrodef registerFileAssociations
      !insertmacro registerFileAssociations
    !endif

    !ifmacrodef customInstall
      !insertmacro customInstall
    !endif

    !macro doStartApp
      HideWindow
      !insertmacro StartApp
    !macroend

    !ifdef ONE_CLICK
      !ifdef RUN_AFTER_FINISH
        ${ifNot} ${Silent}
        ${orIf} ${isForceRun}
          !insertmacro doStartApp
        ${endIf}
      !else
        ${if} ${isForceRun}
          !insertmacro doStartApp
        ${endIf}
      !endif
      !insertmacro quitSuccess
    !else
      ${if} ${isForceRun}
      ${andIf} ${Silent}
        !insertmacro doStartApp
      ${endIf}
    !endif
  !endif
SectionEnd

Function setInstallSectionSpaceRequired
  !insertmacro setSpaceRequired ${INSTALL_SECTION_ID}
FunctionEnd

!ifdef BUILD_UNINSTALLER
  !include "uninstaller.nsh"
!endif
