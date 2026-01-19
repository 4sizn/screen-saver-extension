export type MessageType = 'ACTIVATE' | 'DEACTIVATE';

export interface ActivateMessage {
  type: 'ACTIVATE';
}

export interface DeactivateMessage {
  type: 'DEACTIVATE';
}

export type Message = ActivateMessage | DeactivateMessage;
