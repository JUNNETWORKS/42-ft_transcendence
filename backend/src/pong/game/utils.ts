import { v4 as uuidv4 } from 'uuid';

export const generateMatchID = () => {
  return uuidv4();
};

export const generateQueueID = () => {
  return uuidv4();
};
