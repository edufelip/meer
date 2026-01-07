type PushRegistrationHandler = () => void | Promise<void>;

let handler: PushRegistrationHandler | null = null;

export function setPushRegistrationHandler(next: PushRegistrationHandler | null) {
  handler = next;
}

export function triggerPushRegistration() {
  if (handler) {
    void handler();
  }
}
