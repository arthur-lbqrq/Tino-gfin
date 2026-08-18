export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}
