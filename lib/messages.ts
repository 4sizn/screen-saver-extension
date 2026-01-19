export type MessageType = 'ACTIVATE' | 'DEACTIVATE' | 'GET_RANDOM_IMAGE';

export interface ActivateMessage {
  type: 'ACTIVATE';
}

export interface DeactivateMessage {
  type: 'DEACTIVATE';
}

export interface GetRandomImageMessage {
  type: 'GET_RANDOM_IMAGE';
}

export interface GetRandomImageResponse {
  success: boolean;
  dataUrl?: string; // base64 data URL
  error?: string;
}

export type Message = ActivateMessage | DeactivateMessage | GetRandomImageMessage;
