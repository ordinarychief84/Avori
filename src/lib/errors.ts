// Lightweight shared error type. Lives on its own (no NextAuth / Prisma / next
// imports) so server logic and unit tests can throw/inspect it without pulling
// the whole auth stack into a test runner.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
