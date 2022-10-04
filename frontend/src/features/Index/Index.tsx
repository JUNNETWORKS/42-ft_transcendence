import { css, Typography, Box } from '@mui/material';

export const Index = () => {
  return (
    <Box css={titleContainer}>
      <Typography css={title}>ft_pong</Typography>
      <Box css={menuContainer}>
        <Typography css={menu}>Game</Typography>
        <Typography css={menu}>Profile</Typography>
        <Typography css={menu}>Chat</Typography>
      </Box>
    </Box>
  );
};

const menu = css`
  display: flex;
  justify-content: center;
  font-size: 48px;
`;

const menuContainer = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
`;

const title = css`
  display: flex;
  justify-content: center;
  font-size: 96px;
`;

const titleContainer = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;

  margin-top: 136px;
  gap: 136px;
`;
