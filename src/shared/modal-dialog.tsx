import * as React from 'react';
import videojs, { VideoJsPlayer } from 'video.js';
import { createPortal } from 'react-dom';
import { VideoJsPBSPlayer } from '../player/player';

interface ModalPortalProps {
  children: React.ReactNode;
  modalContainer: HTMLElement;
}

interface CustomModalDialogProps {
  label: string;
  temporary: boolean;
  name?: string;
}

export function ModalPortal({ children, modalContainer }: ModalPortalProps) {
  if (!modalContainer) { 
    return; 
  }; 
  
  return <div>{createPortal(children, modalContainer)}</div>; 
}

export class CustomModalDialog extends videojs.getComponent('ModalDialog') {
  constructor(
    player: VideoJsPBSPlayer | VideoJsPlayer,
    options: CustomModalDialogProps
  ) {
    super(player, options);

    // We want to use our own existing methods for closing the modal, so we hide the built-in close button
    const closeButton = this.getChild('CloseButton');
    if (closeButton) closeButton.hide();
  }
}

videojs.registerComponent('CustomModalDialog', CustomModalDialog);
