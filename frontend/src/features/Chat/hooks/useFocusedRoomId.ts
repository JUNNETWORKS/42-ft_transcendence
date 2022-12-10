import { useLocation } from 'react-router-dom';

export const useFocusedRoomId = () => {
  const location = useLocation();
  const [feature, id] = location.pathname.split('/').filter((w) => !!w);
  return feature === 'chat' && id ? parseInt(id) : NaN;
};
