Reproduction notes
- Clean commit: ed4646f0bcc327a622d6a123640f4b07fa6afca6
- Ran setup: created venv and installed package and pytest
- Initial tests failed because scripts/list_test_packages.py invoked 'pip' which was not on PATH in venv; FileNotFoundError.
- Made minimal fix to prefer pip executable and fall back to sys.executable -m pip.
- Re-ran tests with pytest option --net-pypiserver (tests skip starting local pypiserver) and all targeted tests passed: 68 passed, 1 skipped.
