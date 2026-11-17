let acceptedOnEmailRegister = false;

export function markTermsAcceptedOnRegister(): void {
  acceptedOnEmailRegister = true;
}

export function hasAcceptedTermsOnRegister(): boolean {
  return acceptedOnEmailRegister;
}
