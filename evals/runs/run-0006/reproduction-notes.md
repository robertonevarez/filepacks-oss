Issue pypa-pipx-1693 is an enhancement report: executables of dependencies inside a pipx-managed venv are present but not added to PATH when running the program.

Reproduction (manual):
1. Install a package that depends on another package which provides an executable (A depends on B with console_script).
2. Ensure pipx installs A without --include-deps.
3. Run A via pipx and observe that executable from dependency B is not in PATH.

Automated reproduction would require creating a small package fixture and running pipx run/install in an environment where network downloads are allowed; tests in upstream repo rely on testdata and package cache which failed to download in this environment.
