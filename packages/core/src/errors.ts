export class FilepacksError extends Error {
  readonly hint?: string

  public constructor(message: string, hint?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'FilepacksError'
    this.hint = hint
  }
}
