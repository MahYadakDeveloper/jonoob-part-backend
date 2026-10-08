export const RegistrationRequestRejectedEventType = 'registration:request-rejected';
export type RegistrationRequestRejectedEventPayload = {
  phoneNumber: string;
  message: string;
};

export const RegistrationRequestConfirmedEventType = 'registration:request-confirmed';
export type RegistrationRequestConfirmedEventPayload = {
  phoneNumber: string;
};
