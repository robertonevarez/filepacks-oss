Reproduction notes for issue yargs#2481

- The original report stated that parsing "fly away" produced: "Missing required argument: prompt" — implying yargs mis-identified the unknown command as the "build" command.
- I added two small reproduction scripts to the repository and exercised two interpretations of the input:
  - ['fly away'] (single argv element)
  - ['fly','away'] (split elements, equivalent to typical stringArgv)
- Observed behavior:
  - ['fly away'] -> "Unknown command: fly away"
  - ['fly','away'] -> "Unknown commands: fly, away"
- Conclusion: on this commit, yargs reports unknown commands correctly. I could not reproduce the "Missing required argument: prompt" message. The reporter's environment or their stringArgv behavior may differ.

Next steps (if further reproduction desired):
1. Ask the reporter for the exact stringArgv implementation they used or the exact argv array produced when they ran into the issue.
