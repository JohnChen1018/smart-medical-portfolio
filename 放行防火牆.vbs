Set sh = CreateObject("Shell.Application")
root = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.ShellExecute "cmd.exe", "/c cd /d """ & root & """ && scripts\open-firewall.bat", "", "runas", 0
