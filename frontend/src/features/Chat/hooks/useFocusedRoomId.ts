import { useLocation } from 'react-router-dom';

export const useFocusedChatRoomId = () => {
  const location = useLocation();
  const [feature, id] = location.pathname.split('/').filter((w) => !!w);
  return feature === 'chat' && id ? parseInt(id) : NaN;
};

export const useFocusedDmRoomId = () => {
  const location = useLocation();
  const [feature, id] = location.pathname.split('/').filter((w) => !!w);
  return feature === 'dm' && id ? parseInt(id) : NaN;
};
